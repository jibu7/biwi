export default function PlatformSubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout is now just a pass-through since the parent layout
  // already handles platform authentication and layout structure
  return <>{children}</>;
}
