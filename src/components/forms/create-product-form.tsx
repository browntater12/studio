'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { createProduct } from '@/app/actions';
import { createProductSchema } from '@/lib/schema';
import { type ProductVolume } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const initialState = { type: '', message: '', errors: undefined };

const VOLUMES: { id: ProductVolume; label: string }[] = [
  { id: 'pails', label: 'Pails' },
  { id: 'drums', label: 'Drums' },
  { id: 'totes', label: 'Totes' },
  { id: 'bulk', label: 'Bulk' },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Create Product
    </Button>
  );
}

type CreateProductFormProps = {
  onSuccess: () => void;
};

export function CreateProductForm({ onSuccess }: CreateProductFormProps) {
  const [state, formAction] = useActionState(createProduct, initialState);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof createProductSchema>>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      productNumber: '',
      volumes: [],
    },
  });

  React.useEffect(() => {
    if (state.type === 'success') {
      toast({ title: 'Success!', description: state.message });
      onSuccess();
    } else if (state.type === 'error') {
      toast({ title: 'Error', description: state.message, variant: 'destructive' });
      const errors = state.errors as z.ZodError<z.infer<typeof createProductSchema>>['formErrors']['fieldErrors'] | undefined;
      if (errors) {
        Object.keys(errors).forEach((key) => {
            const fieldKey = key as keyof z.infer<typeof createProductSchema>;
            if (errors[fieldKey]) {
                form.setError(fieldKey, { type: 'server', message: errors[fieldKey]?.[0] });
            }
        });
      }
    }
  }, [state, onSuccess, toast, form]);

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Isopropyl Alcohol 99%" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="productNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g., CHEM-001A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="volumes"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Available Volumes</FormLabel>
                <FormDescription>
                  Select all packaging sizes this product is available in.
                </FormDescription>
              </div>
              {VOLUMES.map(item => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="volumes"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={checked => {
                              return checked
                                ? field.onChange([...(field.value || []), item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      value => value !== item.id
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal capitalize">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton />
      </form>
    </Form>
  );
}
