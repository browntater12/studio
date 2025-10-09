'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Mic, MicOff, PhoneCall } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';

import { addCallNoteSchema } from '@/lib/schema';
import { type Contact } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
  } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { dictateNote } from '@/ai/flows/dictate-note';
import { Badge } from '../ui/badge';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const toBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result as string;
            resolve(base64data.split(',')[1]);
        };
        reader.onerror = (error) => {
            reject(error);
        };
    });
};


export function AddCallNoteDialog({ accountId, contacts }: { accountId: string; contacts: Contact[] }) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const [isRecording, setIsRecording] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);

  const form = useForm<z.infer<typeof addCallNoteSchema>>({
    resolver: zodResolver(addCallNoteSchema),
    defaultValues: {
      accountId,
      callDate: new Date(),
      notes: '',
      contactIds: [],
    },
  });

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = async (event) => {
            if (event.data.size > 0) {
                const audioBlob = new Blob([event.data], { type: 'audio/webm' });
                const base64Audio = await toBase64(audioBlob);

                try {
                    const result = await dictateNote({ audio: base64Audio, mimeType: 'audio/webm' });
                    const currentNotes = form.getValues('notes');
                    form.setValue('notes', (currentNotes ? currentNotes + ' ' : '') + result.text);
                } catch (error) {
                    console.error('Dictation error:', error);
                    toast({
                        variant: 'destructive',
                        title: 'Dictation Error',
                        description: 'Failed to transcribe audio.',
                    });
                }
            }
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Error starting recording:", err);
        toast({
            variant: "destructive",
            title: "Microphone Error",
            description: "Could not access microphone. Please check permissions."
        })
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
       // Stop the tracks to turn off the microphone indicator
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const onSubmit = (values: z.infer<typeof addCallNoteSchema>) => {
    setIsSubmitting(true);
    if (!firestore) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Firestore is not initialized. Please try again.',
        });
        setIsSubmitting(false);
        return;
    }

    const callNotesCollection = collection(firestore, 'call-notes');
    
    addDoc(callNotesCollection, values)
        .then(() => {
            toast({ title: "Success", description: "Call note saved." });
            form.reset({ accountId, callDate: new Date(), notes: '', contactIds: [] });
            setOpen(false);
        })
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: callNotesCollection.path,
                operation: 'create',
                requestResourceData: values,
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsSubmitting(false);
        });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PhoneCall className="mr-2 h-4 w-4" />
          Add Call Notes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Call Note</DialogTitle>
          <DialogDescription>
            Log the details of a recent call with a customer.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="callDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Call Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "pl-3 text-left font-normal",
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
                        name="contactIds"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Contacts on Call</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                            "justify-between h-auto min-h-10",
                                            !field.value?.length && "text-muted-foreground"
                                        )}
                                        >
                                        <div className="flex flex-wrap gap-1">
                                        {field.value?.length > 0 ? (
                                            field.value.map(id => {
                                                const contact = contacts.find(c => c.id === id);
                                                return <Badge key={id} variant="secondary">{contact?.name || 'Unknown'}</Badge>
                                            })
                                        ) : "Select contacts"}
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search contacts..." />
                                        <CommandList>
                                        <CommandEmpty>No contacts found.</CommandEmpty>
                                        <CommandGroup>
                                            {contacts.map((contact) => (
                                            <CommandItem
                                                value={contact.name}
                                                key={contact.id}
                                                onSelect={() => {
                                                    const currentIds = field.value || [];
                                                    const newIds = currentIds.includes(contact.id)
                                                        ? currentIds.filter(id => id !== contact.id)
                                                        : [...currentIds, contact.id];
                                                    field.onChange(newIds);
                                                }}
                                            >
                                                <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    field.value?.includes(contact.id)
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                                />
                                                {contact.name}
                                            </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        </CommandList>
                                    </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Call Notes</FormLabel>
                            <div className="relative">
                                <FormControl>
                                    <Textarea
                                        placeholder="Start typing or use the mic to dictate notes..."
                                        className="min-h-[200px] pr-10"
                                        {...field}
                                    />
                                </FormControl>
                                <Button 
                                    type="button" 
                                    variant={isRecording ? 'destructive' : 'ghost'} 
                                    size="icon" 
                                    className="absolute top-2 right-2 h-7 w-7"
                                    onClick={isRecording ? stopRecording : startRecording}
                                >
                                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                    <span className="sr-only">{isRecording ? 'Stop dictation' : 'Start dictation'}</span>
                                </Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Note
                </Button>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
