
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

import { createProductSchema, editProductSchema } from '@/lib/schema';
import { type Product, type UserProfile } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';

function SubmitButton({ isEditMode, isSubmitting }: { isEditMode: boolean, isSubmitting: boolean }) {
  return (
    <Button type="submit" disabled={isSubmitting} className="flex-1">
      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isEditMode ? 'Save Changes' : 'Create Product'}
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
  const { user } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode
      ? { ...product }
      : {
          name: '',
          productCode: '',
          attribute1: '',
          attribute2: '',
          attribute3: '',
          attribute4: '',
          companyId: '',
        },
  });

  React.useEffect(() => {
    if (userProfile && !form.getValues('companyId')) {
      form.setValue('companyId', userProfile.companyId);
    }
  }, [userProfile, form]);
  
  const onSubmit = async (values: SchemaType) => {
    setIsSubmitting(true);
    if (!firestore) {
      toast({ title: "Error", description: "Firestore is not available.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
     if (!values.companyId) {
        toast({ title: 'Error', description: 'Company ID is missing.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }

    try {
        const dataToSave = {
            ...values,
          }

      if (isEditMode) {
          const productRef = doc(firestore, 'products', product.id!);
          const { id, ...updateData } = dataToSave as z.infer<typeof editProductSchema>;
          await updateDoc(productRef, updateData);
          toast({ title: "Success!", description: "Product updated successfully." });
      } else {
          const productsCollection = collection(firestore, 'products');
          await addDoc(productsCollection, dataToSave);
          toast({ title: "Product Created", description: "The new product has been added to the catalog." });
      }
      onSuccess();
    } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to save product.",
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
          name="productCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Code</FormLabel>
              <FormControl>
                <Input placeholder="e.g., SA-93-55G" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="attribute1"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Attribute 1</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Color" {...field} value={field.value || ''}/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="attribute2"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Attribute 2</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Size" {...field} value={field.value || ''}/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="attribute3"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Attribute 3</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Weight" {...field} value={field.value || ''}/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="attribute4"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Attribute 4</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Unit" {...field} value={field.value || ''}/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        <div className="flex gap-2">
            <SubmitButton isEditMode={isEditMode} isSubmitting={isSubmitting} />
            {isEditMode && product && <DeleteProductButton productId={product.id} onSuccess={onSuccess} />}
        </div>
      </form>
    </Form>
  );
}
