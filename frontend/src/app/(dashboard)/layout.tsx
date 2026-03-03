export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <aside className="fixed left-0 top-0 h-full w-56 border-r border-neutral-200 bg-white">
        <nav className="p-4 text-sm text-neutral-600">Dashboard nav (Fase 6)</nav>
      </aside>
      <main className="pl-56 p-6">{children}</main>
    </div>
  );
}
