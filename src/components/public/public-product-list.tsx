
'use client';

import * as React from 'react';
import { Package, DollarSign } from 'lucide-react';
import { type AccountProduct, type Product } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '../ui/badge';

export function PublicProductList({
  accountProducts,
  allProducts,
}: {
  accountProducts: AccountProduct[];
  allProducts: Product[];
}) {
    const getProductDetails = (productId: string) => {
        return allProducts.find(p => p.id === productId);
    }

  return (
    <Card>
      <CardHeader>
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <span>Products</span>
          </CardTitle>
          <CardDescription>
            Products associated with this account.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {accountProducts.length > 0 ? (
          <div className="space-y-4">
            {accountProducts.map(ap => {
                const product = getProductDetails(ap.productId!);
                return (
                    <div key={ap.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold">{product?.name || 'Unknown Product'}</span>
                                    {product && <Badge variant="secondary">{product.productCode}</Badge>}
                                    {ap.type && <Badge variant={ap.type === 'opportunity' ? 'warning' : 'default'} className="capitalize">{ap.type}</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{ap.notes}</p>
                            </div>

                            <div className="flex items-center gap-4 ml-4">
                                {ap.price && (
                                    <div className="flex items-center font-semibold">
                                        <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                                        <span>{ap.price.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No products added yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
