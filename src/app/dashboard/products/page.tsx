
'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { type Product, type UserProfile } from '@/lib/types';
import { ProductTable } from '@/components/products/product-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsPage() {
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
    
    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !userProfile?.companyId) return null;
        return query(collection(firestore, 'products'), where('companyId', '==', userProfile.companyId));
    }, [firestore, userProfile]);

    const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);
    const isLoading = isAuthLoading || isProfileLoading || (userProfile && areProductsLoading);

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
