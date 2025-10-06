'use client';

import { useParams } from 'next/navigation';
import { useDoc, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { type Account, type Contact, type AccountProduct, type Product } from '@/lib/types';
import { AccountHeader } from '@/components/account/account-header';
import { AccountInfo } from '@/components/account/account-info';
import { ContactList } from '@/components/account/contact-list';
import { ProductList } from '@/components/account/product-list';
import { Skeleton } from '@/components/ui/skeleton';

export default function AccountPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();

  const accountRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'accounts', id);
  }, [firestore, id]);
  const { data: account, isLoading: accountLoading } = useDoc<Account>(accountRef);

  const contactsRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return collection(firestore, 'accounts', id, 'contacts');
  }, [firestore, id]);
  const { data: contacts, isLoading: contactsLoading } = useCollection<Contact>(contactsRef);

  const accountProductsRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return collection(firestore, 'accounts', id, 'products');
  }, [firestore, id]);
  const { data: accountProducts, isLoading: accountProductsLoading } = useCollection<AccountProduct>(accountProductsRef, {
    idField: 'productId',
  });

  const productsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);
  const { data: allProducts, isLoading: productsLoading } = useCollection<Product>(productsRef);

  const isLoading = accountLoading || contactsLoading || accountProductsLoading || productsLoading;
  
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    return <div>Account not found.</div>;
  }
  
  // Combine data after fetching
  const fullAccount: Account = {
      ...account,
      contacts: contacts || [],
      accountProducts: accountProducts || [],
  };

  return (
    <div className="space-y-8">
      <AccountHeader account={fullAccount} />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <ContactList accountId={fullAccount.id} contacts={fullAccount.contacts} />
          <ProductList
            accountId={fullAccount.id}
            accountProducts={fullAccount.accountProducts}
            allProducts={allProducts || []}
          />
        </div>
        <div className="lg:col-span-1">
          <AccountInfo account={fullAccount} />
        </div>
      </div>
    </div>
  );
}
