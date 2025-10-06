'use client';

import * as React from 'react';
import { type AccountProduct, type Product } from '@/lib/types';
import { ProductList } from './product-list';
import { Skeleton } from '../ui/skeleton';

interface AccountProductNotesProps {
  accountId: string;
  accountProducts: AccountProduct[];
  allProducts: Product[];
  isLoading: boolean;
}

export function AccountProductNotes({
  accountId,
  accountProducts,
  allProducts,
  isLoading,
}: AccountProductNotesProps) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <ProductList
      accountId={accountId}
      accountProducts={accountProducts || []}
      allProducts={allProducts || []}
    />
  );
}
