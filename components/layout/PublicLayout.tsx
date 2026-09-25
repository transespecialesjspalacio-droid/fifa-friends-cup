import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="ml-64 min-h-screen flex flex-col overflow-x-hidden">
        <Sidebar />

        <div className="flex-1 w-full px-4 py-6 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}