import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F6F6F6] text-black">
      <Sidebar />
      <MobileNav />
      {/* Main content — offset by sidebar on desktop */}
      <main className="md:pl-60 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
