'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';

import { updateAccount } from '@/app/actions';
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

const editInitialState = {
  type: '',
  message: '',
  errors: undefined,
};

function SubmitButton({ isEditMode }: { isEditMode: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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

  // For handling the edit mode which still uses a server action
  const [editState, editFormAction] = useActionState(updateAccount, editInitialState);

  const form = useForm<z.infer<typeof addAccountSchema>>({
    resolver: zodResolver(isEditMode ? editAccountSchema : addAccountSchema),
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

  const onSubmit = async (values: z.infer<typeof addAccountSchema>) => {
    if (isEditMode) {
      // This should not happen if we separate forms, but as a fallback
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (!firestore) {
          throw new Error("Firestore is not initialized");
      }
      const accountsCollection = collection(firestore, 'accounts-db');
      const docRef = await addDoc(accountsCollection, values);
      
      toast({
        title: 'Account Created',
        description: 'The new account has been added successfully.',
      });

      router.push(`/dashboard/account/${docRef.id}`);

    } catch (error: any) {
      console.error('***ADD ACCOUNT FAILED***:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create account. Please try again.',
      });
      setIsSubmitting(false);
    }
  };
  
  const action = isEditMode ? editFormAction : form.handleSubmit(onSubmit);


  return (
    <Form {...form}>
      <form action={action as any} className="space-y-4">
        {isEditMode && <input type="hidden" name="id" value={account.id} />}
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
        <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEditMode ? 'Save Changes' : 'Add Account'}
        </Button>
      </form>
    </Form>
  );
}
