import { usePlatformShortcut } from '@/hooks/usePlatformShortcut';

interface ShortcutDisplayProps {
  shortcut: string;
  className?: string;
}

export const ShortcutDisplay: React.FC<ShortcutDisplayProps> = ({ shortcut, className }) => {
  const platformShortcut = usePlatformShortcut(shortcut);

  if (!platformShortcut) return null;

  return (
    <span className={className}>
      {platformShortcut}
    </span>
  );
};
