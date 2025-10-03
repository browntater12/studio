import { getAccountById, getProducts } from '@/lib/data';
import { notFound } from 'next/navigation';
import { AccountHeader } from '@/components/account/account-header';
import { AccountInfo } from '@/components/account/account-info';
import { ContactList } from '@/components/account/contact-list';
import { ProductList } from '@/components/account/product-list';

export default async function AccountPage({ params }: { params: { id: string } }) {
  const account = await getAccountById(params.id);
  const products = await getProducts();

  if (!account) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <AccountHeader account={account} />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <ContactList accountId={account.id} contacts={account.contacts} />
          <ProductList 
            accountId={account.id} 
            accountProducts={account.accountProducts} 
            allProducts={products}
          />
        </div>
        <div className="lg:col-span-1">
          <AccountInfo account={account} />
        </div>
      </div>
    </div>
  );
}
