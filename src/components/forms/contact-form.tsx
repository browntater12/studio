
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2 } from 'lucide-react';
import { type Contact, type UserProfile } from '@/lib/types';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, writeBatch, query, where, getDocs, deleteDoc } from 'firebase/firestore';

import { contactSchema } from '@/lib/schema';
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
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

function DeleteContact({ contactId, onSuccess }: { contactId: string; onSuccess: () => void; }) {
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
        const contactRef = doc(firestore, 'contacts', contactId);
        
        try {
            await deleteDoc(contactRef);
            toast({ title: 'Success!', description: 'Contact deleted successfully.' });
            onSuccess();
            setOpen(false);
        } catch (error) {
            console.error("Error deleting contact:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: contactRef.path,
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
                        This action cannot be undone. This will permanently delete this contact.
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
  const schema = contactSchema.extend({
      isPrimary: z.boolean().optional(),
      id: z.string().optional(),
  });
  type SchemaType = z.infer<typeof schema>;
  
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode
      ? { ...contact, isMainContact: contact.isMainContact || false }
      : {
          accountNumber,
          name: '',
          position: '',
          phone: '',
          email: '',
          isMainContact: false,
          location: '',
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

    if (!values.companyId) {
        toast({ title: 'Error', description: 'Company ID is missing.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }

    try {
        if (!firestore) {
            throw new Error("Firestore is not initialized");
        }

        const contactsCol = collection(firestore, 'contacts');
        const contactData = {
          name: values.name,
          position: values.position,
          email: values.email,
          phone: values.phone,
          location: values.location,
          isMainContact: values.isMainContact,
          accountNumber: values.accountNumber,
          companyId: values.companyId,
          avatarUrl: contact?.avatarUrl,
        }

        if (values.isMainContact) {
            const batch = writeBatch(firestore);
            const q = query(contactsCol, where('accountNumber', '==', values.accountNumber), where('isMainContact', '==', true), where('companyId', '==', values.companyId));
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
                if (!isEditMode || (isEditMode && contact?.id !== doc.id)) {
                    batch.update(doc.ref, { isMainContact: false });
                }
            });
            await batch.commit();
        }

        if (isEditMode && contact) {
            const contactRef = doc(firestore, 'contacts', contact.id);
            await updateDoc(contactRef, contactData);
            toast({ title: 'Success!', description: 'Contact updated successfully.' });
        } else {
            await addDoc(contactsCol, {
                ...contactData,
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
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position</FormLabel>
              <FormControl><Input placeholder="e.g. Sales Manager" {...field} value={field.value ?? ''} /></FormControl>
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
              <FormControl><Input type="email" placeholder="john.doe@example.com" {...field} value={field.value ?? ''} /></FormControl>
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
              <FormControl><Input placeholder="123-456-7890" {...field} value={field.value ?? ''} /></FormControl>
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
              <FormControl><Input placeholder="City, State" {...field} value={field.value ?? ''} /></FormControl>
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
            {isEditMode && contact && <DeleteContact contactId={contact.id} onSuccess={onSuccess} />}
        </div>
      </form>
    </Form>
  );
}
