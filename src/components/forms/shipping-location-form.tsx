
'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { type ShippingLocation, type Account } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, query } from 'firebase/firestore';

import { shippingLocationSchema } from '@/lib/schema';
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
import { useToast } from '@/hooks/use-toast';
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '../ui/command';
import { cn } from '@/lib/utils';

function DeleteLocationButton({ locationId, onSuccess }: { locationId: string; onSuccess: () => void; }) {
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const firestore = useFirestore();

    const handleDelete = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database service not available.' });
            return;
        }
        setIsDeleting(true);
        const locationRef = doc(firestore, 'shipping-locations', locationId);
        
        try {
            await deleteDoc(locationRef);
            toast({ title: 'Success!', description: 'Location deleted successfully.' });
            onSuccess();
            setOpen(false);
        } catch (error) {
            console.error("Error deleting location:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: locationRef.path,
                operation: 'delete',
            }));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
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
                        This action cannot be undone. This will permanently delete this location.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function SubmitButton({ isEditMode, isSubmitting }: { isEditMode: boolean; isSubmitting: boolean }) {
  return (
    <Button type="submit" disabled={isSubmitting} className="flex-1">
      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isEditMode ? 'Save Changes' : 'Add Location'}
    </Button>
  );
}

type ShippingLocationFormProps = {
  accountId: string;
  location?: ShippingLocation;
  onSuccess: () => void;
};

export function ShippingLocationForm({ accountId, location, onSuccess }: ShippingLocationFormProps) {
  const isEditMode = !!location;
  type SchemaType = z.infer<typeof shippingLocationSchema>;
  
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  const form = useForm<SchemaType>({
    resolver: zodResolver(shippingLocationSchema),
    defaultValues: isEditMode
      ? { ...location }
      : {
          accountId: '', // Default to empty, will be set by form logic
          name: '',
          address: '',
          formType: 'other',
        },
  });

  const accountsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'accounts-db'));
  }, [firestore]);
  const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);
  
  const onSubmit = async (values: SchemaType) => {
    setIsSubmitting(true);
    try {
        if (!firestore) {
            throw new Error("Firestore is not initialized");
        }

        const locationData = {
          name: values.name,
          address: values.address,
          accountId: values.accountId,
        }

        if (isEditMode && location) {
            const locationRef = doc(firestore, 'shipping-locations', location.id);
            await updateDoc(locationRef, locationData);
            toast({ title: 'Success!', description: 'Location updated successfully.' });
        } else {
            const locationsCol = collection(firestore, 'shipping-locations');
            await addDoc(locationsCol, locationData);
            toast({ title: 'Success!', description: 'Location added successfully.' });
        }
        
        onSuccess();
    } catch (error: any) {
        console.error("Shipping location form error:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'An unexpected error occurred.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const formType = useWatch({
    control: form.control,
    name: 'formType',
  })

  React.useEffect(() => {
    if (formType === 'new') {
        form.setValue('accountId', accountId);
    } else {
        // If switching back to 'other', clear the accountId unless it's edit mode
        if (!isEditMode) {
            form.setValue('accountId', '');
        }
    }
  }, [formType, accountId, form, isEditMode]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {!isEditMode && (
             <FormField
                control={form.control}
                name="formType"
                render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel>Location for...</FormLabel>
                    <FormControl>
                    <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                    >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                                <RadioGroupItem value="other" />
                            </FormControl>
                            <FormLabel className="font-normal">Other Account</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                                <RadioGroupItem value="new" />
                            </FormControl>
                            <FormLabel className="font-normal">New Location</FormLabel>
                        </FormItem>
                    </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}
        
        {(formType === 'other' || isEditMode) && (
             <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Account</FormLabel>
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
                                disabled={accountsLoading}
                            >
                            {field.value
                                ? accounts?.find(
                                    (account) => account.id === field.value
                                )?.name
                                : "Select an account"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder="Search accounts..." />
                            <CommandList>
                            <CommandEmpty>No accounts found.</CommandEmpty>
                            <CommandGroup>
                                {accounts?.map((account) => (
                                <CommandItem
                                    value={account.name}
                                    key={account.id}
                                    onSelect={() => {
                                        form.setValue("accountId", account.id);
                                        setPopoverOpen(false);
                                    }}
                                >
                                    <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        account.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                    />
                                    {account.name}
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
        )}


        {(formType === 'new' || isEditMode) && (
            <>
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Main Warehouse" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full Address</FormLabel>
                    <FormControl><Textarea placeholder="123 Industrial Dr, Suite 100&#10;Anytown, ST 12345" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </>
        )}
        
        <div className="flex gap-2">
            <SubmitButton isEditMode={isEditMode} isSubmitting={isSubmitting} />
            {isEditMode && location && <DeleteLocationButton locationId={location.id} onSuccess={onSuccess} />}
        </div>
      </form>
    </Form>
  );
}
