'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { MainSidebar } from '@/components/main-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, PanelLeft } from 'lucide-react';
import { useUser } from '@/firebase';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      if (pathname !== '/login') {
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    // This will be briefly visible before the redirect happens.
    // Or you can return a loading spinner here as well.
    return null;
  }

  if (isMobile) {
    return (
      <SidebarProvider>
         <div className="flex flex-col h-screen">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 shrink-0">
             <Sheet>
                <SheetTrigger asChild>
                  <Button size="icon" variant="outline">
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  <MainSidebar />
                </SheetContent>
              </Sheet>
              <h1 className="text-lg font-semibold flex-1">Territory map</h1>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-0">{children}</main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset>
         <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold flex-1">Territory map</h1>
        </header>
        <div className="p-4 sm:p-6 lg:p-8 h-[calc(100vh-3.5rem)]">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
