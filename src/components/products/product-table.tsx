'use client';

import * as React from 'react';
import { PlusCircle, Search, Edit } from 'lucide-react';
import { type Product } from '@/lib/types';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '../ui/card';
import { CreateProductForm } from '../forms/create-product-form';

function CreateProductDialog() {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Base Product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Base Product</DialogTitle>
        </DialogHeader>
        <CreateProductForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditProductDialog({ product, children }: { product: Product, children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                </DialogHeader>
                <CreateProductForm product={product} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

export function ProductTable({ products }: { products: Product[] }) {
  const [search, setSearch] = React.useState('');

  const filteredProducts = products.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.productNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filter products..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8"
                />
                </div>
                <CreateProductDialog />
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Product Number</TableHead>
                    <TableHead>Volumes</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredProducts.map(product => (
                    <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.productNumber}</TableCell>
                    <TableCell>
                        <div className="flex flex-wrap gap-2">
                        {product.volumes.map(v => (
                            <Badge key={v} variant="secondary" className="capitalize">
                            {v}
                            </Badge>
                        ))}
                        </div>
                    </TableCell>
                    <TableCell>
                        <EditProductDialog product={product}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </EditProductDialog>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    No products found.
                </div>
            )}
        </CardContent>
    </Card>
  );
}
