'use client';

import * as React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { addAccount, updateAccount } from '@/app/actions';
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

const initialState = {
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
  const action = isEditMode ? updateAccount : addAccount;
  const schema = isEditMode ? editAccountSchema : addAccountSchema;
  type SchemaType = z.infer<typeof schema>;

  const [state, formAction] = useFormState(action, initialState);
  const { toast } = useToast();
  const router = useRouter();

  const serverErrors = React.useMemo(() => {
    return state?.errors
      ? Object.keys(state.errors).reduce((acc, key) => {
          const fieldKey = key as keyof typeof state.errors;
          if (state.errors && state.errors[fieldKey]) {
            (acc as any)[fieldKey] = {
              type: 'server',
              message: state.errors[fieldKey]?.[0] || 'Server validation failed',
            };
          }
          return acc;
        }, {})
      : {};
  }, [state?.errors]);

  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
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
    errors: serverErrors,
  });

  React.useEffect(() => {
    if (state.type === 'error') {
      toast({
        title: 'Error',
        description: state.message,
        variant: 'destructive',
      });
      // Reset server errors on the form
      Object.keys(form.getValues()).forEach((key) => {
        const fieldKey = key as keyof z.infer<typeof addAccountSchema>;
        if (state.errors?.[fieldKey]) {
            form.setError(fieldKey, { type: 'server', message: state.errors[fieldKey]?.[0] });
        }
      });
    }
  }, [state, router, toast, form]);

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
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
        <SubmitButton isEditMode={isEditMode}/>
      </form>
    </Form>
  );
}
