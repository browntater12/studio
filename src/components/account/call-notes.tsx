
'use client';

import * as React from 'react';
import { PlusCircle, Edit, MessageSquare, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { type CallNote, type CallNoteType } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CallNoteForm } from '../forms/call-note-form';

function AddNoteDialog({ accountId }: { accountId: string }) {
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
          <DialogTitle>Add New Call Note</DialogTitle>
        </DialogHeader>
        <CallNoteForm accountId={accountId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditNoteDialog({ note, children }: { note: CallNote, children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Call Note</DialogTitle>
                </DialogHeader>
                <CallNoteForm note={note} accountId={note.accountId} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

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


export function CallNotes({
  accountId,
  notes,
}: {
  accountId: string;
  notes: CallNote[];
}) {
  const sortedNotes = [...notes].sort((a, b) => b.callDate.toMillis() - a.callDate.toMillis());

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <span>Call Notes</span>
          </CardTitle>
        </div>
        <AddNoteDialog accountId={accountId} />
      </CardHeader>
      <CardContent>
        {sortedNotes.length > 0 ? (
          <div className="space-y-4">
            {sortedNotes.map(note => (
              <div
                key={note.id}
                className="flex items-start gap-4 p-4 border rounded-lg relative group"
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
                <EditNoteDialog note={note}>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100">
                        <Edit className="h-4 w-4" />
                    </Button>
                </EditNoteDialog>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No call notes added yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
