'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Package, Edit, Loader2 } from 'lucide-react';
import { type AccountProduct, type Product } from '@/lib/types';
import { updateProductNote } from '@/app/actions';
import { editProductNoteSchema } from '@/lib/schema';

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
          <DialogTitle>Add Product to Account</DialogTitle>
        </DialogHeader>
        <AddProductToAccountForm accountId={accountId} allProducts={allProducts} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

const editInitialState = { type: '', message: '', errors: undefined };

function EditNoteForm({ accountId, productId, currentNotes, onSuccess }: { accountId: string, productId: string, currentNotes: string, onSuccess: () => void }) {
    const [state, formAction] = useActionState(updateProductNote, editInitialState);
    const { pending } = useFormStatus();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof editProductNoteSchema>>({
        resolver: zodResolver(editProductNoteSchema),
        defaultValues: { accountId, productId, notes: currentNotes },
    });

    React.useEffect(() => {
        if (state.type === 'success') {
            toast({ title: 'Success', description: state.message });
            onSuccess();
        } else if (state.type === 'error') {
            toast({ title: 'Error', description: state.message, variant: 'destructive' });
        }
    }, [state, onSuccess, toast]);

    return (
        <Form {...form}>
            <form action={formAction} className="space-y-4">
                 <input type="hidden" name="accountId" value={accountId} />
                 <input type="hidden" name="productId" value={productId} />
                 <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Product Notes</FormLabel>
                        <FormControl>
                            <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                 <Button type="submit" disabled={pending} className="w-full">
                    {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                 </Button>
            </form>
        </Form>
    );
}

function EditNoteDialog({ accountId, productId, currentNotes, children }: { accountId: string, productId: string, currentNotes: string, children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Product Note</DialogTitle>
                </DialogHeader>
                <EditNoteForm accountId={accountId} productId={productId} currentNotes={currentNotes} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

export function ProductList({
  accountId,
  accountProducts,
  allProducts
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
            <span>Products & Notes</span>
          </CardTitle>
          <CardDescription>
            Products this account is using and related notes.
          </CardDescription>
        </div>
        <AddProductDialog accountId={accountId} allProducts={allProducts} />
      </CardHeader>
      <CardContent>
        {accountProducts.length > 0 ? (
          <div className="space-y-4">
            {accountProducts.map(ap => {
                const product = getProductDetails(ap.productId);
                if (!product) return null;
                return (
                    <div key={ap.productId} className="p-4 border rounded-lg relative group">
                        <div className="font-semibold">{product.name} <span className="text-sm font-normal text-muted-foreground">({product.productNumber})</span></div>
                        <p className="text-sm text-muted-foreground mt-1 pr-10">{ap.notes}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {product.volumes.map(v => <Badge key={v} variant="secondary" className="capitalize">{v}</Badge>)}
                        </div>
                        <EditNoteDialog accountId={accountId} productId={ap.productId} currentNotes={ap.notes}>
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </EditNoteDialog>
                    </div>
                );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No products added for this account yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
