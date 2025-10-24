
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2 } from 'lucide-react';
import { type ShippingLocation } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

import { shippingLocationSchema } from '@/lib/schema';
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

function DeleteLocationButton({ locationId, onSuccess }: { locationId: string; onSuccess: () => void; }) {
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const firestore = useFirestore();

    const handleDelete = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database service not available.' });
            return;
        }
        setIsDeleting(true);
        const locationRef = doc(firestore, 'shipping-locations', locationId);
        
        try {
            await deleteDoc(locationRef);
            toast({ title: 'Success!', description: 'Location deleted successfully.' });
            onSuccess();
            setOpen(false);
        } catch (error) {
            console.error("Error deleting location:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: locationRef.path,
                operation: 'delete',
            }));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
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
                        This action cannot be undone. This will permanently delete this location.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function SubmitButton({ isEditMode, isSubmitting }: { isEditMode: boolean; isSubmitting: boolean }) {
  return (
    <Button type="submit" disabled={isSubmitting} className="flex-1">
      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isEditMode ? 'Save Changes' : 'Add Location'}
    </Button>
  );
}

type ShippingLocationFormProps = {
  accountId: string;
  location?: ShippingLocation;
  onSuccess: () => void;
};

export function ShippingLocationForm({ accountId, location, onSuccess }: ShippingLocationFormProps) {
  const isEditMode = !!location;
  type SchemaType = z.infer<typeof shippingLocationSchema>;
  
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SchemaType>({
    resolver: zodResolver(shippingLocationSchema),
    defaultValues: isEditMode
      ? { ...location }
      : {
          accountId,
          name: '',
          address: '',
        },
  });
  
  const onSubmit = async (values: SchemaType) => {
    setIsSubmitting(true);
    try {
        if (!firestore) {
            throw new Error("Firestore is not initialized");
        }

        const locationData = {
          name: values.name,
          address: values.address,
          accountId: values.accountId,
        }

        if (isEditMode && location) {
            const locationRef = doc(firestore, 'shipping-locations', location.id);
            await updateDoc(locationRef, locationData);
            toast({ title: 'Success!', description: 'Location updated successfully.' });
        } else {
            const locationsCol = collection(firestore, 'shipping-locations');
            await addDoc(locationsCol, locationData);
            toast({ title: 'Success!', description: 'Location added successfully.' });
        }
        
        onSuccess();
    } catch (error: any) {
        console.error("Shipping location form error:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'An unexpected error occurred.',
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
              <FormLabel>Location Name</FormLabel>
              <FormControl><Input placeholder="e.g., Main Warehouse" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Address</FormLabel>
              <FormControl><Textarea placeholder="123 Industrial Dr, Suite 100&#10;Anytown, ST 12345" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex gap-2">
            <SubmitButton isEditMode={isEditMode} isSubmitting={isSubmitting} />
            {isEditMode && location && <DeleteLocationButton locationId={location.id} onSuccess={onSuccess} />}
        </div>
      </form>
    </Form>
  );
}
