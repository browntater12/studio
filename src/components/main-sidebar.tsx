'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { PlusCircle, Building, Search, Package } from 'lucide-react';

import { type Account, type Product } from '@/lib/types';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { Input } from './ui/input';
import { ThemeToggle } from './theme-toggle';
import { SidebarMenuSkeleton } from './ui/sidebar';
import { DbStatus } from './db-status';


interface MainSidebarProps {
  accounts: Account[];
  products: Product[];
  isLoading: boolean;
}

export function MainSidebar({ accounts, isLoading }: MainSidebarProps) {
  const params = useParams();
  const pathname = usePathname();
  const accountId = params.id as string;
  const [search, setSearch] = React.useState('');

  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(search.toLowerCase()) ||
    acc.accountNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <span className="text-lg font-semibold">Sales TM</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className="p-2 space-y-2">
            <Button
                asChild
                variant={pathname === '/dashboard/products' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
            >
                <Link href="/dashboard/products">
                    <Package />
                    <span>Products</span>
                </Link>
            </Button>
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

          {isLoading && (
            <div className="p-2">
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
            </div>
          )}

          {!isLoading && filteredAccounts.map(account => (
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
          {!isLoading && filteredAccounts.length === 0 && (
             <p className="p-4 text-sm text-muted-foreground">No accounts found.</p>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <DbStatus />
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
