'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';

import { addAccountSchema, editAccountSchema } from '@/lib/schema';
import { type Account } from '@/lib/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

function SubmitButton({ isEditMode, isSubmitting }: { isEditMode: boolean; isSubmitting: boolean }) {
  return (
    <Button type="submit" disabled={isSubmitting} className="w-full">
      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isEditMode ? 'Save Changes' : 'Add Account'}
    </Button>
  );
}

type AddAccountFormProps = {
    account?: Account;
}

export function AddAccountForm({ account }: AddAccountFormProps) {
  const isEditMode = !!account;
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const formSchema = isEditMode ? editAccountSchema : addAccountSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode
      ? account
      : {
          name: '',
          accountNumber: '',
          industry: '',
          status: 'lead',
          details: '',
          address: '',
        },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    if (!firestore) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Firestore is not initialized. Please try again.',
        });
        setIsSubmitting(false);
        return;
    }

    if (isEditMode) {
        const { id, ...accountData } = values as Account;
        const accountRef = doc(firestore, 'accounts-db', id);
        updateDoc(accountRef, accountData)
            .then(() => {
                toast({
                    title: 'Account Updated',
                    description: 'The account details have been saved.',
                });
                router.push(`/dashboard/account/${id}`);
            })
            .catch(async (error) => {
                const permissionError = new FirestorePermissionError({
                    path: accountRef.path,
                    operation: 'update',
                    requestResourceData: accountData
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    } else {
        const accountsCollection = collection(firestore, 'accounts-db');
        addDoc(accountsCollection, values)
            .then((docRef) => {
                toast({
                    title: 'Account Created',
                    description: 'The new account has been added successfully.',
                });
                router.push(`/dashboard/account/${docRef.id}`);
            })
            .catch(async (error) => {
                const permissionError = new FirestorePermissionError({
                    path: accountsCollection.path,
                    operation: 'create',
                    requestResourceData: values
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
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
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input placeholder="Nebraska Chemical" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Number</FormLabel>
              <FormControl>
                <Input placeholder="0148" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industry</FormLabel>
              <FormControl>
                <Input placeholder="Technology" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St, Anytown USA" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Details</FormLabel>
              <FormControl>
                <Textarea placeholder="Initial notes about the account..." {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <SubmitButton isEditMode={isEditMode} isSubmitting={isSubmitting} />
      </form>
    </Form>
  );
}
