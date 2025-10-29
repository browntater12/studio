'use client';

import * as React from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { type Account } from '@/lib/types';
import { APIProvider } from '@vis.gl/react-google-maps';
import { AccountsMap } from '@/components/map/accounts-map';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { MapFilters } from '@/components/map/map-filters';

export default function MapPage() {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [statusFilter, setStatusFilter] = React.useState('all');
  const [industryFilter, setIndustryFilter] = React.useState('all');

  const accountsQuery = useMemoFirebase(() => {
    if (isUserLoading || !firestore) return null;
    return collection(firestore, 'accounts-db');
  }, [firestore, isUserLoading]);

  const { data: accounts, isLoading, error } = useCollection<Account>(accountsQuery);
  
  const combinedIsLoading = isLoading || isUserLoading;

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


  if (error) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center p-4">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load account data. Please check your connection and permissions.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!apiKey) {
    return (
       <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center p-4">
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Google Maps API Key is Missing</AlertTitle>
          <AlertDescription>
            Please add your Google Maps API Key to the .env file as <pre className="inline bg-muted px-1 py-0.5 rounded-sm">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</pre> to see the map.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full">
        <MapFilters 
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            industryFilter={industryFilter}
            setIndustryFilter={setIndustryFilter}
            industries={industries}
            isLoading={combinedIsLoading}
        />
        <div className="flex-1">
            {combinedIsLoading ? (
                 <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <APIProvider apiKey={apiKey}>
                    <AccountsMap accounts={filteredAccounts || []} />
                </APIProvider>
            )}
        </div>
    </div>
  );
}
