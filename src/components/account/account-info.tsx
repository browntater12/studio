import Link from 'next/link';
import { type Account } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Edit } from 'lucide-react';

export function AccountInfo({ account }: { account: Account }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <span>Account</span>
        </CardTitle>
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/account/${account.id}/edit`}>
            <Edit className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
            <p className="font-medium">Industry</p>
            <p className="text-muted-foreground">{account.industry || 'N/A'}</p>
        </div>
        {account.address && (
          <div className="text-sm">
            <p className="font-medium">Address</p>
            <p className="text-muted-foreground flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{account.address}</span>
            </p>
          </div>
        )}
        <div className="text-sm">
            <p className="font-medium">Details</p>
            <p className="text-muted-foreground whitespace-pre-wrap">{account.details || 'No details provided.'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
