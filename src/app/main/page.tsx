
'use client';

import * as React from 'react';
import Link from 'next/link';
import { type Account } from '@/lib/types';
import { APIProvider } from '@vis.gl/react-google-maps';
import { AccountsMap } from '@/components/map/accounts-map';
import { Loader2, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MapFilters } from '@/components/map/map-filters';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';

// Hardcoded data for the public landing page
const staticAccounts: Account[] = [
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


export default function MainPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [statusFilter, setStatusFilter] = React.useState('all');
  const [industryFilter, setIndustryFilter] = React.useState('all');

  // Since we are using static data, loading is always false and there are no errors.
  const accounts = staticAccounts;
  const isLoading = false;
  const error = null;

  const industries = React.useMemo(() => {
    const allIndustries = accounts.map(acc => acc.industry).filter(Boolean) as string[];
    return [...new Set(allIndustries)].sort();
  }, [accounts]);

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
    <div className="flex flex-col min-h-screen">
      <header className="flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-lg font-semibold">Territory Manager</h1>
        </div>
        <Button asChild>
          <Link href="/login">Sign In</Link>
        </Button>
      </header>
      <main className="flex-1 flex flex-col">
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
            ) : error ? (
                <div className="flex h-full w-full items-center justify-center p-4">
                    <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        Failed to load account data. Please check your connection and permissions.
                    </AlertDescription>
                    </Alert>
                </div>
            ) : (
                <APIProvider apiKey={apiKey}>
                    <AccountsMap accounts={filteredAccounts || []} />
                </APIProvider>
            )}
        </div>
      </main>
    </div>
  );
}
