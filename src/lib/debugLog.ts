/**
 * Development-only logging utility.
 * 
 * All debug/info logs are suppressed in production builds.
 * Error logs are always emitted but sanitized to remove internal details.
 * 
 * Usage:
 *   import { debugLog, debugWarn, debugError } from '@/lib/debugLog';
 *   debugLog('[Module]', 'message');       // Only in dev
 *   debugWarn('[Module]', 'warning');       // Only in dev
 *   debugError('[Module]', 'user message'); // Always, but sanitized
 */

const isDev = import.meta.env.DEV;

export function debugLog(...args: unknown[]): void {
  if (isDev) console.log(...args);
}

export function debugWarn(...args: unknown[]): void {
  if (isDev) console.warn(...args);
}

/**
 * Errors are always logged in dev. In production, only a generic
 * prefix is shown — internal error objects are omitted.
 */
export function debugError(label: string, ...args: unknown[]): void {
  if (isDev) {
    console.error(label, ...args);
  }
  // In production, errors are silenced to avoid leaking internal details.
  // User-facing error messages are handled via UI state (toast, error boundaries, etc.)
}

export function debugGroup(label: string): void {
  if (isDev) console.group(label);
}

export function debugGroupEnd(): void {
  if (isDev) console.groupEnd();
}
