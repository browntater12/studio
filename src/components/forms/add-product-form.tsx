
'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';

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
      spotFrequency: undefined,
      spotQuantity: undefined,
      priceUnit: 'lb',
      priceDetails: {
        type: 'quote',
        price: undefined,
      },
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
    };

    Object.entries(values).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return;
        }

        if (key === 'priceDetails' && typeof value === 'object') {
            const cleanPriceDetails: { [key: string]: any } = {};
            if (value.type !== undefined) cleanPriceDetails.type = value.type;
            if (value.price !== undefined && value.price !== null) cleanPriceDetails.price = Number(value.price);
            
            if (Object.keys(cleanPriceDetails).length === 2 && cleanPriceDetails.price !== undefined) {
              productData[key] = cleanPriceDetails;
            }
        } else if (['spotQuantity'].includes(key)) {
             productData[key] = Number(value);
        } else {
            productData[key] = value;
        }
    });
    
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


  const priceDetailsType = useWatch({
    control: form.control,
    name: 'priceDetails.type',
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField
            control={form.control}
            name="productId"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Product</FormLabel>
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
                <FormMessage />
                </FormItem>
            )}
            />
            
            <div className="space-y-4 rounded-md border p-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="spotFrequency"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Frequency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="annually">Annually</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="spotQuantity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>QTY</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="500" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="priceDetails.type"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>Price Type</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                            name={field.name}
                            >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="quote" />
                                </FormControl>
                                <FormLabel className="font-normal">Quote</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="last_paid" />
                                </FormControl>
                                <FormLabel className="font-normal">Last Price Paid</FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-3 gap-4">
                    <FormField
                    control={form.control}
                    name="priceDetails.price"
                    render={({ field }) => (
                        <FormItem className="col-span-2">
                        <FormLabel>{priceDetailsType === 'quote' ? 'Quote Price' : 'Last Price Paid'}</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g. 1.23" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="priceUnit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unit</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Unit" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="lb">lb</SelectItem>
                                        <SelectItem value="gal">gal</SelectItem>
                                        <SelectItem value="kg">kg</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

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
