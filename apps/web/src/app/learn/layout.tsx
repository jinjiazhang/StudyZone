// Pass-through; individual /learn pages wrap themselves in AppShell as needed.
// The lesson player and completion screens render full-screen without the shell.
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
