'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';


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
      priceType: 'spot',
      bidFrequency: undefined,
      lastBidPrice: undefined,
      winningBidPrice: undefined,
      priceDetails: {
        type: 'quote',
        price: undefined,
      }
    },
  });

  const onSubmit = async (values: z.infer<typeof addProductToAccountSchema>) => {
    setIsSubmitting(true);
    try {
        if (!firestore) {
            throw new Error("Firestore is not available.");
        }

        // Create a clean data object to avoid sending `undefined` to Firestore
        const productData: { [key: string]: any } = {};
        Object.entries(values).forEach(([key, value]) => {
            if (value !== undefined) {
                if (key === 'priceDetails' && typeof value === 'object' && value !== null) {
                    const cleanPriceDetails: { [key: string]: any } = {};
                    Object.entries(value).forEach(([pdKey, pdValue]) => {
                        if (pdValue !== undefined) {
                            cleanPriceDetails[pdKey] = pdValue;
                        }
                    });
                    if(Object.keys(cleanPriceDetails).length > 0) {
                      productData[key] = cleanPriceDetails;
                    }
                } else {
                    productData[key] = value;
                }
            }
        });

        const accountProductsCollection = collection(firestore, 'account-products');
        await addDoc(accountProductsCollection, productData);

        toast({ title: 'Success!', description: 'Product added to account successfully.' });
        onSuccess();

    } catch(error: any) {
        console.error("Error adding product to account: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to add product to account."
        });
    } finally {
        setIsSubmitting(false);
    }
  }


  const priceTypeValue = useWatch({
    control: form.control,
    name: 'priceType',
  });
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

        <div className="space-y-4 rounded-md border p-4">
             <FormField
              control={form.control}
              name="priceType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Pricing Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                      name={field.name}
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="spot" />
                        </FormControl>
                        <FormLabel className="font-normal">Spot Price</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="bid" />
                        </FormControl>
                        <FormLabel className="font-normal">Bid Price</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {priceTypeValue === 'bid' && (
                <>
                <FormField
                    control={form.control}
                    name="bidFrequency"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Bid Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="lastBidPrice"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Last Bid Price</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g. 12.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="winningBidPrice"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Winning Bid Price</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g. 11.50" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                </>
            )}
        </div>
        
        {priceTypeValue !== 'bid' && (
            <div className="space-y-4 rounded-md border p-4">
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
                <FormField
                control={form.control}
                name="priceDetails.price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{priceDetailsType === 'quote' ? 'Quote Price' : 'Last Price Paid'}</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g. 15.50" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        )}
        
        <SubmitButton isSubmitting={isSubmitting} />
      </form>
    </Form>
  );
}
