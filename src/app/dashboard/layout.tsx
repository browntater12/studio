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
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);

  React.useEffect(() => {
    // When auth state is resolved and there's no user, redirect to login.
    if (!isUserLoading && !user) {
      // Avoid redirect loops from the login page itself.
      if (pathname !== '/login') {
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, router, pathname]);

  // While the auth state is loading, show a full-screen loader.
  // This is crucial to prevent rendering the dashboard (and its data-fetching components)
  // for an unauthenticated user.
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If loading is finished and there is still no user, we are about to redirect.
  // We return null to avoid a flash of un-styled content. The useEffect above handles the redirect.
  if (!user) {
    return null;
  }

  // If we've reached this point, we have a user. Render the dashboard.
  if (isMobile) {
    return (
      <SidebarProvider>
         <div className="flex flex-col h-screen">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 shrink-0">
             <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                <SheetTrigger asChild>
                  <Button size="icon" variant="outline">
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  <MainSidebar onNavigate={() => setMobileSheetOpen(false)} />
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
            <h1 className="text-lg font-semibold flex-1">Territory Manager</h1>
        </header>
        <div className="p-4 sm:p-6 lg:p-8 h-[calc(100vh-3.5rem)]">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
