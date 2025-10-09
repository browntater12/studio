'use client';

import { useCollection, useMemoFirebase, useUser, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { MainSidebar } from '@/components/main-sidebar';
import { type Account } from '@/lib/types';

export function MainSidebarClient() {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();

  const accountsQuery = useMemoFirebase(() => {
    if (isUserLoading || !firestore) return null;
    return query(collection(firestore, 'accounts-db'), orderBy('name'));
  }, [firestore, isUserLoading]);

  const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);

  const combinedIsLoading = accountsLoading || isUserLoading;

  return <MainSidebar accounts={accounts || []} isLoading={combinedIsLoading} />;
}
