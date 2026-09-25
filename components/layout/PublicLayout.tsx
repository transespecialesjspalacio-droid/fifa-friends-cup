import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Header />

      <main className="flex min-h-screen flex-col overflow-x-hidden md:ml-64">
        <Sidebar />

        <div className="w-full min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">{children}</div>
      </main>
    </div>
  );
}