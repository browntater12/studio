
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Building, Search, Map, Package, User, Building2 } from 'lucide-react';
import type { Account } from '@/lib/types';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Logo } from '@/components/icons/logo';
import { Input } from './ui/input';
import { ThemeToggle } from './theme-toggle';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from './ui/button';
import Link from 'next/link';
import { SignUpForm } from '@/components/forms/sign-up-form';
import { Card, CardDescription, CardTitle } from './ui/card';

function DesktopSidebar({ children }: { children: React.ReactNode }) {
    return <Sidebar>{children}</Sidebar>;
}

function MobileSidebar({ children }: { children: React.ReactNode }) {
    return <div className="flex flex-col h-full">{children}</div>;
}

function IndividualSignUpModal() {
    const [open, setOpen] = React.useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">Continue</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create an Individual Account</DialogTitle>
                    <DialogDescription>
                        Get started by creating your own account and company space.
                    </DialogDescription>
                </DialogHeader>
                <SignUpForm onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}

interface PublicSidebarProps {
    accounts: Account[];
    onAccountSelect: (id: string) => void;
    onNavigate: (view: 'map' | 'products') => void;
    currentView: 'map' | 'products';
}

export function PublicSidebar({ accounts, onAccountSelect, onNavigate, currentView }: PublicSidebarProps) {
  const [search, setSearch] = React.useState('');
  const isMobile = useIsMobile();
  const { state } = useSidebar();

  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(search.toLowerCase()) ||
    acc.accountNumber?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const Wrapper = isMobile ? MobileSidebar : DesktopSidebar;

  const handleAccountClick = (id: string) => {
    onAccountSelect(id);
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
            <Button
                variant={currentView === 'map' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => onNavigate('map')}
            >
                <Map />
                <span>Map</span>
            </Button>
            <Button
                variant={currentView === 'products' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => onNavigate('products')}
            >
                <Package />
                <span>Products</span>
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
          {filteredAccounts.map(account => (
            <SidebarMenuItem key={account.id}>
                <SidebarMenuButton
                  className="w-full justify-start"
                  tooltip={account.name}
                  onClick={() => handleAccountClick(account.id)}
                >
                  <Building />
                  <div className="flex flex-col items-start">
                     <span className="font-medium">{account.name}</span>
                     <span className="text-xs text-muted-foreground">{account.accountNumber}</span>
                  </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {filteredAccounts.length === 0 && (
             <p className="p-4 text-sm text-muted-foreground">No accounts found.</p>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="destructive">Get Started</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Choose your setup</DialogTitle>
                    <DialogDescription>
                        Start as an individual or set up your entire enterprise team.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <Card className="flex flex-col items-center justify-center p-6 text-center">
                        <User className="h-10 w-10 mb-2" />
                        <CardTitle className="text-lg">Individual</CardTitle>
                        <CardDescription className="mt-1 mb-4">
                            Perfect for solo sales reps or small teams getting started.
                        </CardDescription>
                        <IndividualSignUpModal />
                    </Card>
                    <Card className="flex flex-col items-center justify-center p-6 text-center bg-muted/50 border-dashed">
                        <Building2 className="h-10 w-10 mb-2 text-muted-foreground" />
                        <CardTitle className="text-lg text-muted-foreground">Enterprise</CardTitle>
                         <CardDescription className="mt-1 mb-4 text-muted-foreground">
                            Coming soon. Contact us for more information on enterprise solutions.
                        </CardDescription>
                        <Button className="w-full" disabled>Coming Soon</Button>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
        <ThemeToggle />
      </SidebarFooter>
    </Wrapper>
  );
}
