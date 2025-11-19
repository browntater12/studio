
import { type Account } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export function PublicAccountHeader({ account }: { account: Account }) {
  const getBadgeVariant = (status: Account['status']) => {
    switch (status) {
        case 'customer':
            return 'default';
        case 'lead':
            return 'warning';
        case 'key-account':
            return 'key-account';
        case 'supplier':
            return 'supplier';
        default:
            return 'secondary';
    }
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{account.name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-muted-foreground">{account.accountNumber}</p>
          <Badge variant={getBadgeVariant(account.status)} className="capitalize">
            {account.status.replace('-', ' ')}
          </Badge>
        </div>
      </div>
      <div className="flex gap-2">
      </div>
    </div>
  );
}
