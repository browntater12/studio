
'use client';

import * as React from 'react';
import { MessageSquare, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { type CallNote, type CallNoteType } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '../ui/scroll-area';

function getBadgeVariant(type: CallNoteType) {
    switch (type) {
        case 'initial-meeting':
            return 'key-account';
        case 'phone-call':
            return 'default';
        case 'in-person':
            return 'secondary';
        case 'note':
            return 'outline';
        default:
            return 'outline';
    }
}

function formatNoteType(type: CallNoteType) {
    return type.replace('-', ' ');
}

export function PublicCallNotes({
  notes,
}: {
  notes: CallNote[];
}) {
  const sortedNotes = [...notes].sort((a, b) => b.callDate.toMillis() - a.callDate.toMillis());

  return (
    <Card>
      <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <span>Call Notes</span>
          </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedNotes.length > 0 ? (
          <ScrollArea className="h-72">
            <div className="space-y-4 pr-4">
                {sortedNotes.map(note => (
                <div
                    key={note.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                >
                    <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{format(note.callDate.toDate(), 'PPP')}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant={getBadgeVariant(note.type)} className="capitalize">
                        {formatNoteType(note.type)}
                        </Badge>
                    </div>
                    <p className="mt-2 text-sm whitespace-pre-wrap">{note.note}</p>
                    </div>
                </div>
                ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No call notes added yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
