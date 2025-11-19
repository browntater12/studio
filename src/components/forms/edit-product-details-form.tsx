
'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormState } from 'react-dom';
import { Loader2, Check, ChevronsUpDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


import { editAccountProductSchema, deleteAccountProductSchema } from '@/lib/schema';
import { type Product, type AccountProduct } from '@/lib/types';
import { updateAccountProduct } from '@/app/actions';

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
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

function DeleteAccountProduct({ accountProductId, onSuccess }: { accountProductId: string; onSuccess: () => void; }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const firestore = useFirestore();

    const handleDelete = async () => {
        if (!firestore) {
            toast({ title: 'Error', description: 'Firestore not available', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            const docRef = doc(firestore, 'account-products', accountProductId);
            await deleteDoc(docRef);
            toast({ title: 'Success!', description: "Product link from account deleted." });
            onSuccess();
        } catch (error) {
            console.error("Error deleting account product:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `account-products/${accountProductId}`,
                operation: 'delete',
            }));
            toast({ title: 'Error', description: "Failed to delete product link.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will remove this product and its notes from this account. It will not delete the product from the global catalog.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button type="submit" disabled={isSubmitting} className="w-full flex-1">
      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Save Changes
    </Button>
  );
}

type EditProductDetailsFormProps = {
  accountProduct: AccountProduct;
  allProducts: Product[];
  onSuccess: () => void;
};

export function EditProductDetailsForm({ accountProduct, allProducts, onSuccess }: EditProductDetailsFormProps) {
  const { toast } = useToast();
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof editAccountProductSchema>>({
    resolver: zodResolver(editAccountProductSchema),
    defaultValues: {
      ...accountProduct,
      id: accountProduct.id!,
      spotFrequency: accountProduct.spotFrequency ?? undefined,
      spotQuantity: accountProduct.spotQuantity ?? undefined,
      lastBidPrice: accountProduct.lastBidPrice ?? undefined,
      winningBidPrice: accountProduct.winningBidPrice ?? undefined,
      priceUnit: accountProduct.priceUnit ?? 'lb',
      priceDetails: {
        type: accountProduct.priceDetails?.type || 'quote',
        price: accountProduct.priceDetails?.price ?? undefined,
      }
    },
  });

  const onSubmit = async (values: z.infer<typeof editAccountProductSchema>) => {
    setIsSubmitting(true);

    if (!firestore) {
        toast({ title: 'Error', description: 'Firestore is not available.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }

    try {
        const { id, ...data } = values;

        // Clean the data object to remove undefined values before sending to Firestore
        const updateData: { [key: string]: any } = {};
        Object.entries(data).forEach(([key, value]) => {
             if (value !== undefined) {
                if (key === 'priceDetails' && typeof value === 'object' && value !== null) {
                    const cleanPriceDetails: { [key: string]: any } = {};
                    Object.entries(value).forEach(([pdKey, pdValue]) => {
                        if (pdValue !== undefined) {
                            cleanPriceDetails[pdKey] = pdValue;
                        }
                    });
                    if(Object.keys(cleanPriceDetails).length > 0 && cleanPriceDetails.price !== undefined) {
                      updateData[key] = cleanPriceDetails;
                    }
                } else if (key === 'spotQuantity' && value) {
                    updateData[key] = Number(value);
                } else if (value !== '' && value !== null) {
                    updateData[key] = value;
                }
            }
        });
        
        // Handle case where bidFrequency might be null or empty
        if (updateData.priceType !== 'bid') {
            updateData.bidFrequency = null; // or delete updateData.bidFrequency;
            updateData.lastBidPrice = null;
            updateData.winningBidPrice = null;
        }

        if (updateData.priceType !== 'spot') {
            updateData.spotFrequency = null;
            updateData.spotQuantity = null;
        }


        const accountProductRef = doc(firestore, 'account-products', id);
        await updateDoc(accountProductRef, updateData);

        toast({ title: 'Success!', description: 'Product details updated successfully.' });
        onSuccess();
    } catch (error: any) {
        console.error("Error updating product details:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `account-products/${values.id}`,
            operation: 'update',
            requestResourceData: values,
        }));
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "Could not update product details."
        });
    } finally {
        setIsSubmitting(false);
    }
  };

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
            name="priceType"
            render={({ field }) => (
            <FormItem className="space-y-3">
                <FormLabel>Pricing Type</FormLabel>
                <FormControl>
                <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                    {...field}
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

        {priceTypeValue === 'spot' && (
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
                            {...field}
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
                                <Input type="number" placeholder="e.g. 1.23" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
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
        )}
        
        {priceTypeValue === 'bid' && (
            <div className="space-y-4 rounded-md border p-4">
                <FormField
                    control={form.control}
                    name="bidFrequency"
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
                            <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                      control={form.control}
                      name="lastBidPrice"
                      render={({ field }) => (
                          <FormItem className="col-span-2">
                              <FormLabel>Last Bid Price</FormLabel>
                              <FormControl>
                                  <Input type="number" placeholder="e.g. 1.23" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
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
                 <FormField
                    control={form.control}
                    name="winningBidPrice"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Winning Bid Price</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g. 1.23" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        )}
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., 'Quarterly order of 5,000 gallons. Consistent usage.'" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex gap-2">
          <SubmitButton isSubmitting={isSubmitting} />
          <DeleteAccountProduct accountProductId={accountProduct.id!} onSuccess={onSuccess} />
        </div>
      </form>
    </Form>
  );
}
