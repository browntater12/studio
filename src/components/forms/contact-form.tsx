'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2 } from 'lucide-react';
import { type Contact } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, addDoc, doc, updateDoc, writeBatch, query, where, getDocs, deleteDoc } from 'firebase/firestore';

import { addContactSchema, editContactSchema } from '@/lib/schema';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
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


function DeleteContactButton({ contactId, onSuccess }: { contactId: string; onSuccess: () => void; }) {
    const [isDeleting, setIsDeleting] = React.useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleDelete = async () => {
        setIsDeleting(true);
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
            setIsDeleting(false);
            return;
        }

        try {
            const contactRef = doc(firestore, 'contacts', contactId);
            await deleteDoc(contactRef);
            toast({ title: 'Success!', description: 'Contact deleted successfully.' });
            onSuccess();
        } catch (error: any) {
            console.error("Error deleting contact:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to delete contact.',
            });
        } finally {
            setIsDeleting(false);
        }
    };
    
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button">
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this contact.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
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
      {isEditMode ? 'Save Changes' : 'Add Contact'}
    </Button>
  );
}

type ContactFormProps = {
  accountNumber: string;
  contact?: Contact;
  onSuccess: () => void;
};

export function ContactForm({ accountNumber, contact, onSuccess }: ContactFormProps) {
  const isEditMode = !!contact;
  const schema = isEditMode ? editContactSchema : addContactSchema;
  type SchemaType = z.infer<typeof schema>;
  
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode
      ? {
          ...contact,
          contactId: contact.id,
        }
      : {
          accountNumber,
          name: '',
          phone: '',
          email: '',
          location: '',
          isMainContact: false,
        },
  });
  
  const onSubmit = async (values: SchemaType) => {
    setIsSubmitting(true);
    try {
        if (!firestore) {
            throw new Error("Firestore is not initialized");
        }

        const contactsCol = collection(firestore, 'contacts');

        if (values.isMainContact) {
            const batch = writeBatch(firestore);
            const mainContactsQuery = query(contactsCol, where('accountNumber', '==', values.accountNumber), where('isMainContact', '==', true));
            const mainContactsSnap = await getDocs(mainContactsQuery);
            mainContactsSnap.forEach(doc => {
                if (!isEditMode || (isEditMode && contact.id !== doc.id)) {
                    batch.update(doc.ref, { isMainContact: false });
                }
            });
            await batch.commit();
        }

        if (isEditMode) {
            const { contactId, ...contactData } = values as z.infer<typeof editContactSchema>;
            const contactRef = doc(firestore, 'contacts', contactId);
            await updateDoc(contactRef, contactData);
            toast({ title: 'Success!', description: 'Contact updated successfully.' });
        } else {
            await addDoc(contactsCol, {
                ...values,
                avatarUrl: PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)].imageUrl,
            });
            toast({ title: 'Success!', description: 'Contact added successfully.' });
        }
        
        onSuccess();
    } catch (error: any) {
        console.error("Contact form error:", error);
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
              <FormLabel>Full Name</FormLabel>
              <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl><Input placeholder="123-456-7890" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl><Input placeholder="New York, NY" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isMainContact"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  name={field.name}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Set as main contact</FormLabel>
              </div>
            </FormItem>
          )}
        />
        <div className="flex gap-2">
            <SubmitButton isEditMode={isEditMode} isSubmitting={isSubmitting} />
            {isEditMode && contact && <DeleteContactButton contactId={contact.id} onSuccess={onSuccess} />}
        </div>
      </form>
    </Form>
  );
}
