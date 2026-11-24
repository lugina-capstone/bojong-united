import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

/** Kerangka halaman setelah masuk: sidebar 240 px (drawer < 1024 px), header sticky, konten. */
function AppShell({
  children,
  ...header
}: React.ComponentProps<typeof Header> & { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <Sidebar access={header.access} workspace={header.workspace} />
      <div className="flex min-h-dvh flex-col lg:pl-60">
        <Header {...header} />
        <main id="konten" className="flex-1 px-4 py-6 sm:px-8 lg:px-12 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export { AppShell };
