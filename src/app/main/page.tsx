
'use client';

import * as React from 'react';
import { type Account, type Contact } from '@/lib/types';
import { APIProvider } from '@vis.gl/react-google-maps';
import { AccountsMap } from '@/components/map/accounts-map';
import { Loader2, Terminal, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MapFilters } from '@/components/map/map-filters';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { PublicSidebar } from '@/components/public-sidebar';
import { PublicAccountHeader } from '@/components/public/public-account-header';
import { PublicAccountInfo } from '@/components/public/public-account-info';
import { PublicContactList } from '@/components/public/public-contact-list';

// Hardcoded data for the public landing page
export const staticAccounts: Account[] = [
  {
    id: '1',
    name: 'Garratt Callahan HQ',
    address: '500 Unicorn Park Dr, Woburn, MA 01801',
    status: 'key-account',
    industry: 'Water Treatment',
    details: 'Corporate Headquarters.',
    companyId: 'static',
    accountNumber: 'GC-HQ',
  },
  {
    id: '2',
    name: 'Midwest Manufacturing',
    address: '123 Industrial Dr, Omaha, NE 68138',
    status: 'customer',
    industry: 'Manufacturing',
    details: 'Key customer in the Midwest region.',
    companyId: 'static',
    accountNumber: 'MM-001',
  },
  {
    id: '3',
    name: 'Tech Innovators Inc.',
    address: '1010 Binary Blvd, Silicon Valley, CA 94043',
    status: 'lead',
    industry: 'Technology',
    details: 'Promising lead for new chemical services.',
    companyId: 'static',
    accountNumber: 'TI-LEAD',
  },
  {
    id: '4',
    name: 'Agri-Solutions Corp',
    address: '555 Farm Rd, Des Moines, IA 50309',
    status: 'supplier',
    industry: 'Agriculture',
    details: 'Supplier of raw materials.',
    companyId: 'static',
    accountNumber: 'ASC-SUP',
  },
  {
    id: '5',
    name: 'PharmaGrade Labs',
    address: '789 Research Pkwy, Philadelphia, PA 19104',
    status: 'customer',
    industry: 'Pharmaceuticals',
    details: 'Long-term pharmaceutical client.',
    companyId: 'static',
    accountNumber: 'PGL-002',
  }
];

export const staticContacts: Contact[] = [
    {
        id: 'c1',
        accountNumber: 'GC-HQ',
        name: 'Jane Doe',
        position: 'CEO',
        phone: '123-456-7890',
        email: 'jane.doe@gchq.com',
        location: 'Woburn, MA',
        isMainContact: true,
        companyId: 'static',
    },
    {
        id: 'c2',
        accountNumber: 'GC-HQ',
        name: 'John Smith',
        position: 'CTO',
        phone: '123-456-7891',
        email: 'john.smith@gchq.com',
        location: 'Woburn, MA',
        isMainContact: false,
        companyId: 'static',
    },
    {
        id: 'c3',
        accountNumber: 'MM-001',
        name: 'Peter Jones',
        position: 'Plant Manager',
        phone: '402-555-1234',
        email: 'peter.jones@midwestmfg.com',
        location: 'Omaha, NE',
        isMainContact: true,
        companyId: 'static',
    }
]


function MapView({ accounts, filters, onAccountSelect }: { accounts: Account[], filters: any, onAccountSelect: (id: string) => void }) {
  const { statusFilter, setStatusFilter, industryFilter, setIndustryFilter, industries, isLoading } = filters;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

   const filteredAccounts = React.useMemo(() => {
    return accounts.filter(account => {
      const statusMatch = statusFilter === 'all' || account.status === statusFilter;
      const industryMatch = industryFilter === 'all' || account.industry === industryFilter;
      return statusMatch && industryMatch;
    });
  }, [accounts, statusFilter, industryFilter]);

  if (!apiKey) {
    return (
       <div className="flex h-screen w-full items-center justify-center p-4">
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Google Maps API Key is Missing</AlertTitle>
          <AlertDescription>
            This page requires a Google Maps API Key to display the map. Please add it to your environment variables.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)]">
        <MapFilters 
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            industryFilter={industryFilter}
            setIndustryFilter={setIndustryFilter}
            industries={industries}
            isLoading={isLoading}
        />
        <div className="flex-1 min-h-0">
            {isLoading ? (
                <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <APIProvider apiKey={apiKey}>
                    <AccountsMap accounts={filteredAccounts || []} onAccountSelect={onAccountSelect} isPublic={true} />
                </APIProvider>
            )}
        </div>
    </div>
  )
}

function AccountDetailView({ account, contacts, onBack }: { account: Account, contacts: Contact[], onBack: () => void }) {
    const accountContacts = contacts.filter(c => c.accountNumber === account.accountNumber);
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Map
            </Button>
            <PublicAccountHeader account={account} />
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <PublicContactList account={account} contacts={accountContacts || []} />
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <PublicAccountInfo account={account} />
                </div>
            </div>
        </div>
    )
}

export default function MainPage() {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [industryFilter, setIndustryFilter] = React.useState('all');
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);

  const accounts = staticAccounts;
  const contacts = staticContacts;
  const isLoading = false;

  const industries = React.useMemo(() => {
    const allIndustries = accounts.map(acc => acc.industry).filter(Boolean) as string[];
    return [...new Set(allIndustries)].sort();
  }, [accounts]);

  const selectedAccount = selectedAccountId ? accounts.find(acc => acc.id === selectedAccountId) : null;
  
  const handleAccountSelect = (id: string) => {
    setSelectedAccountId(id);
  }

  const handleBack = () => {
    setSelectedAccountId(null);
  }

  return (
    <SidebarProvider>
      <PublicSidebar accounts={accounts} onAccountSelect={handleAccountSelect} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-2 flex-1">
              <Logo className="h-8 w-8 text-primary" />
              <h1 className="text-lg font-semibold">Territory Manager</h1>
            </div>
            <Button asChild>
              <a href="/login">Sign In</a>
            </Button>
        </header>
        <main className="flex-1 flex flex-col h-[calc(100vh-3.5rem)]">
          {selectedAccount ? (
            <AccountDetailView account={selectedAccount} contacts={contacts} onBack={handleBack} />
          ) : (
             <MapView 
                accounts={accounts}
                filters={{ statusFilter, setStatusFilter, industryFilter, setIndustryFilter, industries, isLoading }}
                onAccountSelect={handleAccountSelect}
             />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
