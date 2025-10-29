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

export default function MapPage() {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const accountsQuery = useMemoFirebase(() => {
    if (isUserLoading || !firestore) return null;
    return collection(firestore, 'accounts-db');
  }, [firestore, isUserLoading]);

  const { data: accounts, isLoading, error } = useCollection<Account>(accountsQuery);
  
  const combinedIsLoading = isLoading || isUserLoading;

  if (combinedIsLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
    <div className="h-[calc(100vh-4rem)] w-full">
      <APIProvider apiKey={apiKey}>
        <AccountsMap accounts={accounts || []} />
      </APIProvider>
    </div>
  );
}
