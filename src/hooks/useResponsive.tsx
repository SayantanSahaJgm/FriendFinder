/**
 * Responsive Design Utilities
 * Hooks and utilities for responsive design
 */

import React, { useState, useEffect } from 'react';

// ==================== Breakpoints ====================

export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

// ==================== Media Query Hook ====================

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    
    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } 
    // Older browsers
    else {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [query]);

  return matches;
}

// ==================== Breakpoint Hooks ====================

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= breakpoints['2xl']) setBreakpoint('2xl');
      else if (width >= breakpoints.xl) setBreakpoint('xl');
      else if (width >= breakpoints.lg) setBreakpoint('lg');
      else if (width >= breakpoints.md) setBreakpoint('md');
      else if (width >= breakpoints.sm) setBreakpoint('sm');
      else setBreakpoint('xs');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

export function useIsMobile() {
  return useMediaQuery(`(max-width: ${breakpoints.md - 1}px)`);
}

export function useIsTablet() {
  return useMediaQuery(
    `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`
  );
}

export function useIsDesktop() {
  return useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
}

// ==================== Window Size Hook ====================

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// ==================== Orientation Hook ====================

export type Orientation = 'portrait' | 'landscape';

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>('portrait');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOrientation = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    return () => window.removeEventListener('resize', updateOrientation);
  }, []);

  return orientation;
}

// ==================== Touch Device Detection ====================

export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore
      navigator.msMaxTouchPoints > 0
    );
  }, []);

  return isTouch;
}

// ==================== Responsive Classes ====================

export function responsiveClasses(
  base: string,
  sm?: string,
  md?: string,
  lg?: string,
  xl?: string,
  xxl?: string
): string {
  const classes = [base];
  if (sm) classes.push(`sm:${sm}`);
  if (md) classes.push(`md:${md}`);
  if (lg) classes.push(`lg:${lg}`);
  if (xl) classes.push(`xl:${xl}`);
  if (xxl) classes.push(`2xl:${xxl}`);
  return classes.join(' ');
}

// ==================== Conditional Rendering ====================

interface ResponsiveProps {
  children: React.ReactNode;
  showOn?: Breakpoint[];
  hideOn?: Breakpoint[];
}

export function Responsive({ children, showOn, hideOn }: ResponsiveProps) {
  const breakpoint = useBreakpoint();

  if (showOn && !showOn.includes(breakpoint)) return null;
  if (hideOn && hideOn.includes(breakpoint)) return null;

  return <>{children}</>;
}

// ==================== Responsive Value Hook ====================

type ResponsiveValue<T> = {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
  default: T;
};

export function useResponsiveValue<T>(values: ResponsiveValue<T>): T {
  const breakpoint = useBreakpoint();

  return values[breakpoint] ?? values.default;
}

// ==================== Container Query Hook ====================

export function useContainerQuery(
  ref: React.RefObject<HTMLElement>,
  query: string
): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (!ref.current || typeof window === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const width = entry.contentRect.width;
        // Simple width query parsing (e.g., "min-width: 500px")
        const match = query.match(/(\d+)px/);
        if (match) {
          const threshold = parseInt(match[1]);
          setMatches(query.includes('min-width') ? width >= threshold : width <= threshold);
        }
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, query]);

  return matches;
}

// ==================== Safe Area Insets ====================

export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateInsets = () => {
      const style = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
        right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
        bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);
    return () => window.removeEventListener('resize', updateInsets);
  }, []);

  return insets;
}

export default {
  breakpoints,
  useMediaQuery,
  useBreakpoint,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useWindowSize,
  useOrientation,
  useIsTouchDevice,
  responsiveClasses,
  Responsive,
  useResponsiveValue,
  useContainerQuery,
  useSafeAreaInsets,
};
