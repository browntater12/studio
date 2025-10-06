import Link from 'next/link';
import { type Account } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

export function AccountHeader({ account }: { account: Account }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{account.name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-muted-foreground">{account.accountNumber}</p>
          <Badge variant={account.status === 'customer' ? 'default' : 'warning'} className="capitalize">
            {account.status}
          </Badge>
        </div>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/dashboard/products">
            <Package className="mr-2 h-4 w-4" />
            Products
          </Link>
        </Button>
      </div>
    </div>
  );
}
