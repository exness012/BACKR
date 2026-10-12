import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  (window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
  (window as unknown as { global: typeof window }).global = window;
  if (!(window as unknown as { process: unknown }).process) {
    (window as unknown as { process: { env: Record<string, string> } }).process = { env: {} };
  }

  // Intercept Object.defineProperty for wallet extensions conflicting on window.ethereum or window.solana
  try {
    const origDefineProperty = Object.defineProperty;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Object as any).defineProperty = function <T>(
      target: T,
      prop: PropertyKey,
      descriptor: PropertyDescriptor & ThisType<unknown>
    ): T {
      try {
        return (origDefineProperty as (o: unknown, p: PropertyKey, d: PropertyDescriptor) => T)(
          target,
          prop,
          descriptor
        );
      } catch (err) {
        if (
          (target === window || target === globalThis) &&
          (prop === 'ethereum' || prop === 'solana')
        ) {
          try {
            if ('value' in descriptor) {
              (target as unknown as Record<PropertyKey, unknown>)[prop] = descriptor.value;
            }
          } catch {
            // Silently tolerate if not directly assignable
          }
          return target;
        }
        throw err;
      }
    };
  } catch {
    // Ignore if Object.defineProperty cannot be modified
  }

  // Ensure window.fetch has both getter and setter so legacy ponyfills doing `this.fetch = ...` or `window.fetch = ...` don't throw
  try {
    if (typeof window.fetch === 'function') {
      const nativeFetch = window.fetch.bind(window);
      let currentFetch: typeof window.fetch = nativeFetch;
      Object.defineProperty(window, 'fetch', {
        get() {
          return currentFetch;
        },
        set(val: unknown) {
          if (typeof val === 'function') {
            currentFetch = val as typeof window.fetch;
          }
        },
        configurable: true,
        enumerable: true,
      });
    }
  } catch {
    // Ignore if not reconfigurable
  }

  // Suppress third-party wallet extension injection errors from breaking the page
  window.addEventListener(
    'error',
    (event) => {
      const msg = event?.message || '';
      const filename = event?.filename || '';
      if (
        msg.includes('Cannot redefine property: ethereum') ||
        msg.includes('Cannot redefine property: solana') ||
        filename.includes('chrome-extension://') ||
        filename.includes('moz-extension://')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

if (typeof globalThis !== 'undefined') {
  (globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
}

