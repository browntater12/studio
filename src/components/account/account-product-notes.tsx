'use client';

import * as React from 'react';
import { getAccountProductNotes } from '@/app/actions';
import { type AccountProduct, type Product } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ServerCrash } from 'lucide-react';
import { ProductList } from './product-list';

export function AccountProductNotes({
  accountId,
  allProducts,
}: {
  accountId: string;
  allProducts: Product[];
}) {
  const [notes, setNotes] = React.useState<AccountProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function fetchNotes() {
      if (!accountId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await getAccountProductNotes(accountId);
        if (!isMounted) return;

        if (result.error) {
          setError(result.error);
        } else if (result.notes) {
          setNotes(result.notes);
        } else {
          setNotes([]);
        }
      } catch (e: any) {
        if (isMounted) {
            setError(e.message || 'An unexpected error occurred while fetching notes.');
        }
      } finally {
        if (isMounted) {
            setLoading(false);
        }
      }
    }

    fetchNotes();

    return () => {
        isMounted = false;
    }
  }, [accountId]);

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <ServerCrash className="h-4 w-4" />
        <AlertTitle>Error loading product notes</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <ProductList
      accountId={accountId}
      accountProducts={notes}
      allProducts={allProducts}
    />
  );
}
