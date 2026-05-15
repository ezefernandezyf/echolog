import { useEffect } from 'react';

/**
 * Moves focus to the first element matching `selector` on component mount.
 * Used for WCAG 2.4.3 (Focus Order): after client-side navigation, focus
 * must move to the page heading so screen readers announce the new page.
 *
 * Gates on `[role="dialog"]` presence — if a modal is open, the hook skips
 * to avoid conflicts with modal focus restoration.
 */
export function useFocusOnMount(selector: string) {
  useEffect(() => {
    if (document.querySelector('[role="dialog"]')) return;

    const frame = requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) return;

      // Headings aren't focusable by default — add tabindex=-1 temporarily
      // so screen readers can move focus and announce the content.
      const hadTabIndex = el.hasAttribute('tabindex');
      const prevTabIndex = el.getAttribute('tabindex');
      el.setAttribute('tabindex', '-1');
      el.focus();

      // Restore on blur so the element doesn't remain in the tab order.
      const handleBlur = () => {
        el.removeEventListener('blur', handleBlur);
        if (hadTabIndex) {
          el.setAttribute('tabindex', prevTabIndex ?? '');
        } else {
          el.removeAttribute('tabindex');
        }
      };
      el.addEventListener('blur', handleBlur);
    });

    return () => cancelAnimationFrame(frame);
  }, [selector]);
}
