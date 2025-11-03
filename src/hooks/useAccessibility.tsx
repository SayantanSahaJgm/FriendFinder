/**
 * Accessibility Utilities
 * WCAG 2.1 AAA compliant utilities and hooks
 */

import React, { useEffect, useRef, useState } from 'react';

// ==================== Focus Management ====================

/**
 * Hook to trap focus within a container (for modals, dialogs)
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook to restore focus when component unmounts
 */
export function useFocusReturn() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;

    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);
}

/**
 * Hook to focus element on mount
 */
export function useAutoFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return ref;
}

// ==================== Keyboard Navigation ====================

/**
 * Hook for arrow key navigation
 */
export function useArrowKeyNavigation(
  itemCount: number,
  onSelect?: (index: number) => void
) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % itemCount);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + itemCount) % itemCount);
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(itemCount - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect?.(focusedIndex);
        break;
    }
  };

  return { focusedIndex, setFocusedIndex, handleKeyDown };
}

// ==================== Screen Reader ====================

/**
 * Hook to announce messages to screen readers
 */
export function useScreenReader() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return { announce };
}

/**
 * Screen reader only text component
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0">
      {children}
    </span>
  );
}

// ==================== Reduced Motion ====================

/**
 * Hook to detect if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);

    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReducedMotion;
}

// ==================== Color Contrast ====================

/**
 * Calculate color contrast ratio (WCAG)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const [rs, gs, bs] = [r, g, b].map(c =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG standards
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  large: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AAA') {
    return large ? ratio >= 4.5 : ratio >= 7;
  }
  return large ? ratio >= 3 : ratio >= 4.5;
}

// ==================== Skip Links ====================

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
    >
      {children}
    </a>
  );
}

// ==================== ARIA ====================

/**
 * Generate unique IDs for ARIA attributes
 */
let idCounter = 0;
export function useAriaId(prefix: string = 'aria'): string {
  const [id] = useState(() => `${prefix}-${++idCounter}`);
  return id;
}

/**
 * Hook to manage disclosure (expandable) state with ARIA
 */
export function useDisclosure(initialState: boolean = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const buttonId = useAriaId('disclosure-button');
  const panelId = useAriaId('disclosure-panel');

  const buttonProps = {
    id: buttonId,
    'aria-expanded': isOpen,
    'aria-controls': panelId,
    onClick: () => setIsOpen(!isOpen),
  };

  const panelProps = {
    id: panelId,
    role: 'region',
    'aria-labelledby': buttonId,
    hidden: !isOpen,
  };

  return { isOpen, setIsOpen, buttonProps, panelProps };
}

// ==================== Live Region ====================

interface LiveRegionProps {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

export function LiveRegion({
  children,
  priority = 'polite',
  atomic = true,
  relevant = 'all',
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {children}
    </div>
  );
}

// ==================== Form Validation ====================

/**
 * Hook for accessible form validation
 */
export function useFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getFieldProps = (name: string) => {
    const hasError = !!errors[name];
    const errorId = `${name}-error`;

    return {
      'aria-invalid': hasError,
      'aria-describedby': hasError ? errorId : undefined,
    };
  };

  const getErrorProps = (name: string) => {
    return {
      id: `${name}-error`,
      role: 'alert',
    };
  };

  return { errors, setErrors, getFieldProps, getErrorProps };
}

// ==================== High Contrast ====================

/**
 * Hook to detect high contrast mode
 */
export function usePrefersHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Windows High Contrast Mode detection
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersHighContrast(e.matches);
    mediaQuery.addEventListener('change', listener);

    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersHighContrast;
}

// ==================== Exports ====================

export default {
  useFocusTrap,
  useFocusReturn,
  useAutoFocus,
  useArrowKeyNavigation,
  useScreenReader,
  VisuallyHidden,
  usePrefersReducedMotion,
  getContrastRatio,
  meetsContrastRequirement,
  SkipLink,
  useAriaId,
  useDisclosure,
  LiveRegion,
  useFormValidation,
  usePrefersHighContrast,
};
