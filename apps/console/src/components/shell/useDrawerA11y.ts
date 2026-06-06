// Accessibility for the mobile navigation drawer. While `open`, it traps Tab focus inside the
// drawer, closes on Escape, locks body scroll behind the drawer, and restores focus to the trigger
// (the hamburger) on close. It is a no-op while closed. `open` is only ever true on mobile — the
// trigger is display:none ≥768px — so no media-query guard is needed.
import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null
  );
}

export function useDrawerA11y({
  open,
  drawerRef,
  triggerRef,
  onClose,
}: {
  open: boolean;
  drawerRef: RefObject<HTMLElement>;
  triggerRef: RefObject<HTMLButtonElement>;
  onClose: () => void;
}): void {
  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    if (drawer === null) return;

    // Move focus into the drawer: first focusable element, else the drawer container itself.
    (focusableWithin(drawer)[0] ?? drawer).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = focusableWithin(drawer);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (first === undefined || last === undefined) {
        e.preventDefault();
        return;
      }
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !drawer.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !drawer.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    // Lock scrolling of the page behind the drawer.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      // Return focus to the hamburger that opened the drawer.
      triggerRef.current?.focus();
    };
  }, [open, drawerRef, triggerRef, onClose]);
}
