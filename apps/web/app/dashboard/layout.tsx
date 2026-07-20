import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    // We add padding (p-4 sm:p-6) around the entire screen to create the floating "island" effect
    <div className="flex h-screen overflow-hidden p-3 sm:p-5 gap-4">
      {/* Sidebar is its own floating island */}
      <div className="h-full shrink-0 relative z-40 hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full gap-4">
        {/* Topbar is also floating */}
        <div className="shrink-0 relative z-30">
          <Topbar />
        </div>
        
        {/* Main Content Area */}
        {/* We use a glass panel for the main content background to match the aesthetic */}
        <main className="flex-1 overflow-auto rounded-[var(--radius-xl)] glass-panel p-6 lg:p-8 relative scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}