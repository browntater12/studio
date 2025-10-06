'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';


import { updateProduct, deleteProduct } from '@/app/actions';
import { createProductSchema, editProductSchema } from '@/lib/schema';
import { type Product, type ProductVolume } from '@/lib/types';

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

const initialState = { type: '', message: '', errors: undefined };

const VOLUMES: { id: ProductVolume; label: string }[] = [
  { id: 'pails', label: 'Pails' },
  { id: 'drums', label: 'Drums' },
  { id: 'totes', label: 'Totes' },
  { id: 'bulk', label: 'Bulk' },
];

function SubmitButton({ isEditMode, isSubmitting }: { isEditMode: boolean, isSubmitting: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = isSubmitting || pending;
  return (
    <Button type="submit" disabled={isDisabled} className="flex-1">
      {(isDisabled) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isEditMode ? 'Save Changes' : 'Create Product'}
    </Button>
  );
}

function DeleteProductButton({ productId, onSuccess }: { productId: string, onSuccess: () => void }) {
    const [state, formAction] = useActionState(deleteProduct, initialState);
    const { pending } = useFormStatus();
    const { toast } = useToast();
    const router = useRouter();

    React.useEffect(() => {
        if (state.type === 'success') {
            toast({ title: 'Success!', description: state.message });
            onSuccess();
            router.push('/dashboard/products');
        } else if (state.type === 'error') {
            toast({ title: 'Error', description: state.message, variant: 'destructive' });
        }
    }, [state, onSuccess, toast, router]);

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                 <form action={formAction}>
                    <input type="hidden" name="id" value={productId} />
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product
                            from the global catalog and remove it from all associated accounts.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction type="submit" disabled={pending}>
                             {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                 </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}

type CreateProductFormProps = {
  product?: Product;
  onSuccess: () => void;
};

export function CreateProductForm({ product, onSuccess }: CreateProductFormProps) {
  const isEditMode = !!product;
  const action = isEditMode ? updateProduct : undefined;
  const schema = isEditMode ? editProductSchema : createProductSchema;
  type SchemaType = z.infer<typeof schema>;

  const [editState, formAction] = useActionState(action || (() => Promise.resolve(initialState)), initialState);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode
      ? product
      : {
          name: '',
          productNumber: '',
          volumes: [],
        },
  });

  const watchedVolumes = useWatch({ control: form.control, name: 'volumes' }) || [];

  React.useEffect(() => {
    if (editState.type === 'success') {
      toast({ title: 'Success!', description: editState.message });
      onSuccess();
    } else if (editState.type === 'error') {
      toast({ title: 'Error', description: editState.message, variant: 'destructive' });
      const errors = editState.errors as z.ZodError<SchemaType>['formErrors']['fieldErrors'] | undefined;
      if (errors) {
        Object.keys(errors).forEach((key) => {
            const fieldKey = key as keyof SchemaType;
            if (errors[fieldKey]) {
                form.setError(fieldKey, { type: 'server', message: errors[fieldKey]?.[0] });
            }
        });
      }
    }
  }, [editState, onSuccess, toast, form]);
  
  const onSubmit = async (values: SchemaType) => {
    if (isEditMode) return; // handled by server action

    setIsSubmitting(true);
    try {
      if (!firestore) {
        throw new Error("Firestore is not available");
      }
      
      const productsCollection = collection(firestore, 'products');

      // Check for uniqueness
      const q = query(productsCollection, where("productNumber", "==", values.productNumber));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error("A product with this product number already exists.");
      }
      
      await addDoc(productsCollection, values);
      
      toast({
        title: "Product Created",
        description: "The new product has been added to the catalog.",
      });
      onSuccess();
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create product.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form 
        action={isEditMode ? formAction : undefined}
        onSubmit={!isEditMode ? form.handleSubmit(onSubmit) : undefined}
        className="space-y-4"
      >
        {isEditMode && <input type="hidden" name="id" value={product.id} />}
        {watchedVolumes.map((volume) => (
            <input key={volume} type="hidden" name="volumes" value={volume} />
        ))}
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
        <div className="flex gap-2">
            <SubmitButton isEditMode={isEditMode} isSubmitting={isSubmitting} />
            {isEditMode && product && <DeleteProductButton productId={product.id} onSuccess={onSuccess} />}
        </div>
      </form>
    </Form>
  );
}
