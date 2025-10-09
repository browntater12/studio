
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PlusCircle, Building, Search, Package, LogIn, LogOut } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';

import { type Account } from '@/lib/types';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { Input } from './ui/input';
import { ThemeToggle } from './theme-toggle';
import { SidebarMenuSkeleton } from './ui/sidebar';
import { DbStatus } from './db-status';
import { User } from 'firebase/auth';
import { signOut } from '@/firebase/non-blocking-login';


function UserDisplay({ user }: { user: User | null }) {
    const auth = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        if (!auth) return;
        await signOut(auth);
        router.push('/login');
    }

    if (!user) return null;

    if (user.isAnonymous) {
        return (
            <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/login">
                    <LogIn />
                    <span>Sign In</span>
                </Link>
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

export function MainSidebar() {
  const pathname = usePathname();
  const [search, setSearch] = React.useState('');
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const accountsQuery = useMemoFirebase(() => {
    if (isUserLoading || !firestore) return null;
    return query(collection(firestore, 'accounts-db'), orderBy('name'));
  }, [firestore, isUserLoading]);

  const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);

  const combinedIsLoading = accountsLoading || isUserLoading;


  const filteredAccounts = accounts?.filter(acc => 
    acc.name.toLowerCase().includes(search.toLowerCase()) ||
    acc.accountNumber?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <span className="text-lg font-semibold">Territory Manager</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className="p-2 space-y-2">
            <Link href="/dashboard/products">
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
              <Link href="/dashboard/account/new">
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
              <Link href={`/dashboard/account/${account.id}`} passHref>
                <SidebarMenuButton
                  isActive={pathname.includes(`/dashboard/account/${account.id}`)}
                  className="w-full justify-start"
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
        <DbStatus />
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
