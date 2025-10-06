'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';


import { createProduct, updateProduct, deleteProduct } from '@/app/actions';
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

function SubmitButton({ isEditMode }: { isEditMode: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
  const action = isEditMode ? updateProduct : createProduct;
  const schema = isEditMode ? editProductSchema : createProductSchema;
  type SchemaType = z.infer<typeof schema>;

  const [state, formAction] = useActionState(action, initialState);
  const { toast } = useToast();

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
    if (state.type === 'success') {
      toast({ title: 'Success!', description: state.message });
      onSuccess();
    } else if (state.type === 'error') {
      toast({ title: 'Error', description: state.message, variant: 'destructive' });
      const errors = state.errors as z.ZodError<SchemaType>['formErrors']['fieldErrors'] | undefined;
      if (errors) {
        Object.keys(errors).forEach((key) => {
            const fieldKey = key as keyof SchemaType;
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
            <SubmitButton isEditMode={isEditMode} />
            {isEditMode && product && <DeleteProductButton productId={product.id} onSuccess={onSuccess} />}
        </div>
      </form>
    </Form>
  );
}