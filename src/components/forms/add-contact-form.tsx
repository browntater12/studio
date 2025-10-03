'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { addContact } from '@/app/actions';
import { addContactSchema } from '@/lib/schema';
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

const initialState = { type: '', message: '', errors: undefined };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Add Contact
    </Button>
  );
}

type AddContactFormProps = {
  accountId: string;
  onSuccess: () => void;
};

export function AddContactForm({ accountId, onSuccess }: AddContactFormProps) {
  const [state, formAction] = useActionState(addContact, initialState);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof addContactSchema>>({
    resolver: zodResolver(addContactSchema),
    defaultValues: {
      accountId,
      name: '',
      phone: '',
      email: '',
      location: '',
      isMainContact: false,
    },
    errors: state?.errors ? (Object.keys(state.errors).reduce((acc, key) => {
        const fieldKey = key as keyof z.infer<typeof addContactSchema>;
        if (state.errors?.[fieldKey]) {
            acc[fieldKey] = { type: 'server', message: state.errors[fieldKey]?.[0] };
        }
        return acc;
    }, {} as any)) : {},
  });

  React.useEffect(() => {
    if (state.type === 'success') {
      toast({ title: 'Success!', description: state.message });
      onSuccess();
    } else if (state.type === 'error') {
      toast({ title: 'Error', description: state.message, variant: 'destructive' });
    }
  }, [state, onSuccess, toast]);

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="accountId" value={accountId} />
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
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Set as main contact</FormLabel>
              </div>
            </FormItem>
          )}
        />
        <SubmitButton />
      </form>
    </Form>
  );
}
