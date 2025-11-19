
'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateProductForm } from './create-product-form';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

function CreateProductDialog() {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
            <PlusCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <CreateProductForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button type="submit" disabled={isSubmitting} className="w-full">
      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
  const { toast } = useToast();
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof addProductToAccountSchema>>({
    resolver: zodResolver(addProductToAccountSchema),
    defaultValues: {
      accountId,
      productId: '',
      notes: '',
      type: 'purchasing',
    },
  });

  const onSubmit = async (values: z.infer<typeof addProductToAccountSchema>) => {
    if (!firestore) {
        toast({
            title: 'Error',
            description: 'Database not available.',
            variant: 'destructive'
        });
        return;
    }

    setIsSubmitting(true);

    const productData: { [key: string]: any } = {
        createdAt: serverTimestamp(),
        accountId: values.accountId,
        productId: values.productId,
        type: values.type,
    };
    
    if (values.notes) {
      productData.notes = values.notes;
    }
    
    const accountProductsCollection = collection(firestore, 'account-products');
    
    addDoc(accountProductsCollection, productData)
        .then(() => {
            toast({ title: 'Success!', description: 'Product added to account successfully.' });
            onSuccess();
        })
        .catch((error) => {
            console.error("Error adding product to account: ", error);
            const permissionError = new FirestorePermissionError({
                path: accountProductsCollection.path,
                operation: 'create',
                requestResourceData: productData,
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsSubmitting(false);
        });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField
            control={form.control}
            name="productId"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Product</FormLabel>
                    <div className="flex gap-2">
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
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
                                        form.setValue("productId", product.id);
                                        setPopoverOpen(false);
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
                                        </div>
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                                </CommandList>
                            </Command>
                            </PopoverContent>
                        </Popover>
                        <CreateProductDialog />
                    </div>
                <FormMessage />
                </FormItem>
            )}
            />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="purchasing" />
                    </FormControl>
                    <FormLabel className="font-normal">Purchasing</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="opportunity" />
                    </FormControl>
                    <FormLabel className="font-normal">Opportunity</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                    <Textarea placeholder="Quarterly order of 5,000 gallons. Consistent usage." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <SubmitButton isSubmitting={isSubmitting} />
      </form>
    </Form>
  );
}

    