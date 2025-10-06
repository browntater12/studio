'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
  const [state, formAction] = useActionState(addProductToAccount, initialState);
  const { toast } = useToast();

  const serverErrors = React.useMemo(() => {
    return state?.errors ? (Object.keys(state.errors).reduce((acc, key) => {
        const fieldKey = key as keyof z.infer<typeof addProductToAccountSchema>;
        if (state.errors?.[fieldKey]) {
            acc[fieldKey] = { type: 'server', message: state.errors[fieldKey]?.[0] };
        }
        return acc;
    }, {} as any)) : {};
  }, [state?.errors]);

  const form = useForm<z.infer<typeof addProductToAccountSchema>>({
    resolver: zodResolver(addProductToAccountSchema),
    defaultValues: {
      accountId,
      productId: '',
      notes: '',
    },
    errors: serverErrors,
  });

  React.useEffect(() => {
    if (state.type === 'success') {
      toast({ title: 'Success!', description: state.message });
      onSuccess();
    } else if (state.type === 'error') {
      toast({ title: 'Error', description: state.message, variant: 'destructive' });
      Object.keys(form.getValues()).forEach((key) => {
        const fieldKey = key as keyof z.infer<typeof addProductToAccountSchema>;
        if (state.errors?.[fieldKey]) {
            form.setError(fieldKey, { type: 'server', message: state.errors[fieldKey]?.[0] });
        }
      });
    }
  }, [state, onSuccess, toast, form]);

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="accountId" value={accountId} />
        
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Product</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? allProducts.find(
                            (product) => product.id === field.value
                          )?.name
                        : "Select a product"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search products..." />
                    <CommandList>
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandGroup>
                        {allProducts.map((product) => (
                          <CommandItem
                            value={product.name}
                            key={product.id}
                            onSelect={() => {
                              form.setValue("productId", product.id)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                product.id === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div>
                                <div>{product.name}</div>
                                <div className="text-xs text-muted-foreground">{product.productNumber}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
