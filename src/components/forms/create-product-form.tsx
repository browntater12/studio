'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';


import { createProductSchema, editProductSchema } from '@/lib/schema';
import { type Product, type ProductVolume } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const VOLUMES: { id: ProductVolume; label: string }[] = [
  { id: 'pails', label: 'Pails' },
  { id: 'drums', label: 'Drums' },
  { id: 'totes', label: 'Totes' },
  { id: 'bulk', label: 'Bulk' },
];

function SubmitButton({ isEditMode, isSubmitting }: { isEditMode: boolean, isSubmitting: boolean }) {
  return (
    <Button type="submit" disabled={isSubmitting} className="flex-1">
      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isEditMode ? 'Save Changes' : 'Create Base Product'}
    </Button>
  );
}

function DeleteProductButton({ productId, onSuccess }: { productId: string, onSuccess: () => void }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = React.useState(false);
    const firestore = useFirestore();

    const handleDelete = async () => {
        if (!firestore) {
            toast({ title: 'Error', description: 'Database service not available.', variant: 'destructive' });
            return;
        }
        setIsDeleting(true);
        try {
            const productRef = doc(firestore, 'products', productId);
            await deleteDoc(productRef);
            // This is complex. We would also need to delete all `account-products` that reference this product.
            // For now, we will just delete the product itself. A more robust solution might use a Cloud Function.

            toast({ title: 'Success!', description: 'Product deleted successfully.' });
            onSuccess();
            router.push('/dashboard/products');
        } catch (error) {
            console.error('Error deleting product:', error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `products/${productId}`,
                operation: 'delete',
            }));
        } finally {
            setIsDeleting(false);
        }
    }

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
                        This action cannot be undone. This will permanently delete the product
                        from the global catalog and remove it from all associated accounts.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                         {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

type CreateProductFormProps = {
  product?: Product;
  onSuccess: () => void;
};

export function CreateProductForm({ product, onSuccess }: CreateProductFormProps) {
  const isEditMode = !!product;
  const schema = isEditMode ? editProductSchema : createProductSchema;
  type SchemaType = z.infer<typeof schema>;

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode
      ? { ...product, id: product.id }
      : {
          name: '',
          productNumber: '',
          volumes: [],
        },
  });
  
  const onSubmit = async (values: SchemaType) => {
    setIsSubmitting(true);
    if (!firestore) {
      toast({ title: "Error", description: "Firestore is not available.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    try {
      const productsCollection = collection(firestore, 'products');

      // Check for uniqueness on both create and edit
      const q = query(productsCollection, where("productNumber", "==", values.productNumber));
      const querySnapshot = await getDocs(q);
      
      let productNumberExists = false;
      querySnapshot.forEach((doc) => {
        if (!isEditMode || (isEditMode && doc.id !== product.id)) {
            productNumberExists = true;
        }
      });

      if (productNumberExists) {
        form.setError('productNumber', {
            type: 'manual',
            message: 'A product with this product number already exists.',
        });
        throw new Error("Product number already exists.");
      }
      
      if (isEditMode) {
          const productRef = doc(firestore, 'products', product.id!);
          const { id, ...updateData } = values as z.infer<typeof editProductSchema>;
          await updateDoc(productRef, updateData);
          toast({ title: "Success!", description: "Product updated successfully." });
      } else {
          await addDoc(productsCollection, values);
          toast({ title: "Product Created", description: "The new product has been added to the catalog." });
      }
      onSuccess();
    } catch (error: any) {
      if (error.message !== "Product number already exists.") {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to save product.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Isopropyl Alcohol 99%" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="productNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g., CHEM-001A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="volumes"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Available Volumes</FormLabel>
                <FormDescription>
                  Select all packaging sizes this product is available in.
                </FormDescription>
              </div>
              {VOLUMES.map(item => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="volumes"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={checked => {
                              return checked
                                ? field.onChange([...(field.value || []), item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      value => value !== item.id
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal capitalize">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
            <SubmitButton isEditMode={isEditMode} isSubmitting={isSubmitting} />
            {isEditMode && product && <DeleteProductButton productId={product.id} onSuccess={onSuccess} />}
        </div>
      </form>
    </Form>
  );
}
