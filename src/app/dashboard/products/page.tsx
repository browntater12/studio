import { getProducts } from '@/lib/data';
import { ProductTable } from '@/components/products/product-table';

export default async function ProductsPage() {
    const products = await getProducts();

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <ProductTable products={products} />
        </div>
    );
}
