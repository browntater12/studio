'use client';

import { format } from 'date-fns';
import { Phone, Users } from 'lucide-react';
import { type CallNote, type Contact } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export function CallNotesList({ callNotes, contacts }: { callNotes: CallNote[]; contacts: Contact[] }) {

  const getContactById = (id: string) => contacts.find(c => c.id === id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            <span>Call History</span>
        </CardTitle>
        <CardDescription>A log of past calls and meetings.</CardDescription>
      </CardHeader>
      <CardContent>
        {callNotes.length > 0 ? (
          <div className="space-y-4">
            {callNotes.map(note => (
              <div key={note.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">
                        {format(new Date(note.callDate.seconds * 1000), 'PPP')}
                    </p>
                    {note.contactIds && note.contactIds.length > 0 && (
                       <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div className="flex -space-x-2 overflow-hidden">
                                <TooltipProvider>
                                {note.contactIds.map(id => {
                                    const contact = getContactById(id);
                                    if (!contact) return null;
                                    return (
                                        <Tooltip key={id}>
                                            <TooltipTrigger asChild>
                                                <Avatar className="h-6 w-6 border-2 border-background">
                                                    <AvatarImage src={contact.avatarUrl} alt={contact.name} />
                                                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{contact.name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )
                                })}
                                </TooltipProvider>
                            </div>
                       </div>
                    )}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.notes}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No call notes have been added yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
