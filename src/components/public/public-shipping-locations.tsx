
'use client';

import * as React from 'react';
import { Building2 } from 'lucide-react';
import { type ShippingLocation, type Account } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function PublicShippingLocations({
  locations,
  allAccounts,
}: {
  locations: ShippingLocation[];
  allAccounts: Account[];
}) {
    const getRelatedAccount = (relatedId: string) => {
        return allAccounts?.find(acc => acc.id === relatedId);
    }

  return (
    <Card>
      <CardHeader>
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <span>Related Accounts</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {locations.length > 0 ? (
          <div className="space-y-4">
            {locations.map(location => {
                const relatedAccount = getRelatedAccount(location.relatedAccountId);
                if (!relatedAccount) return null;

                return (
                    <div
                        key={location.id}
                        className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                        <div className="flex-1">
                            <p className="font-semibold">{relatedAccount.name}</p>
                            <div className="text-sm text-muted-foreground flex items-start gap-2 mt-1">
                                <span>{relatedAccount.accountNumber}</span>
                            </div>
                        </div>
                    </div>
                )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No related accounts added yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
