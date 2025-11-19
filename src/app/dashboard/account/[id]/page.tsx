
'use client';

import * as React from 'react';
import { useParams, notFound } from 'next/navigation';
import { useDoc, useCollection, useMemoFirebase, useFirestore, useUser } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { type Account, type Contact, type Product, type AccountProduct, type ShippingLocation, type CallNote } from '@/lib/types';
import { AccountHeader } from '@/components/account/account-header';
import { AccountInfo } from '@/components/account/account-info';
import { ContactList } from '@/components/account/contact-list';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductList } from '@/components/account/product-list';
import { ShippingLocations } from '@/components/account/shipping-locations';
import { CallNotes } from '@/components/account/call-notes';

function AccountDetails() {
  const params = useParams();
  const accountId = params.id as string;
  const firestore = useFirestore();
  const { isUserLoading } = useUser();

  const accountRef = useMemoFirebase(() => {
    if (!firestore || !accountId) return null;
    return doc(firestore, 'accounts-db', accountId);
  }, [firestore, accountId]);
  const { data: account, isLoading: accountLoading } = useDoc<Account>(accountRef);

  const contactsQuery = useMemoFirebase(() => {
    if (!firestore || !account?.accountNumber) return null;
    return query(collection(firestore, 'contacts'), where('accountNumber', '==', account.accountNumber));
  }, [firestore, account?.accountNumber]);
  const { data: contacts, isLoading: contactsLoading } = useCollection<Contact>(contactsQuery);

  const productsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);
  const { data: allProducts, isLoading: productsLoading } = useCollection<Product>(productsRef);

  const productNotesQuery = useMemoFirebase(() => {
    if (!firestore || !accountId) return null;
    return query(collection(firestore, 'account-products'), where('accountId', '==', accountId));
  }, [firestore, accountId]);
  const { data: accountProducts, isLoading: productNotesLoading } = useCollection<AccountProduct>(productNotesQuery);

  const shippingLocationsQuery = useMemoFirebase(() => {
    if (!firestore || !accountId) return null;
    return query(collection(firestore, 'shipping-locations'), where('originalAccountId', '==', accountId));
  }, [firestore, accountId]);
  const { data: shippingLocations, isLoading: shippingLocationsLoading } = useCollection<ShippingLocation>(shippingLocationsQuery);

  const callNotesQuery = useMemoFirebase(() => {
    if (!firestore || !accountId) return null;
    return query(collection(firestore, 'call-notes'), where('accountId', '==', accountId));
  }, [firestore, accountId]);
  const { data: callNotes, isLoading: callNotesLoading } = useCollection<CallNote>(callNotesQuery);


  const isLoading = isUserLoading || accountLoading || contactsLoading || productsLoading || productNotesLoading || shippingLocationsLoading || callNotesLoading;

  if (isLoading && !account) {
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
          <div className="lg:col-span-1 space-y-8">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!account && !isLoading) {
    return notFound();
  }

  return (
    <div className="space-y-8">
      {account ? <AccountHeader account={account} /> : <Skeleton className="h-14 w-full" />}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {contactsLoading || !account ? <Skeleton className="h-64 w-full" /> : <ContactList account={account} contacts={contacts || []} />}
          {productsLoading || productNotesLoading || !account ? <Skeleton className="h-64 w-full" /> : <ProductList
            accountId={accountId}
            accountProducts={accountProducts || []}
            allProducts={allProducts || []}
          />}
        </div>
        <div className="lg:col-span-1 space-y-8">
          {accountLoading || !account ? <Skeleton className="h-80 w-full" /> : <AccountInfo account={account} />}
          {shippingLocationsLoading || !account ? <Skeleton className="h-48 w-full" /> : <ShippingLocations accountId={accountId} locations={shippingLocations || []} />}
          {callNotesLoading || !account ? <Skeleton className="h-48 w-full" /> : <CallNotes accountId={accountId} notes={callNotes || []} />}
        </div>
      </div>
    </div>
  );
}


export default function AccountPage() {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
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
  
  return <AccountDetails />;
}
