// App-wide toasts — a tiny console-native notification system (no Tailwind, matches the inline-style
// design language). useToast() exposes success/error/info; the provider renders an aria-live stack
// that auto-dismisses. Mounted once at the app root.
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  readonly id: number;
  readonly kind: ToastKind;
  readonly message: string;
}

export interface ToastApi {
  success(message: string): void;
  error(message: string): void;
  info(message: string): void;
  dismiss(id: number): void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (api === null) throw new Error('useToast must be used within <ToastProvider>');
  return api;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const tm = timers.current.get(id);
    if (tm !== undefined) {
      clearTimeout(tm);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      nextId.current += 1;
      const id = nextId.current;
      setToasts((list) => [...list, { id, kind, message }]);
      // errors linger a little longer than confirmations.
      const tm = setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 4000);
      timers.current.set(id, tm);
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={styles.region} aria-label="Notifications">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            aria-live={t.kind === 'error' ? 'assertive' : 'polite'}
            style={{ ...styles.toast, ...KIND[t.kind] }}
          >
            <span style={styles.msg}>{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              style={styles.close}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const KIND: Record<ToastKind, CSSProperties> = {
  success: {
    background: 'var(--success-bg, #e7f3ec)',
    borderColor: 'var(--success, #2e8b57)',
  },
  error: {
    background: 'var(--error-bg, #fbeae8)',
    borderColor: 'var(--error, #c8412c)',
  },
  info: {
    background: 'var(--paper-soft, #eceae5)',
    borderColor: 'var(--rule, #d7d6d2)',
  },
};

const styles = {
  region: {
    position: 'fixed',
    bottom: 16,
    right: 16,
    zIndex: 1000,
    display: 'grid',
    gap: 8,
    width: 'min(360px, calc(100vw - 32px))',
    pointerEvents: 'none',
  },
  toast: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '11px 12px',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 10,
    boxShadow: '0 6px 24px rgba(11, 18, 32, 0.12)',
    pointerEvents: 'auto',
  },
  msg: { flex: 1, fontSize: 13, lineHeight: 1.45, color: 'var(--ink, #0b1220)' },
  close: {
    appearance: 'none',
    border: 'none',
    background: 'transparent',
    color: 'var(--ink, #0b1220)',
    fontSize: 18,
    lineHeight: 1,
    cursor: 'pointer',
    padding: 0,
    width: 20,
    height: 20,
    opacity: 0.7,
  },
} satisfies Record<string, CSSProperties>;
