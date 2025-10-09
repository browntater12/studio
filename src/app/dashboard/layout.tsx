import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { MainSidebarClient } from '@/components/main-sidebar-client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <MainSidebarClient />
      <SidebarInset>
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
