'use client';

import * as React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { addProductToAccount } from '@/app/actions';
import { addProductToAccountSchema } from '@/lib/schema';
import { type Product } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const initialState = { type: '', message: '', errors: undefined };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Add Product
    </Button>
  );
}

type AddProductToAccountFormProps = {
  accountId: string;
  allProducts: Product[];
  onSuccess: () => void;
};

export function AddProductToAccountForm({ accountId, allProducts, onSuccess }: AddProductToAccountFormProps) {
  const [state, formAction] = useFormState(addProductToAccount, initialState);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof addProductToAccountSchema>>({
    resolver: zodResolver(addProductToAccountSchema),
    defaultValues: {
      accountId,
      productId: '',
      notes: '',
    },
    errors: state?.errors ? (Object.keys(state.errors).reduce((acc, key) => {
        const fieldKey = key as keyof z.infer<typeof addProductToAccountSchema>;
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
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product to add" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {allProducts.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.productNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Notes for this Account</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., 'Quarterly order of 5,000 gallons. Consistent usage.'" {...field} />
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
