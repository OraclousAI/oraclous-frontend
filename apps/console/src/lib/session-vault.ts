// Session vault — the platform storage primitive for the ONE credential allowed to persist:
// the rotating refresh token (CLAUDE.md §1.5). Access tokens stay in memory only.
//
// Mechanics: IndexedDB holds an AES-GCM-encrypted payload plus the NON-EXTRACTABLE CryptoKey
// that encrypts it. The key can be used by code running on this origin but can never be
// exported, so a one-shot storage dump (the classic localStorage smash-and-grab, disk/backup
// reads) yields ciphertext only. This is containment, not immunity — code execution on the
// origin can still use the key — and the backend bounds replay: refresh tokens are single-use
// (rotation + family-revoke reuse detection), so the vault must always hold the latest copy.
//
// Every function is best-effort and non-throwing: when IndexedDB or WebCrypto is unavailable
// (private browsing, blocked storage), the vault silently degrades to "no persistence" and the
// app behaves exactly as before (memory-only session, refresh lands on /login).

export interface VaultPayload {
  readonly refreshToken: string;
  readonly email: string;
}

const DB_NAME = 'oraclous-session';
const DB_VERSION = 1;
const STORE = 'vault';
const KEY_ROW = 'key';
const SESSION_ROW = 'session';

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
    req.onblocked = () => reject(new Error('IndexedDB open blocked'));
  });
}

// Get the vault key, creating it on first use. `add` (not `put`) so a concurrent first-boot in
// another tab can't silently replace a key that already encrypted data — on a lost race we
// re-read the winner's key.
async function getOrCreateKey(db: IDBDatabase): Promise<CryptoKey> {
  const existing = await request<CryptoKey | undefined>(
    db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY_ROW)
  );
  if (existing !== undefined) return existing;
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
  try {
    await request(db.transaction(STORE, 'readwrite').objectStore(STORE).add(key, KEY_ROW));
    return key;
  } catch {
    const winner = await request<CryptoKey | undefined>(
      db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY_ROW)
    );
    if (winner === undefined) throw new Error('vault key unavailable');
    return winner;
  }
}

interface CipherRow {
  readonly iv: Uint8Array;
  readonly data: ArrayBuffer;
}

/** Persist the latest refresh credential. Best-effort: failures are swallowed. */
export async function vaultWrite(payload: VaultPayload): Promise<void> {
  try {
    const db = await openDb();
    try {
      const key = await getOrCreateKey(db);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(JSON.stringify(payload))
      );
      const row: CipherRow = { iv, data };
      await request(db.transaction(STORE, 'readwrite').objectStore(STORE).put(row, SESSION_ROW));
    } finally {
      db.close();
    }
  } catch {
    // No persistence available — the session stays memory-only.
  }
}

/** Read the stored refresh credential, or null when absent/undecryptable/unavailable. */
export async function vaultRead(): Promise<VaultPayload | null> {
  try {
    const db = await openDb();
    try {
      const row = await request<CipherRow | undefined>(
        db.transaction(STORE, 'readonly').objectStore(STORE).get(SESSION_ROW)
      );
      if (row === undefined) return null;
      const key = await getOrCreateKey(db);
      // Fresh copy: structured-cloned arrays come back as Uint8Array<ArrayBufferLike>, which the
      // WebCrypto BufferSource type (and a potential SharedArrayBuffer backing) won't accept.
      const plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(row.iv) },
        key,
        row.data
      );
      const parsed: unknown = JSON.parse(new TextDecoder().decode(plain));
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        typeof (parsed as VaultPayload).refreshToken === 'string' &&
        (parsed as VaultPayload).refreshToken !== '' &&
        typeof (parsed as VaultPayload).email === 'string'
      ) {
        return parsed as VaultPayload;
      }
      return null;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

/** Drop the stored credential (logout / refresh rejected). The vault key is kept. */
export async function vaultClear(): Promise<void> {
  try {
    const db = await openDb();
    try {
      await request(db.transaction(STORE, 'readwrite').objectStore(STORE).delete(SESSION_ROW));
    } finally {
      db.close();
    }
  } catch {
    // Nothing stored anywhere — already "cleared".
  }
}
