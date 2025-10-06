'use client';

import { useParams } from 'next/navigation';
import { useDoc, useCollection, useMemoFirebase, useFirestore, useUser } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
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
  const { isUserLoading } = useUser();

  const accountRef = useMemoFirebase(() => {
    if (isUserLoading || !firestore || !id) return null;
    return doc(firestore, 'accounts-db', id);
  }, [firestore, id, isUserLoading]);
  const { data: account, isLoading: accountLoading } = useDoc<Account>(accountRef);

  const contactsQuery = useMemoFirebase(() => {
    if (isUserLoading || !firestore || !account?.accountNumber) return null;
    return query(collection(firestore, 'contacts'), where('accountNumber', '==', account.accountNumber));
  }, [firestore, isUserLoading, account?.accountNumber]);
  const { data: contacts, isLoading: contactsLoading } = useCollection<Contact>(contactsQuery);

  const accountProductsRef = useMemoFirebase(() => {
    if (isUserLoading || !firestore || !id) return null;
    return collection(firestore, 'accounts-db', id, 'products');
  }, [firestore, id, isUserLoading]);
  const { data: accountProducts, isLoading: accountProductsLoading } = useCollection<AccountProduct>(accountProductsRef, {
    idField: 'productId',
  });

  const productsRef = useMemoFirebase(() => {
    if (isUserLoading || !firestore) return null;
    return collection(firestore, 'products');
  }, [firestore, isUserLoading]);
  const { data: allProducts, isLoading: productsLoading } = useCollection<Product>(productsRef);

  const isLoading = isUserLoading || accountLoading || contactsLoading || accountProductsLoading || productsLoading;
  
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
      accountProducts: accountProducts || [],
  };

  return (
    <div className="space-y-8">
      <AccountHeader account={fullAccount} />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <ContactList account={fullAccount} contacts={contacts || []} />
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
