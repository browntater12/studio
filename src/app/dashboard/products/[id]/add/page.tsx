'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useParams, useRouter, notFound } from 'next/navigation';

import { subProductSchema } from '@/lib/schema';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type Product } from '@/lib/types';
import { doc } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function AddSubProductForm({ baseProductId, baseProductName }: { baseProductId: string, baseProductName: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof subProductSchema>>({
    resolver: zodResolver(subProductSchema),
    defaultValues: {
      baseProductId: baseProductId,
      name: '',
      description: '',
      productCode: '',
      size: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof subProductSchema>) => {
    setIsSubmitting(true);
    if (!firestore) {
      toast({
        title: 'Error',
        description: 'Database connection is not available.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const subProductsCollection = collection(firestore, 'products', baseProductId, 'sub-products');
      await addDoc(subProductsCollection, values);
      toast({
        title: 'Success!',
        description: `New product variation added to ${baseProductName}.`,
      });
      router.push(`/dashboard/products/${baseProductId}`);
    } catch (error: any) {
      console.error('Error adding sub-product:', error);
      toast({
        title: 'Error',
        description: 'Failed to add product variation.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Industrial Grade 93%" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="productCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Code</FormLabel>
              <FormControl>
                <Input placeholder="e.g., SA-93-55G" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Size</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bags">Bags</SelectItem>
                  <SelectItem value="pails">Pails</SelectItem>
                  <SelectItem value="drums">Drums</SelectItem>
                  <SelectItem value="totes">Totes</SelectItem>
                  <SelectItem value="bulk">Bulk</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Specific details about this product variation..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Add Product Variation
        </Button>
      </form>
    </Form>
  );
}

export default function AddSubProductPage() {
    const params = useParams();
    const productId = params.id as string;
    const firestore = useFirestore();
  
    const productRef = useMemoFirebase(() => {
      if (!firestore || !productId) return null;
      return doc(firestore, 'products', productId);
    }, [firestore, productId]);
    const { data: product, isLoading: productLoading } = useDoc<Product>(productRef);
  
    if (productLoading) {
      return (
        <div className="flex justify-center items-start pt-8">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      );
    }
  
    if (!product) {
      return notFound();
    }
  
    return (
      <div className="flex justify-center items-start pt-8">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Add Product to {product.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <AddSubProductForm baseProductId={productId} baseProductName={product.name} />
          </CardContent>
        </Card>
      </div>
    );
  }
