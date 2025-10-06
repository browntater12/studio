'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { type Product } from '@/lib/types';
import { ProductTable } from '@/components/products/product-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsPage() {
    const firestore = useFirestore();
    const productsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'products');
    }, [firestore]);

    const { data: products, isLoading } = useCollection<Product>(productsQuery);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <ProductTable products={products || []} />
            )}
        </div>
    );
}
