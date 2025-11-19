
'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormState } from 'react-dom';
import { Loader2, Check, ChevronsUpDown, Trash2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';


import { editAccountProductSchema, deleteAccountProductSchema } from '@/lib/schema';
import { type Product, type AccountProduct } from '@/lib/types';
import { updateAccountProduct } from '@/app/actions';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { CreateProductForm } from './create-product-form';

function CreateProductDialog() {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
            <PlusCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <CreateProductForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function DeleteAccountProduct({ accountProductId, onSuccess }: { accountProductId: string; onSuccess: () => void; }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const firestore = useFirestore();

    const handleDelete = async () => {
        if (!firestore) {
            toast({ title: 'Error', description: 'Firestore not available', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            const docRef = doc(firestore, 'account-products', accountProductId);
            await deleteDoc(docRef);
            toast({ title: 'Success!', description: "Product link from account deleted." });
            onSuccess();
        } catch (error) {
            console.error("Error deleting account product:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `account-products/${accountProductId}`,
                operation: 'delete',
            }));
            toast({ title: 'Error', description: "Failed to delete product link.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will remove this product and its notes from this account. It will not delete the product from the global catalog.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button type="submit" disabled={isSubmitting} className="w-full flex-1">
      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Save Changes
    </Button>
  );
}

type EditProductDetailsFormProps = {
  accountProduct: AccountProduct;
  allProducts: Product[];
  onSuccess: () => void;
};

export function EditProductDetailsForm({ accountProduct, allProducts, onSuccess }: EditProductDetailsFormProps) {
  const { toast } = useToast();
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof editAccountProductSchema>>({
    resolver: zodResolver(editAccountProductSchema),
    defaultValues: {
      ...accountProduct,
      id: accountProduct.id!,
    },
  });

  const onSubmit = async (values: z.infer<typeof editAccountProductSchema>) => {
    setIsSubmitting(true);

    if (!firestore) {
        toast({ title: 'Error', description: 'Firestore is not available.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }

    try {
        const { id, ...data } = values;

        const updateData: { [key: string]: any } = {};
        Object.entries(data).forEach(([key, value]) => {
             if (value !== undefined && value !== null && value !== '') {
                updateData[key] = value;
            }
        });
        
        const accountProductRef = doc(firestore, 'account-products', id);
        await updateDoc(accountProductRef, updateData);

        toast({ title: 'Success!', description: 'Product details updated successfully.' });
        onSuccess();
    } catch (error: any) {
        console.error("Error updating product details:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `account-products/${values.id}`,
            operation: 'update',
            requestResourceData: values,
        }));
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "Could not update product details."
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Product</FormLabel>
                <div className="flex gap-2">
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value
                                ? allProducts.find(
                                    (product) => product.id === field.value
                                )?.name
                                : "Select a product"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder="Search products..." />
                            <CommandList>
                            <CommandEmpty>No product found.</CommandEmpty>
                            <CommandGroup>
                                {allProducts.map((product) => (
                                <CommandItem
                                    value={product.name}
                                    key={product.id}
                                    onSelect={() => {
                                    form.setValue("productId", product.id);
                                    setPopoverOpen(false);
                                    }}
                                >
                                    <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        product.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                    />
                                    <div>
                                        <div>{product.name}</div>
                                    </div>
                                </CommandItem>
                                ))}
                            </CommandGroup>
                            </CommandList>
                        </Command>
                        </PopoverContent>
                    </Popover>
                    <CreateProductDialog />
                </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., 'Quarterly order of 5,000 gallons. Consistent usage.'" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex gap-2">
          <SubmitButton isSubmitting={isSubmitting} />
          <DeleteAccountProduct accountProductId={accountProduct.id!} onSuccess={onSuccess} />
        </div>
      </form>
    </Form>
  );
}
