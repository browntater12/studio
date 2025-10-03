import { type Account } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { SalesInsights } from './sales-insights';

export function AccountHeader({ account }: { account: Account }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{account.name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-muted-foreground">{account.accountNumber}</p>
          <Badge variant={account.status === 'customer' ? 'default' : 'secondary'} className="capitalize">
            {account.status}
          </Badge>
        </div>
      </div>
      <div className="flex gap-2">
        <SalesInsights accountId={account.id} />
      </div>
    </div>
  );
}
