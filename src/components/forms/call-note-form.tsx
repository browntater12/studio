
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { type CallNote } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

import { cn } from '@/lib/utils';
import { callNoteSchema } from '@/lib/schema';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

function DeleteNoteButton({ noteId, onSuccess }: { noteId: string; onSuccess: () => void; }) {
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const firestore = useFirestore();

    const handleDelete = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database service not available.' });
            return;
        }
        setIsDeleting(true);
        const noteRef = doc(firestore, 'call-notes', noteId);
        
        try {
            await deleteDoc(noteRef);
            toast({ title: 'Success!', description: 'Note deleted successfully.' });
            onSuccess();
            setOpen(false);
        } catch (error) {
            console.error("Error deleting note:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: noteRef.path,
                operation: 'delete',
            }));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this call note.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function SubmitButton({ isEditMode, isSubmitting }: { isEditMode: boolean; isSubmitting: boolean }) {
  return (
    <Button type="submit" disabled={isSubmitting} className="flex-1">
      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isEditMode ? 'Save Changes' : 'Add Note'}
    </Button>
  );
}

type CallNoteFormProps = {
  accountId: string;
  note?: CallNote;
  onSuccess: () => void;
};

export function CallNoteForm({ accountId, note, onSuccess }: CallNoteFormProps) {
  const isEditMode = !!note;
  type SchemaType = z.infer<typeof callNoteSchema>;
  
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SchemaType>({
    resolver: zodResolver(callNoteSchema),
    defaultValues: isEditMode
      ? { ...note, callDate: note.callDate.toDate() }
      : {
          accountId,
          note: '',
          callDate: new Date(),
          type: 'note',
        },
  });
  
  const onSubmit = async (values: SchemaType) => {
    setIsSubmitting(true);
    try {
        if (!firestore) {
            throw new Error("Firestore is not initialized");
        }

        const noteData = {
          accountId: values.accountId,
          note: values.note,
          callDate: values.callDate,
          type: values.type,
        };

        if (isEditMode && note) {
            const noteRef = doc(firestore, 'call-notes', note.id);
            await updateDoc(noteRef, noteData);
            toast({ title: 'Success!', description: 'Note updated successfully.' });
        } else {
            const notesCol = collection(firestore, 'call-notes');
            await addDoc(notesCol, noteData);
            toast({ title: 'Success!', description: 'Note added successfully.' });
        }
        
        onSuccess();
    } catch (error: any) {
        console.error("Call note form error:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'An unexpected error occurred.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an interaction type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="phone-call">Phone Call</SelectItem>
                  <SelectItem value="in-person">In Person</SelectItem>
                  <SelectItem value="initial-meeting">Initial Meeting</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="callDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea placeholder="Discussed Q3 pricing and upcoming projects..." {...field} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex gap-2">
            <SubmitButton isEditMode={isEditMode} isSubmitting={isSubmitting} />
            {isEditMode && note && <DeleteNoteButton noteId={note.id} onSuccess={onSuccess} />}
        </div>
      </form>
    </Form>
  );
}
