import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen">

        <Sidebar />

        <div className="min-w-0 flex-1 overflow-x-hidden">
          <Navbar />

          <main className="w-full min-w-0 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>

      </div>
    </div>
  );
}