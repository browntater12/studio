'use client';

import * as React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { addAccount } from '@/app/actions';
import { addAccountSchema } from '@/lib/schema';
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
  accountId: undefined
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Add Account
    </Button>
  );
}

export function AddAccountForm() {
  const [state, formAction] = useFormState(addAccount, initialState);
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

  const form = useForm<z.infer<typeof addAccountSchema>>({
    resolver: zodResolver(addAccountSchema),
    defaultValues: {
      name: '',
      accountNumber: '',
      industry: '',
      status: 'lead',
      details: '',
      address: '',
    },
    errors: serverErrors,
  });

  const status = form.watch('status');

  React.useEffect(() => {
    if (state.type === 'success' && state.accountId) {
      toast({
        title: 'Success!',
        description: state.message,
      });
      router.push(`/dashboard/account/${state.accountId}`);
    } else if (state.type === 'error') {
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input placeholder="Innovate Corp" {...field} />
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
                <Input placeholder="CUST-001" {...field} />
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
                <Input placeholder="Technology" {...field} />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        {status === 'lead' && (
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St, Anytown USA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Details</FormLabel>
              <FormControl>
                <Textarea placeholder="Initial notes about the account..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <SubmitButton />
      </form>
    </Form>
  );
}
