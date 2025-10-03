import { getAccounts, getProducts } from '@/lib/data';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { MainSidebar } from '@/components/main-sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const accounts = await getAccounts();
  const products = await getProducts();

  return (
    <SidebarProvider>
      <MainSidebar accounts={accounts} products={products} />
      <SidebarInset>
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
