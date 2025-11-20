
'use client';

import * as React from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useDoc, useCollection, useMemoFirebase, useFirestore, useUser } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { type Product, type AccountProduct, type Account, type UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, DollarSign } from 'lucide-react';
import Link from 'next/link';

type ProductUsage = AccountProduct & { accountName?: string };

export default function ProductDetailsPage() {
  const params = useParams();
  const productId = params.id as string;
  const firestore = useFirestore();
  const router = useRouter();
  const { user, isUserLoading: isAuthLoading } = useUser();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const productRef = useMemoFirebase(() => {
    if (!firestore || !productId) return null;
    return doc(firestore, 'products', productId);
  }, [firestore, productId]);
  const { data: product, isLoading: productLoading } = useDoc<Product>(productRef);

  const productUsageQuery = useMemoFirebase(() => {
    if (!firestore || !productId || !userProfile?.companyId) return null;
    return query(collection(firestore, 'account-products'), where('productId', '==', productId), where('companyId', '==', userProfile.companyId));
  }, [firestore, productId, userProfile?.companyId]);
  const { data: productUsages, isLoading: usagesLoading } = useCollection<AccountProduct>(productUsageQuery);

  const accountsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.companyId) return null;
    return query(collection(firestore, 'accounts-db'), where('companyId', '==', userProfile.companyId));
  }, [firestore, userProfile?.companyId]);
  const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);

  const isLoading = isAuthLoading || isProfileLoading || productLoading || usagesLoading || accountsLoading;

  const combinedData: ProductUsage[] = React.useMemo(() => {
    if (!productUsages || !accounts) return [];
    return productUsages.map(usage => {
      const account = accounts.find(acc => acc.id === usage.accountId);
      return {
        ...usage,
        accountName: account?.name || 'Unknown Account',
      };
    }).sort((a, b) => (a.accountName || '').localeCompare(b.accountName || ''));
  }, [productUsages, accounts]);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-5 w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product && !productLoading) {
    return notFound();
  }

  return (
    <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
        </Button>
      <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-muted-foreground" />
                <div>
                    <CardTitle>{product?.name}</CardTitle>
                    <CardDescription>Product Code: {product?.productCode}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <h2 className="text-lg font-semibold mb-2">Account Usage</h2>
          {combinedData.length > 0 ? (
             <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {combinedData.map(usage => (
                    <TableRow key={usage.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/account/${usage.accountId}`)}>
                        <TableCell className="font-medium">{usage.accountName}</TableCell>
                        <TableCell>
                             <Badge variant={usage.type === 'opportunity' ? 'warning' : 'default'} className="capitalize">{usage.type}</Badge>
                        </TableCell>
                        <TableCell>
                            {usage.price ? (
                                <div className="flex items-center">
                                    <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <span>{usage.price.toFixed(2)}</span>
                                </div>
                            ) : (
                                <span className="text-muted-foreground">N/A</span>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          ) : (
             <div className="text-center py-12 text-muted-foreground">
                This product is not currently associated with any accounts.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
