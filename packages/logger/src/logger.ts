/**
 * Logger utility factory.
 *
 * Production Builds:
 * - All logging calls (log, warn, error) are completely removed by the build process
 * thanks to the `if (import.meta.env.DEV)` guards. Zero runtime overhead.
 *
 * Development Mode (`vite dev`):
 * - Logging is enabled by default.
 * - Filtering by scope is available using localStorage.
 * - Set the `DEBUG_SCOPES` item in localStorage to control output:
 * - `localStorage.setItem('DEBUG_SCOPES', '*')`: Show logs from ALL scopes.
 * * `localStorage.setItem('DEBUG_SCOPES', 'powcaptcha::widget,powcaptcha::core')`: Show logs ONLY from ScopeA and ScopeB.
 * * `localStorage.setItem('DEBUG_SCOPES', 'powcaptcha::widget:*')`: Show logs from scopes starting with "Component:".
 * * `localStorage.setItem('DEBUG_SCOPES', 'false')`  Show NO logs (except errors).
 * - Error logs (`logger.error`) are generally shown in development regardless of the filter,
 * unless explicitly disabled by setting `DEBUG_SCOPES` to a value that doesn't match
 * and doesn't include the error's scope or a wildcard.
 */

/**
 * Checks if a specific scope is enabled for logging in development mode.
 * Reads the 'DEBUG_SCOPES' value from localStorage.
 * @param scope The scope string to check.
 * @returns True if the scope should be logged, false otherwise.
 */
function isScopeEnabled(scope: string): boolean {
  if (typeof localStorage === 'undefined') {
    // in non browser environments (e.g., SSR), we assume all scopes are enabled
    // but we disable logging in production
    return import.meta.env && !import.meta.env.PROD;
  }
  const debugScopes = localStorage.getItem('DEBUG_SCOPES');

  if (debugScopes === null) {
    return true;
  }

  if (debugScopes === '*') {
    return true;
  }

  if (debugScopes === 'false') {
    return false;
  }

  const enabledScopes = debugScopes.split(',').map((s) => s.trim());

  return enabledScopes.some((enabledScope) => {
    if (enabledScope.endsWith(':*')) {
      // Wildcard match (e.g., "Component:*")
      const prefix = enabledScope.slice(0, -1);
      return scope.startsWith(prefix);
    } else {
      // Exact match
      return scope === enabledScope;
    }
  });
}

export interface ScopedLogger {
  scope: string;
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Creates a scoped logger instance.
 * @param scope - A descriptive name for the logging scope (e.g., 'MyComponent', 'ApiService').
 * @returns A ScopedLogger object.
 */
export function createLogger(scope: string): ScopedLogger {
  const prefix = `[${scope}]`;
  return {
    scope,

    log: (...args: unknown[]): void => {
      if (import.meta.env.DEV) {
        if (isScopeEnabled(scope)) {
          console.log(prefix, ...args);
        }
      }
    },

    warn: (...args: unknown[]): void => {
      if (import.meta.env.DEV) {
        if (isScopeEnabled(scope)) {
          console.warn(prefix, ...args);
        }
      }
    },

    error: (...args: unknown[]): void => {
      if (import.meta.env.DEV) {
        console.error(prefix, ...args);
      }
    },
  };
}
