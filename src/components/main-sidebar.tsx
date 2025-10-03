'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PlusCircle, Building, Search, Moon, Sun } from 'lucide-react';

import { type Account, type Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AddAccountForm } from '@/components/forms/add-account-form';
import { Logo } from '@/components/icons/logo';
import { Input } from './ui/input';
import { ThemeToggle } from './theme-toggle';


interface MainSidebarProps {
  accounts: Account[];
  products: Product[];
}

export function MainSidebar({ accounts }: MainSidebarProps) {
  const params = useParams();
  const accountId = params.id as string;
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(search.toLowerCase()) ||
    acc.accountNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleAccountCreated = (newAccountId: string) => {
    setOpen(false);
    router.push(`/dashboard/account/${newAccountId}`);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <span className="text-lg font-semibold">Sales TM</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className="p-2">
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="m-2">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
              </DialogHeader>
              <AddAccountForm onAccountCreated={handleAccountCreated} />
            </DialogContent>
          </Dialog>

          {filteredAccounts.map(account => (
            <SidebarMenuItem key={account.id}>
              <Link href={`/dashboard/account/${account.id}`} passHref>
                <SidebarMenuButton
                  isActive={accountId === account.id}
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
          {filteredAccounts.length === 0 && (
             <p className="p-4 text-sm text-muted-foreground">No accounts found.</p>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
