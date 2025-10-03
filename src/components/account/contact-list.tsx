'use client';

import * as React from 'react';
import Image from 'next/image';
import { PlusCircle, Users, Mail, Phone, MapPin, Star } from 'lucide-react';
import { type Contact } from '@/lib/types';
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
import { AddContactForm } from '../forms/add-contact-form';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

function AddContactDialog({ accountId }: { accountId: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>
        <AddContactForm accountId={accountId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function ContactList({
  accountId,
  contacts,
}: {
  accountId: string;
  contacts: Contact[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>Contacts</span>
          </CardTitle>
          <CardDescription>
            Key personnel associated with this account.
          </CardDescription>
        </div>
        <AddContactDialog accountId={accountId} />
      </CardHeader>
      <CardContent>
        {contacts.length > 0 ? (
          <div className="space-y-4">
            {contacts.map(contact => (
              <div
                key={contact.id}
                className="flex items-start gap-4 p-4 border rounded-lg"
              >
                <Avatar className="h-12 w-12">
                   <AvatarImage src={contact.avatarUrl} alt={contact.name} data-ai-hint="person portrait" />
                   <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{contact.name}</p>
                    {contact.isMainContact && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /> Main
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-primary">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{contact.email}</span>
                    </a>
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-primary">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{contact.phone}</span>
                    </a>
                     <div className="flex items-center gap-2 col-span-full">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{contact.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No contacts added yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
