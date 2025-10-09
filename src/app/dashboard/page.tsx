'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { type Account } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSearch, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const firestore = useFirestore();
  const router = useRouter();

  const accountsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Get just the first account to redirect to
    return query(collection(firestore, 'accounts-db'), orderBy('name'));
  }, [firestore]);

  const { data: accounts, isLoading } = useCollection<Account>(accountsQuery);

  useEffect(() => {
    if (!isLoading && accounts && accounts.length > 0) {
      router.replace(`/dashboard/account/${accounts[0].id}`);
    }
  }, [accounts, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileSearch className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4">No Accounts Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Add a new account from the sidebar to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback while redirect is processing
  return null;
}
