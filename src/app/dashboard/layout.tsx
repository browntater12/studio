'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { MainSidebar } from '@/components/main-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, PanelLeft } from 'lucide-react';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  React.useEffect(() => {
    // When auth state is resolved and there's no user, redirect to login.
    if (!isAuthLoading && !user) {
      // Avoid redirect loops from the login page itself.
      if (pathname !== '/login') {
        router.replace('/login');
      }
    }
  }, [user, isAuthLoading, router, pathname]);
  
  const isLoading = isAuthLoading || (user && isProfileLoading);

  // While the auth state or user profile is loading, show a full-screen loader.
  // This is crucial to prevent rendering the dashboard (and its data-fetching components)
  // for an unauthenticated user or before the profile is available.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If loading is finished and there is still no user, we are about to redirect.
  // We return null to avoid a flash of un-styled content. The useEffect above handles the redirect.
  if (!user || !userProfile) {
     if (!isAuthLoading && !isProfileLoading) {
        router.replace('/login');
    }
    return (
       <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }


  // If we've reached this point, we have a user and their profile. Render the dashboard.
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
