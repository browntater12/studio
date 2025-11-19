
'use client';

import * as React from 'react';
import { PlusCircle, Truck, Edit, MapPin, Building2 } from 'lucide-react';
import { type ShippingLocation } from '@/lib/types';
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
          <DialogTitle>Add New Location</DialogTitle>
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
                    <DialogTitle>Edit Location</DialogTitle>
                </DialogHeader>
                <ShippingLocationForm location={location} accountId={location.accountId} onSuccess={() => setOpen(false)} />
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
            {locations.map(location => (
              <div
                key={location.id}
                className="flex items-start gap-4 p-4 border rounded-lg relative group"
              >
                <div className="flex-1">
                  <p className="font-semibold">{location.name}</p>
                  <div className="text-sm text-muted-foreground flex items-start gap-2 mt-1">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{location.address}</span>
                  </div>
                </div>
                <EditLocationDialog location={location}>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100">
                        <Edit className="h-4 w-4" />
                    </Button>
                </EditLocationDialog>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No locations added yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
