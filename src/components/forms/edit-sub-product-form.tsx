'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { editSubProductSchema } from '@/lib/schema';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type SubProduct } from '@/lib/types';
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

function DeleteSubProductButton({ subProduct, onSuccess }: { subProduct: SubProduct, onSuccess: () => void }) {
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
            const productRef = doc(firestore, 'products', subProduct.baseProductId, 'individual-products', subProduct.id);
            await deleteDoc(productRef);
            toast({ title: 'Success!', description: 'Product variation deleted successfully.' });
            onSuccess();
        } catch (error) {
            console.error('Error deleting product variation:', error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `products/${subProduct.baseProductId}/individual-products/${subProduct.id}`,
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
                        This action cannot be undone. This will permanently delete this product variation.
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

type EditSubProductFormProps = {
  subProduct: SubProduct;
  onSuccess: () => void;
};

export function EditSubProductForm({ subProduct, onSuccess }: EditSubProductFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof editSubProductSchema>>({
    resolver: zodResolver(editSubProductSchema),
    defaultValues: {
      ...subProduct,
      volume: subProduct.volume ?? undefined,
      volumeUnit: subProduct.volumeUnit ?? undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof editSubProductSchema>) => {
    setIsSubmitting(true);
    if (!firestore) {
      toast({
        title: 'Error',
        description: 'Database connection is not available.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    try {
        const subProductRef = doc(firestore, 'products', values.baseProductId, 'individual-products', values.id);
        const dataToSave = {
            ...values,
            volume: values.volume ? Number(values.volume) : undefined,
        };
        await updateDoc(subProductRef, dataToSave);

      toast({
        title: 'Success!',
        description: 'Product variation updated.',
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error updating sub-product:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product variation.',
        variant: 'destructive',
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
                <Input placeholder="e.g., Industrial Grade 93%" {...field} />
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
                <FormLabel className="sr-only">Unit</FormLabel>
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Specific details about this product variation..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
            </Button>
            <DeleteSubProductButton subProduct={subProduct} onSuccess={onSuccess} />
        </div>
      </form>
    </Form>
  );
}
