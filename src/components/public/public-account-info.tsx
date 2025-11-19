
import { type Account } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, MapPin } from 'lucide-react';

export function PublicAccountInfo({ account }: { account: Account }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <span>Account</span>
        </CardTitle>
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
