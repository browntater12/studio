'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { type Contact } from '@/lib/types';

import { addContact, updateContact } from '@/app/actions';
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

const initialState = { type: '', message: '', errors: undefined };

function SubmitButton({ isEditMode }: { isEditMode: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
  const action = isEditMode ? updateContact : addContact;
  const schema = isEditMode ? editContactSchema : addContactSchema;
  type SchemaType = z.infer<typeof schema>;

  const [state, formAction] = useActionState(action, initialState);
  const { toast } = useToast();

  const serverErrors = React.useMemo(() => {
    return state?.errors
      ? Object.keys(state.errors).reduce((acc, key) => {
          const fieldKey = key as keyof SchemaType;
          if (state.errors?.[fieldKey]) {
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
    errors: serverErrors,
  });

  React.useEffect(() => {
    if (state.type === 'success') {
      toast({ title: 'Success!', description: state.message });
      onSuccess();
    } else if (state.type === 'error') {
      toast({ title: 'Error', description: state.message, variant: 'destructive' });
      Object.keys(form.getValues()).forEach(key => {
        const fieldKey = key as keyof SchemaType;
        if (state.errors?.[fieldKey]) {
          form.setError(fieldKey, { type: 'server', message: state.errors[fieldKey]?.[0] });
        }
      });
    }
  }, [state, onSuccess, toast, form]);

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="accountNumber" value={accountNumber} />
        {isEditMode && <input type="hidden" name="contactId" value={contact.id} />}
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
        <SubmitButton isEditMode={isEditMode} />
      </form>
    </Form>
  );
}
