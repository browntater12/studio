import { type Account } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export function AccountInfo({ account }: { account: Account }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <span>Account Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
            <p className="font-medium">Industry</p>
            <p className="text-muted-foreground">{account.industry}</p>
        </div>
        <div className="text-sm">
            <p className="font-medium">Details</p>
            <p className="text-muted-foreground whitespace-pre-wrap">{account.details || 'No details provided.'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
