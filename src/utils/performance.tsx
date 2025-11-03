/**
 * Performance Optimization Utilities
 * Image optimization, lazy loading, code splitting helpers
 */

import React, { lazy, Suspense, ComponentType, LazyExoticComponent } from 'react';
import Image from 'next/image';

// ==================== Image Optimization ====================

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized image component with automatic WebP conversion and lazy loading
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 75,
  className,
  objectFit = 'cover',
  onLoad,
  onError,
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      quality={quality}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      className={className}
      style={{ objectFit }}
      onLoad={onLoad}
      onError={onError}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  return widths
    .map((width) => `${baseUrl}?w=${width} ${width}w`)
    .join(', ');
}

/**
 * Generate blur data URL for placeholder
 */
export function generateBlurDataURL(width: number = 10, height: number = 10): string {
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) return '';

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#e5e7eb');
    gradient.addColorStop(1, '#d1d5db');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  return canvas.toDataURL();
}

// ==================== Lazy Loading ====================

interface LazyComponentProps {
  fallback?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Lazy load component with error boundary
 */
export function LazyLoadComponent({
  fallback = <div>Loading...</div>,
  error = <div>Error loading component</div>,
  children,
}: LazyComponentProps) {
  return (
    <Suspense fallback={fallback}>
      <ErrorBoundary fallback={error}>{children}</ErrorBoundary>
    </Suspense>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Create lazy loaded component with retry logic
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries: number = 3,
  interval: number = 1000
): LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptImport = (attemptsLeft: number) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (attemptsLeft === 1) {
              reject(error);
              return;
            }
            setTimeout(() => {
              attemptImport(attemptsLeft - 1);
            }, interval);
          });
      };
      attemptImport(retries);
    });
  });
}

// ==================== Code Splitting ====================

/**
 * Dynamic import with preload
 */
export function preloadComponent<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): void {
  factory();
}

/**
 * Route-based code splitting helper
 */
export function createLazyRoute<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  return function RouteComponent(props: any) {
    return (
      <Suspense fallback={fallback || <div>Loading page...</div>}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// ==================== Intersection Observer ====================

/**
 * Hook for intersection observer (lazy load on scroll)
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIntersecting] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

/**
 * Lazy load component when in viewport
 */
interface LazyLoadOnViewProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}

export function LazyLoadOnView({
  children,
  fallback = null,
  rootMargin = '50px',
  threshold = 0.01,
}: LazyLoadOnViewProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersectionObserver(ref, { rootMargin, threshold });

  return (
    <div ref={ref}>
      {isIntersecting ? children : fallback}
    </div>
  );
}

// ==================== Resource Preloading ====================

/**
 * Preload resource (image, script, style)
 */
export function preloadResource(
  href: string,
  as: 'image' | 'script' | 'style' | 'font' | 'fetch'
): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;

  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
}

/**
 * Prefetch resource for future navigation
 */
export function prefetchResource(href: string): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;

  document.head.appendChild(link);
}

// ==================== Debounce & Throttle ====================

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * React hook for debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * React hook for throttled value
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRan = React.useRef(Date.now());

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// ==================== Memoization ====================

/**
 * Memoize expensive function results
 */
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// ==================== Virtual Scrolling ====================

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  windowHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}

/**
 * Virtual scroll component for large lists
 */
export function VirtualScroll<T>({
  items,
  itemHeight,
  windowHeight,
  renderItem,
  overscan = 3,
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + windowHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      style={{ height: windowHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== Performance Monitoring ====================

/**
 * Measure component render time
 */
export function measureRenderTime(componentName: string) {
  return function <P extends object>(Component: ComponentType<P>) {
    return function MeasuredComponent(props: P) {
      React.useEffect(() => {
        const start = performance.now();
        
        return () => {
          const end = performance.now();
          console.log(`${componentName} render time: ${(end - start).toFixed(2)}ms`);
        };
      });

      return <Component {...props} />;
    };
  };
}

/**
 * Log performance metrics
 */
export function logPerformanceMetrics(): void {
  if (typeof window === 'undefined' || !window.performance) return;

  const perfData = window.performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
  const connectTime = perfData.responseEnd - perfData.requestStart;
  const renderTime = perfData.domComplete - perfData.domLoading;

  console.log('Performance Metrics:', {
    pageLoadTime: `${pageLoadTime}ms`,
    connectTime: `${connectTime}ms`,
    renderTime: `${renderTime}ms`,
  });
}

export default {
  OptimizedImage,
  generateSrcSet,
  generateBlurDataURL,
  LazyLoadComponent,
  lazyWithRetry,
  preloadComponent,
  createLazyRoute,
  useIntersectionObserver,
  LazyLoadOnView,
  preloadResource,
  prefetchResource,
  debounce,
  throttle,
  useDebounce,
  useThrottle,
  memoize,
  VirtualScroll,
  measureRenderTime,
  logPerformanceMetrics,
};
