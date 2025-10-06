'use client';

import { useMemo } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
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

  const accountsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'accounts'), orderBy('name'));
  }, [firestore]);

  const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);
  
  const { data: products, isLoading: productsLoading } = useCollection<Product>(productsQuery);

  return (
    <SidebarProvider>
      <MainSidebar 
        accounts={accounts || []} 
        products={products || []} 
        isLoading={accountsLoading || productsLoading} 
      />
      <SidebarInset>
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
