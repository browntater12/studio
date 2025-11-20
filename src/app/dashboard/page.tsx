
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, where, doc } from 'firebase/firestore';
import { type Account, type UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSearch, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { user } = useUser();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const accountsQuery = useMemoFirebase(() => {
    // Crucially, wait for userProfile to be loaded before creating the query.
    if (!firestore || !userProfile) return null;
    return query(
      collection(firestore, 'accounts-db'), 
      where('companyId', '==', userProfile.companyId),
      orderBy('name')
    );
  }, [firestore, userProfile]);

  const { data: accounts, isLoading: areAccountsLoading } = useCollection<Account>(accountsQuery);

  const isLoading = isProfileLoading || areAccountsLoading;

  useEffect(() => {
    // Only redirect once loading is complete and we have account data.
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
  
  // If not loading and there are no accounts, show the welcome/empty state.
  if (!isLoading && (!accounts || accounts.length === 0)) {
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
  return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
}
