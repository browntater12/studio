
'use client';

import * as React from 'react';
import { Users, Mail, Phone, MapPin, Star } from 'lucide-react';
import { type Contact, type Account } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '../ui/badge';

export function PublicContactList({
  account,
  contacts,
}: {
  account: Account;
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
      </CardHeader>
      <CardContent>
        {contacts.length > 0 ? (
          <div className="space-y-4">
            {contacts.map(contact => (
              <div
                key={contact.id}
                className="flex items-start gap-4 p-4 border rounded-lg relative group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{contact.name}</p>
                    {contact.isMainContact && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /> Main
                      </Badge>
                    )}
                  </div>
                  {contact.position && <p className="text-sm text-muted-foreground">{contact.position}</p>}
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
