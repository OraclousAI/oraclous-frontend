// Session vault — the platform storage primitive for the ONE credential allowed to persist:
// the rotating refresh token (CLAUDE.md §1.5). Access tokens stay in memory only.
//
// Mechanics: IndexedDB holds an AES-GCM-encrypted payload plus the non-extractable CryptoKey
// that encrypts it. Honest threat model: the non-extractable key blocks ON-ORIGIN exfiltration
// (XSS can use the key while running but cannot export it) and defeats casual storage-dump
// scraping; it does NOT protect against an attacker with filesystem access to the browser
// profile — browsers serialise the key material to disk beside the ciphertext, so at-rest
// security equals the browser profile's. The genuine fix for that class is the gateway
// HttpOnly-cookie follow-up tracked in the gap log. Replay is bounded server-side regardless:
// refresh tokens are single-use (rotation + family-revoke reuse detection).
//
// Concurrency contract:
// - All mutations are serialised through a per-tab queue AND resolve only on the IndexedDB
//   transaction's `complete` event, so "written" means committed, in call order.
// - Cross-tab, every read-present-rotate cycle and every write happens under the
//   `oraclous-session` Web Lock (withSessionLock). Browsers without the Web Locks API degrade
//   to no persistence at all (vaultSupported=false) — multi-tab rotation without a lock would
//   trip the backend's reuse detection and revoke the whole token family.
// - Reads are discriminated: 'empty' (no stored session — e.g. logged out elsewhere) is a
//   different answer than 'unavailable' (storage/crypto broken), because callers may fall back
//   to an in-memory token only when the vault is unavailable, never when it was cleared.

export interface VaultPayload {
  readonly refreshToken: string;
}

export type VaultReadResult =
  | { readonly kind: 'value'; readonly value: VaultPayload }
  | { readonly kind: 'empty' }
  | { readonly kind: 'unavailable' };

const DB_NAME = 'oraclous-session';
const DB_VERSION = 1;
const STORE = 'vault';
const KEY_ROW = 'key';
const SESSION_ROW = 'session';
const LOCK_NAME = 'oraclous-session';

/** Whether persistence is on at all — IndexedDB + WebCrypto + Web Locks, or nothing. */
export const vaultSupported: boolean =
  typeof indexedDB !== 'undefined' &&
  typeof crypto !== 'undefined' &&
  crypto.subtle !== undefined &&
  typeof navigator !== 'undefined' &&
  navigator.locks !== undefined;

/** Run fn holding the cross-tab session lock that serialises every vault read/rotate/write. */
export async function withSessionLock<T>(fn: () => Promise<T>): Promise<T> {
  // The lib types request() as resolving the callback's value un-awaited; cast to the real shape.
  if (vaultSupported) return (await navigator.locks.request(LOCK_NAME, fn)) as T;
  return fn();
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

// For mutations: resolve on the transaction's commit, not the request's success — a commit-time
// abort (e.g. quota) after onsuccess would otherwise count an uncommitted write as durable.
function mutate(db: IDBDatabase, op: (store: IDBObjectStore) => IDBRequest): Promise<void> {
  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORE, 'readwrite');
    op(txn.objectStore(STORE));
    txn.oncomplete = () => resolve();
    txn.onabort = () => reject(txn.error ?? new Error('IndexedDB transaction aborted'));
    txn.onerror = () => reject(txn.error ?? new Error('IndexedDB transaction failed'));
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
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
    await mutate(db, (store) => store.add(key, KEY_ROW));
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

// Per-tab mutation queue: ops apply strictly in call order regardless of how much async prep
// (key fetch, encryption) each one needs. The queue absorbs failures so one broken op doesn't
// wedge every later one.
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(op: () => Promise<T>): Promise<T> {
  const next = queue.then(op);
  queue = next.catch(() => undefined);
  return next;
}

/** Persist the latest refresh credential. Best-effort: failures are swallowed. */
export function vaultWrite(payload: VaultPayload): Promise<void> {
  if (!vaultSupported) return Promise.resolve();
  return enqueue(async () => {
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
        await mutate(db, (store) => store.put(row, SESSION_ROW));
      } finally {
        db.close();
      }
    } catch {
      // No persistence available — the session stays memory-only.
    }
  });
}

/** Read the stored refresh credential. 'empty' and 'unavailable' are deliberately distinct. */
export function vaultRead(): Promise<VaultReadResult> {
  if (!vaultSupported) return Promise.resolve({ kind: 'unavailable' });
  return enqueue<VaultReadResult>(async () => {
    let db: IDBDatabase;
    try {
      db = await openDb();
    } catch {
      return { kind: 'unavailable' };
    }
    try {
      const row = await request<CipherRow | undefined>(
        db.transaction(STORE, 'readonly').objectStore(STORE).get(SESSION_ROW)
      );
      if (row === undefined) return { kind: 'empty' };
      try {
        const key = await getOrCreateKey(db);
        // Fresh copy: structured-cloned arrays come back as Uint8Array<ArrayBufferLike>, which
        // the WebCrypto BufferSource type (and a SharedArrayBuffer backing) won't accept.
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
          (parsed as VaultPayload).refreshToken !== ''
        ) {
          return { kind: 'value', value: { refreshToken: (parsed as VaultPayload).refreshToken } };
        }
        // Decodable but malformed — drop it and report empty, never trigger a fallback.
        await mutate(db, (store) => store.delete(SESSION_ROW)).catch(() => undefined);
        return { kind: 'empty' };
      } catch {
        // Undecryptable (e.g. key replaced) — the stored value can never be used again, and a
        // stale token presented later would revoke the whole family. Drop it; report empty.
        await mutate(db, (store) => store.delete(SESSION_ROW)).catch(() => undefined);
        return { kind: 'empty' };
      }
    } catch {
      return { kind: 'unavailable' };
    } finally {
      db.close();
    }
  });
}

/** Drop the stored credential (logout / refresh rejected). The vault key is kept. */
export function vaultClear(): Promise<void> {
  if (!vaultSupported) return Promise.resolve();
  return enqueue(async () => {
    try {
      const db = await openDb();
      try {
        await mutate(db, (store) => store.delete(SESSION_ROW));
      } finally {
        db.close();
      }
    } catch {
      // Nothing stored anywhere — already "cleared".
    }
  });
}
