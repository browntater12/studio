
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PlusCircle, Building, Search, Package, LogIn, LogOut, PanelLeft, Map } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useAuth, useDoc } from '@/firebase';
import { collection, orderBy, query, where, doc } from 'firebase/firestore';

import { type Account, type UserProfile } from '@/lib/types';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { Input } from './ui/input';
import { ThemeToggle } from './theme-toggle';
import { SidebarMenuSkeleton } from './ui/sidebar';
import { User } from 'firebase/auth';
import { signOut } from '@/firebase/non-blocking-login';
import { useIsMobile } from '@/hooks/use-mobile';


function UserDisplay({ user }: { user: User | null }) {
    const auth = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        if (!auth) return;
        await signOut(auth);
        router.push('/login');
    }
    
    const handleSignIn = async () => {
        if (!auth) return;
        await signOut(auth); // Sign out the anonymous user first
        router.push('/login');
    }

    if (!user) return null;

    if (user.isAnonymous) {
        return (
            <Button variant="ghost" className="w-full justify-start" onClick={handleSignIn}>
                <LogIn />
                <span>Sign In</span>
            </Button>
        )
    }

    return (
        <div className="flex items-center justify-between gap-2 p-2">
            <div className="flex items-center gap-2 overflow-hidden">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm overflow-hidden">
                    <p className="font-medium truncate">{user.email}</p>
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="shrink-0">
                <LogOut className="h-4 w-4"/>
                <span className="sr-only">Sign Out</span>
            </Button>
        </div>
    )

}

function DesktopSidebar({ children }: { children: React.ReactNode }) {
    return (
        <Sidebar>
            {children}
        </Sidebar>
    );
}

function MobileSidebar({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col h-full">
            {children}
        </div>
    );
}


export function MainSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [search, setSearch] = React.useState('');
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const isMobile = useIsMobile();
  const { state } = useSidebar();


  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const accountsQuery = useMemoFirebase(() => {
    if (isUserLoading || !firestore || !userProfile) return null;
    return query(
        collection(firestore, 'accounts-db'), 
        where('companyId', '==', userProfile.companyId),
        orderBy('name')
    );
  }, [firestore, isUserLoading, userProfile]);

  const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);

  const combinedIsLoading = accountsLoading || isUserLoading || !userProfile;


  const filteredAccounts = accounts?.filter(acc => 
    acc.name.toLowerCase().includes(search.toLowerCase()) ||
    acc.accountNumber?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const Wrapper = isMobile ? MobileSidebar : DesktopSidebar;

  const handleLinkClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  }

  return (
    <Wrapper>
      <SidebarHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Logo className="h-8 w-8 text-primary" />
                <span className={`text-lg font-semibold ${state === 'collapsed' && !isMobile ? 'hidden' : ''}`}>Territory Manager</span>
            </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className="p-2 space-y-2">
            <Link href="/dashboard/map" onClick={handleLinkClick}>
                <Button
                    asChild
                    variant={pathname === '/dashboard/map' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                >
                    <div>
                        <Map />
                        <span>Map</span>
                    </div>
                </Button>
            </Link>
            <Link href="/dashboard/products" onClick={handleLinkClick}>
                <Button
                    asChild
                    variant={pathname === '/dashboard/products' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                >
                    <div>
                        <Package />
                        <span>Products</span>
                    </div>
                </Button>
            </Link>
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                placeholder="Search accounts..." 
                className="pl-8" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>

        <SidebarMenu>
          <Button asChild className="m-2">
              <Link href="/dashboard/account/new" onClick={handleLinkClick}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Account
              </Link>
          </Button>

          {combinedIsLoading && (
            <div className="p-2">
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
            </div>
          )}

          {!combinedIsLoading && filteredAccounts.map(account => (
            <SidebarMenuItem key={account.id}>
              <Link href={`/dashboard/account/${account.id}`} passHref onClick={handleLinkClick}>
                <SidebarMenuButton
                  isActive={pathname.includes(`/dashboard/account/${account.id}`)}
                  className="w-full justify-start"
                  tooltip={account.name}
                >
                  <Building />
                  <div className="flex flex-col items-start">
                     <span className="font-medium">{account.name}</span>
                     <span className="text-xs text-muted-foreground">{account.accountNumber}</span>
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          {!combinedIsLoading && filteredAccounts.length === 0 && (
             <p className="p-4 text-sm text-muted-foreground">No accounts found.</p>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <UserDisplay user={user} />
        <ThemeToggle />
      </SidebarFooter>
    </Wrapper>
  );
}
