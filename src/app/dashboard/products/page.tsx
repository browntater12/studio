'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { type Product } from '@/lib/types';
import { ProductTable } from '@/components/products/product-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsPage() {
    const firestore = useFirestore();
    const { isUserLoading } = useUser();
    
    const productsQuery = useMemoFirebase(() => {
        if (isUserLoading || !firestore) return null;
        return collection(firestore, 'products');
    }, [firestore, isUserLoading]);

    const { data: products, isLoading } = useCollection<Product>(productsQuery);
    const combinedIsLoading = isLoading || isUserLoading;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            {combinedIsLoading ? (
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
