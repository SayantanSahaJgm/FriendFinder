/**
 * Test Utilities and Helpers
 * Common testing utilities for unit and integration tests
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { SessionProvider } from 'next-auth/react';

// ==================== Mock Data ====================

export const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  image: 'https://example.com/avatar.jpg',
  username: 'testuser',
  bio: 'Test bio',
  interests: ['coding', 'music'],
  age: 25,
  location: {
    type: 'Point',
    coordinates: [-122.4194, 37.7749], // San Francisco
  },
  isVerified: true,
  friends: [],
  createdAt: new Date('2024-01-01'),
  lastActive: new Date(),
};

export const mockFriendRequest = {
  id: 'req-123',
  from: 'user-456',
  to: 'user-123',
  status: 'pending',
  message: 'Hi, let\'s be friends!',
  createdAt: new Date(),
};

export const mockMessage = {
  id: 'msg-123',
  sender: 'user-456',
  receiver: 'user-123',
  content: 'Hello!',
  read: false,
  createdAt: new Date(),
};

export const mockNotification = {
  id: 'notif-123',
  userId: 'user-123',
  type: 'friend_request',
  title: 'New Friend Request',
  message: 'John Doe sent you a friend request',
  read: false,
  createdAt: new Date(),
};

export const mockLocation = {
  latitude: 37.7749,
  longitude: -122.4194,
  accuracy: 10,
  timestamp: Date.now(),
};

// ==================== Mock Session ====================

export const mockSession = {
  user: mockUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// ==================== Custom Render ====================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: typeof mockSession | null;
}

/**
 * Custom render with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  { session = mockSession, ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SessionProvider session={session}>
        {children}
      </SessionProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// ==================== API Mocking ====================

/**
 * Mock successful API response
 */
export function mockApiSuccess<T>(data: T, delay: number = 0) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

/**
 * Mock API error
 */
export function mockApiError(message: string = 'API Error', delay: number = 0) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay);
  });
}

/**
 * Mock fetch response
 */
export function mockFetchResponse<T>(data: T, status: number = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({ 'content-type': 'application/json' }),
  } as Response);
}

// ==================== Local Storage Mocking ====================

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
}

// ==================== Geolocation Mocking ====================

/**
 * Mock geolocation API
 */
export function mockGeolocation() {
  const mockGeolocation = {
    getCurrentPosition: jest.fn((success) =>
      Promise.resolve(
        success({
          coords: {
            latitude: mockLocation.latitude,
            longitude: mockLocation.longitude,
            accuracy: mockLocation.accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: mockLocation.timestamp,
        })
      )
    ),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  };

  Object.defineProperty(global.navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true,
  });

  return mockGeolocation;
}

// ==================== Socket.IO Mocking ====================

/**
 * Mock Socket.IO client
 */
export function mockSocketIO() {
  const listeners: Record<string, Function[]> = {};

  const mockSocket = {
    on: jest.fn((event: string, callback: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
    }),
    off: jest.fn((event: string, callback: Function) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(cb => cb !== callback);
      }
    }),
    emit: jest.fn((event: string, data: any) => {
      console.log(`Socket emit: ${event}`, data);
    }),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
    // Helper to trigger events
    trigger: (event: string, data: any) => {
      if (listeners[event]) {
        listeners[event].forEach(callback => callback(data));
      }
    },
  };

  return mockSocket;
}

// ==================== Timer Utilities ====================

/**
 * Wait for a specified time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for next tick
 */
export function waitForNextTick(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

/**
 * Wait for condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 50
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await wait(interval);
  }
}

// ==================== DOM Utilities ====================

/**
 * Simulate user typing
 */
export async function typeIntoInput(
  input: HTMLInputElement,
  text: string,
  delay: number = 50
) {
  for (const char of text) {
    input.value += char;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(delay);
  }
}

/**
 * Simulate file upload
 */
export function createMockFile(
  name: string = 'test.jpg',
  size: number = 1024,
  type: string = 'image/jpeg'
): File {
  const blob = new Blob(['a'.repeat(size)], { type });
  return new File([blob], name, { type });
}

// ==================== Network Utilities ====================

/**
 * Mock network delay
 */
export function mockNetworkDelay(min: number = 100, max: number = 500): Promise<void> {
  const delay = Math.random() * (max - min) + min;
  return wait(delay);
}

/**
 * Mock network error
 */
export function simulateNetworkError(): Promise<never> {
  return Promise.reject(new Error('Network Error'));
}

// ==================== IndexedDB Mocking ====================

/**
 * Mock IndexedDB
 */
export function mockIndexedDB() {
  const databases: Record<string, any> = {};

  const mockIDB = {
    open: jest.fn((name: string) => {
      if (!databases[name]) {
        databases[name] = {};
      }
      return Promise.resolve({
        name,
        objectStoreNames: [],
        createObjectStore: jest.fn(),
        transaction: jest.fn(),
      });
    }),
    deleteDatabase: jest.fn((name: string) => {
      delete databases[name];
      return Promise.resolve();
    }),
  };

  global.indexedDB = mockIDB as any;
  return mockIDB;
}

// ==================== Intersection Observer Mocking ====================

/**
 * Mock IntersectionObserver
 */
export function mockIntersectionObserver() {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });

  global.IntersectionObserver = mockIntersectionObserver as any;
  return mockIntersectionObserver;
}

// ==================== Clipboard Mocking ====================

/**
 * Mock clipboard API
 */
export function mockClipboard() {
  const mockClipboard = {
    writeText: jest.fn((text: string) => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  };

  Object.defineProperty(navigator, 'clipboard', {
    value: mockClipboard,
    writable: true,
  });

  return mockClipboard;
}

// ==================== Performance Mocking ====================

/**
 * Mock performance API
 */
export function mockPerformance() {
  const mockPerformance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    timing: {
      navigationStart: Date.now() - 5000,
      loadEventEnd: Date.now() - 1000,
      domComplete: Date.now() - 2000,
      domLoading: Date.now() - 4000,
      requestStart: Date.now() - 4500,
      responseEnd: Date.now() - 3500,
    },
  };

  global.performance = mockPerformance as any;
  return mockPerformance;
}

// ==================== Console Mocking ====================

/**
 * Suppress console warnings/errors during tests
 */
export function suppressConsole() {
  const originalError = console.error;
  const originalWarn = console.warn;

  beforeAll(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });
}

// ==================== Custom Matchers ====================

/**
 * Custom Jest matchers
 */
export const customMatchers = {
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`,
    };
  },

  toHaveBeenCalledWithMatch(received: jest.Mock, expected: any) {
    const pass = received.mock.calls.some(call =>
      JSON.stringify(call[0]).includes(JSON.stringify(expected))
    );
    return {
      pass,
      message: () =>
        pass
          ? `expected mock not to have been called with ${JSON.stringify(expected)}`
          : `expected mock to have been called with ${JSON.stringify(expected)}`,
    };
  },
};

export default {
  mockUser,
  mockFriendRequest,
  mockMessage,
  mockNotification,
  mockLocation,
  mockSession,
  renderWithProviders,
  mockApiSuccess,
  mockApiError,
  mockFetchResponse,
  mockLocalStorage,
  mockGeolocation,
  mockSocketIO,
  wait,
  waitForNextTick,
  waitFor,
  typeIntoInput,
  createMockFile,
  mockNetworkDelay,
  simulateNetworkError,
  mockIndexedDB,
  mockIntersectionObserver,
  mockClipboard,
  mockPerformance,
  suppressConsole,
  customMatchers,
};
