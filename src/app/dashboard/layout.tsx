'use client';

import { useMemo } from 'react';
import { useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { MainSidebar } from '@/components/main-sidebar';
import { type Account, type Product } from '@/lib/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();

  const accountsQuery = useMemoFirebase(() => {
    if (isUserLoading || !firestore) return null;
    return query(collection(firestore, 'accounts-db'), orderBy('name'));
  }, [firestore, isUserLoading]);

  const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);

  const productsQuery = useMemoFirebase(() => {
    if (isUserLoading || !firestore) return null;
    return collection(firestore, 'products');
  }, [firestore, isUserLoading]);
  
  const { data: products, isLoading: productsLoading } = useCollection<Product>(productsQuery);

  return (
    <SidebarProvider>
      <MainSidebar 
        accounts={accounts || []} 
        products={products || []} 
        isLoading={accountsLoading || productsLoading || isUserLoading} 
      />
      <SidebarInset>
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
