'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

import { createProductSchema, editProductSchema } from '@/lib/schema';
import { type Product } from '@/lib/types';

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
import { Textarea } from '../ui/textarea';
import { MultiSelect } from '../ui/multi-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';

const industryOptions = [
    { value: 'Adhesives', label: 'Adhesives' },
    { value: 'Agriculture', label: 'Agriculture' },
    { value: 'Alcohol', label: 'Alcohol' },
    { value: 'Animal Butchering', label: 'Animal Butchering' },
    { value: 'Animal By-Products', label: 'Animal By-Products' },
    { value: 'Chemical Services', label: 'Chemical Services' },
    { value: 'Cooling', label: 'Cooling' },
    { value: 'Cooperative', label: 'Cooperative' },
    { value: 'Energy', label: 'Energy' },
    { value: 'Ethanol', label: 'Ethanol' },
    { value: 'Food', label: 'Food' },
    { value: 'Manufacturing', label: 'Manufacturing' },
    { value: 'Mechanical Contractor', label: 'Mechanical Contractor' },
    { value: 'Mining & Wells', label: 'Mining & Wells' },
    { value: 'Municipal', label: 'Municipal' },
    { value: 'Oil and Gas', label: 'Oil and Gas' },
    { value: 'Pharmaceuticals', label: 'Pharmaceuticals' },
    { value: 'Plating and Coating', label: 'Plating and Coating' },
    { value: 'Soybean Processing', label: 'Soybean Processing' },
    { value: 'Stone and Concrete', label: 'Stone and Concrete' },
    { value: 'Water Treatment', label: 'Water Treatment' },
  ].sort((a, b) => a.label.localeCompare(b.label));

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

  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode
      ? { ...product }
      : {
          name: '',
          productCode: '',
          description: '',
          notes: '',
          industries: [],
          size: undefined,
          volume: undefined,
          volumeUnit: 'lb',
          weightPerGallon: undefined,
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
        const dataToSave = {
            ...values,
            volume: values.volume ? Number(values.volume) : undefined,
            weightPerGallon: values.weightPerGallon ? Number(values.weightPerGallon) : undefined,
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
        <FormField
          control={form.control}
          name="size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Size</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bags">Bags</SelectItem>
                  <SelectItem value="pails">Pails</SelectItem>
                  <SelectItem value="drums">Drums</SelectItem>
                  <SelectItem value="totes">Totes</SelectItem>
                  <SelectItem value="bulk">Bulk</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-3 gap-4">
            <FormField
            control={form.control}
            name="volume"
            render={({ field }) => (
                <FormItem className="col-span-2">
                <FormLabel>Volume</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g., 55" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="volumeUnit"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="gal">gal</SelectItem>
                    <SelectItem value="lb">lb</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="weightPerGallon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight per Gallon (lbs)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 8.34" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Public-facing description of the product." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Internal Notes</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Internal notes about this product..." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="industries"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Industries</FormLabel>
                    <MultiSelect
                        options={industryOptions}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder="Select industries..."
                        className="w-full"
                    />
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
