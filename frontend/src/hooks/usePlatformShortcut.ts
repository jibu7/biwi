import { useState, useEffect } from 'react';
import { getPlatformShortcut } from '@/lib/shortcuts';

/**
 * Hook to get platform-appropriate shortcuts that works with SSR
 * Returns the shortcut formatted for the current platform
 */
export const usePlatformShortcut = (key: string): string => {
  const [shortcut, setShortcut] = useState('');

  useEffect(() => {
    // Only set the shortcut on client side to avoid SSR issues
    setShortcut(getPlatformShortcut(key));
  }, [key]);

  return shortcut;
};

/**
 * Hook to detect if user is on Mac (client-side only)
 */
export const useIsMac = (): boolean => {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  return isMac;
};
