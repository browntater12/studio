'use client';

import * as React from 'react';
import { useParams, notFound } from 'next/navigation';
import { useDoc, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { type Product, type AccountProduct, type Account, type ProductUsage, type SubProduct } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EditSubProductForm } from '@/components/forms/edit-sub-product-form';

function EditSubProductDialog({ subProduct, children, onEditClick }: { subProduct: SubProduct, children: React.ReactNode, onEditClick: (e: React.MouseEvent) => void }) {
    const [open, setOpen] = React.useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild onClick={onEditClick}>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Product Variation</DialogTitle>
                </DialogHeader>
                <EditSubProductForm subProduct={subProduct} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

function ProductUsageDetails() {
  const params = useParams();
  const productId = params.id as string;
  const firestore = useFirestore();

  const productRef = useMemoFirebase(() => {
    if (!firestore || !productId) return null;
    return doc(firestore, 'products', productId);
  }, [firestore, productId]);
  const { data: product, isLoading: productLoading } = useDoc<Product>(productRef);

  const subProductsQuery = useMemoFirebase(() => {
    if (!firestore || !productId) return null;
    return collection(firestore, 'products', productId, 'individual-products');
  }, [firestore, productId]);
  const { data: subProducts, isLoading: subProductsLoading } = useCollection<SubProduct>(subProductsQuery);

  const productUsageQuery = useMemoFirebase(() => {
    if (!firestore || !productId) return null;
    return query(collection(firestore, 'account-products'), where('productId', '==', productId));
  }, [firestore, productId]);
  const { data: accountProducts, isLoading: accountProductsLoading } = useCollection<AccountProduct>(productUsageQuery);

  const accountsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'accounts-db');
  }, [firestore]);
  const { data: allAccounts, isLoading: accountsLoading } = useCollection<Account>(accountsRef);

  const isLoading = productLoading || accountProductsLoading || accountsLoading || subProductsLoading;

  const productUsageData: ProductUsage[] = React.useMemo(() => {
    if (!accountProducts || !allAccounts) return [];

    return accountProducts.map(ap => {
      const account = allAccounts.find(acc => acc.id === ap.accountId);
      return {
        accountName: account?.name || 'Unknown Account',
        accountId: account?.id || '',
        notes: ap.notes,
      };
    }).filter(pud => pud.accountId);

  }, [accountProducts, allAccounts]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-1/2" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
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

  if (!product) {
    return notFound();
  }

  const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>, subProductId: string) => {
    // a bit of a hack to prevent row click when clicking on the button
    if ((e.target as HTMLElement).closest('button')) {
        return;
    }
    // router.push(`/dashboard/products/${productId}/${subProductId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
                {(product.industries || []).map(industry => (
                    <Badge key={industry} variant="secondary">{industry}</Badge>
                ))}
            </div>
            <p className="text-muted-foreground mt-2">{product.notes}</p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/products/${productId}/add`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Specific Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Product Code</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subProducts && subProducts.length > 0 ? (
                subProducts.map(sp => (
                  <TableRow key={sp.id}>
                    <TableCell className="font-medium">{sp.name}</TableCell>
                    <TableCell>{sp.productCode}</TableCell>
                    <TableCell>{sp.size}</TableCell>
                    <TableCell>{sp.volume ? `${sp.volume} ${sp.volumeUnit}` : 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">{sp.description}</TableCell>
                    <TableCell>
                        <EditSubProductDialog subProduct={sp} onEditClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </EditSubProductDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No specific products have been added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accounts Using This Product</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Notes for this Account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productUsageData.length > 0 ? (
                productUsageData.map(usage => (
                  <TableRow key={usage.accountId}>
                    <TableCell>
                      <Button variant="link" asChild className="p-0 h-auto">
                        <Link href={`/dashboard/account/${usage.accountId}`}>
                          {usage.accountName}
                        </Link>
                      </Button>
                    </TableCell>
                    <TableCell>{usage.notes}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No accounts are currently using this product.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProductPage() {
    return <ProductUsageDetails />;
}
