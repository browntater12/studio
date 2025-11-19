
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { type Account } from '@/lib/types';
import { APIProvider } from '@vis.gl/react-google-maps';
import { AccountsMap } from '@/components/map/accounts-map';
import { Loader2, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MapFilters } from '@/components/map/map-filters';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';

export default function MainPage() {
  const firestore = useFirestore();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [statusFilter, setStatusFilter] = React.useState('all');
  const [industryFilter, setIndustryFilter] = React.useState('all');

  // For the public page, we fetch all accounts without company filtering.
  const accountsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'accounts-db'));
  }, [firestore]);

  const { data: accounts, isLoading, error } = useCollection<Account>(accountsQuery);

  const industries = React.useMemo(() => {
    if (!accounts) return [];
    const allIndustries = accounts.map(acc => acc.industry).filter(Boolean) as string[];
    return [...new Set(allIndustries)].sort();
  }, [accounts]);

  const filteredAccounts = React.useMemo(() => {
    if (!accounts) return [];
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
