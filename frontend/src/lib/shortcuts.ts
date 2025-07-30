/**
 * Cross-platform keyboard shortcut utilities
 * Handles the differences between Mac (⌘) and Windows/Linux (Ctrl) key combinations
 */

/**
 * Detect if the user is on Mac
 * Safe for SSR - only checks when in browser
 */
export const isMac = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
};

/**
 * Get the modifier key symbol for the current platform
 * @returns ⌘ for Mac, Ctrl for Windows/Linux
 */
export const getModifierKey = (): string => {
  return isMac() ? '⌘' : 'Ctrl';
};

/**
 * Convert a shortcut key to be platform appropriate
 * @param key - The key letter (e.g., "S", "T", "R")
 * @returns Platform-appropriate shortcut string
 */
export const getPlatformShortcut = (key: string): string => {
  if (!key) return '';
  
  return isMac() ? `⌘${key}` : `Ctrl+${key}`;
};

/**
 * Keyboard shortcut key definitions
 */
export const SHORTCUTS = {
  SETUP: 'S',
  TRANSACTIONS: 'T', 
  REPORTS: 'R',
  SEARCH: '/',
  HELP: '?',
} as const;
