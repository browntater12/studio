
'use client';

import * as React from 'react';
import Link from 'next/link';
import { PlusCircle, Truck, Edit, MapPin, Building2 } from 'lucide-react';
import { type ShippingLocation, type Account } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ShippingLocationForm } from '../forms/shipping-location-form';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

function AddLocationDialog({ accountId }: { accountId: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <PlusCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Related Account</DialogTitle>
        </DialogHeader>
        <ShippingLocationForm accountId={accountId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditLocationDialog({ location, children }: { location: ShippingLocation, children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Related Account</DialogTitle>
                </DialogHeader>
                <ShippingLocationForm location={location} accountId={location.originalAccountId} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

export function ShippingLocations({
  accountId,
  locations,
}: {
  accountId: string;
  locations: ShippingLocation[];
}) {

    const firestore = useFirestore();

    const accountsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'accounts-db');
    }, [firestore]);

    const { data: allAccounts, isLoading } = useCollection<Account>(accountsQuery);

    const getRelatedAccount = (relatedId: string) => {
        return allAccounts?.find(acc => acc.id === relatedId);
    }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <span>Related Accounts</span>
          </CardTitle>
        </div>
        <AddLocationDialog accountId={accountId} />
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
                        className="flex items-start gap-4 p-4 border rounded-lg relative group"
                    >
                        <div className="flex-1">
                        <Link href={`/dashboard/account/${relatedAccount.id}`} className="font-semibold hover:underline">{relatedAccount.name}</Link>
                        <div className="text-sm text-muted-foreground flex items-start gap-2 mt-1">
                            <span>{relatedAccount.accountNumber}</span>
                        </div>
                        </div>
                        <EditLocationDialog location={location}>
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </EditLocationDialog>
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
