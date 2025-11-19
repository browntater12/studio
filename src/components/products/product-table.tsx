'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import { Card, CardContent, CardHeader } from '../ui/card';
import { CreateProductForm } from '../forms/create-product-form';

function CreateProductDialog() {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
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

function EditProductDialog({ product, children, onEditClick }: { product: Product, children: React.ReactNode, onEditClick: (e: React.MouseEvent) => void }) {
    const [open, setOpen] = React.useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild onClick={onEditClick}>{children}</DialogTrigger>
            <DialogContent className="max-w-2xl">
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
  const router = useRouter();

  const filteredProducts = products.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.productCode && p.productCode.toLowerCase().includes(search.toLowerCase()))
  );
  
  const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>, productId: string) => {
     if ((e.target as HTMLElement).closest('button')) {
        return;
    }
    router.push(`/dashboard/products/${productId}`);
  };

  return (
    <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filter by name or code..."
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
                    <TableHead>Product Code</TableHead>
                    <TableHead>Attribute 1</TableHead>
                    <TableHead>Attribute 2</TableHead>
                    <TableHead>Attribute 3</TableHead>
                    <TableHead>Attribute 4</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredProducts.map(product => (
                    <TableRow key={product.id} onClick={(e) => handleRowClick(e, product.id)} className="cursor-pointer">
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.productCode}</TableCell>
                        <TableCell>{product.attribute1}</TableCell>
                        <TableCell>{product.attribute2}</TableCell>
                        <TableCell>{product.attribute3}</TableCell>
                        <TableCell>{product.attribute4}</TableCell>
                        <TableCell>
                            <EditProductDialog product={product} onEditClick={(e) => e.stopPropagation()}>
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
