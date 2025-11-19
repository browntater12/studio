
'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Package, Edit, Loader2, DollarSign } from 'lucide-react';
import { type AccountProduct, type Product } from '@/lib/types';
import { updateProductNote } from '@/app/actions';
import { editProductNoteSchema } from '@/lib/schema';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { AddProductToAccountForm } from '../forms/add-product-form';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { EditProductDetailsForm } from '../forms/edit-product-details-form';

function AddProductDialog({ accountId, allProducts }: { accountId: string, allProducts: Product[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
        </DialogHeader>
        <AddProductToAccountForm accountId={accountId} allProducts={allProducts} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditProductDetailsDialog({ accountProduct, allProducts, children }: { accountProduct: AccountProduct, allProducts: Product[], children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Product Details</DialogTitle>
                </DialogHeader>
                <EditProductDetailsForm accountProduct={accountProduct} allProducts={allProducts} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

export function ProductList({
  accountId,
  accountProducts,
  allProducts,
}: {
  accountId: string;
  accountProducts: AccountProduct[];
  allProducts: Product[];
}) {
    const getProductDetails = (productId: string) => {
        return allProducts.find(p => p.id === productId);
    }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <span>Products</span>
          </CardTitle>
          <CardDescription>
            Products associated with this account.
          </CardDescription>
        </div>
        <AddProductDialog accountId={accountId} allProducts={allProducts} />
      </CardHeader>
      <CardContent>
        {accountProducts.length > 0 ? (
          <div className="space-y-4">
            {accountProducts.map(ap => {
                const product = getProductDetails(ap.productId!);
                const createdAtDate = ap.createdAt ? ap.createdAt.toDate() : undefined;

                return (
                    <div key={ap.id} className="p-4 border rounded-lg relative group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">{product?.name || 'Unknown Product'}</span>
                                {product && <Badge variant="secondary">{product.productCode}</Badge>}
                                {ap.type && <Badge variant={ap.type === 'opportunity' ? 'warning' : 'default'} className="capitalize">{ap.type}</Badge>}
                            </div>
                            {ap.price && (
                                <div className="flex items-center font-semibold">
                                    <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <span>{ap.price.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 pr-10">{ap.notes}</p>

                        <EditProductDetailsDialog accountProduct={ap} allProducts={allProducts}>
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </EditProductDetailsDialog>
                    </div>
                );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No products added yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
