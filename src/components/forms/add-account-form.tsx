'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { addAccountSchema } from "@/lib/schema"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useFirestore } from "@/firebase"
import { collection, addDoc, doc, updateDoc } from "firebase/firestore"
import { FirestorePermissionError } from "@/firebase/errors"
import { errorEmitter } from "@/firebase/error-emitter"
import { type Account } from '@/lib/types';


export function AddAccountForm({ account }: { account?: Account}) {
    const { toast } = useToast()
    const router = useRouter()
    const [ isSubmitting, setIsSubmitting ] = useState(false)

    const firestore = useFirestore();


  const form = useForm<z.infer<typeof addAccountSchema>>({
    resolver: zodResolver(addAccountSchema),
    defaultValues: account ? {
        name: account.name,
        details: account.details,
        industry: account.industry,
        status: account.status,
        address: account.address,
    } : {
        name: "",
        details: "",
        industry: "",
        status: "lead",
        address: "",
    },
  })
 
  async function onSubmit(values: z.infer<typeof addAccountSchema>) {
    if (!firestore) {
        toast({
            title: 'Error',
            description: 'Database not available.',
            variant: 'destructive'
        });
        return;
    }
    
    setIsSubmitting(true);
    
    try {
        if (account) {
            const accountRef = doc(firestore, 'accounts-db', account.id);
            await updateDoc(accountRef, values);
            toast({
                title: 'Account Updated',
                description: 'The account has been updated successfully.',
            });
            router.push(`/dashboard/account/${account.id}`);
        } else {
            const accountsCollection = collection(firestore, 'accounts-db');
            const docRef = await addDoc(accountsCollection, values);
            toast({
                title: 'Account Created',
                description: 'The new account has been added successfully.',
            });
            router.push(`/dashboard/account/${docRef.id}`);
        }
    } catch(error) {
        const collectionPath = account ? `accounts-db/${account.id}` : 'accounts-db';
        const operation = account ? 'update' : 'create';
        
        console.error(`Original Firebase Error on ${operation}:`, error);
        
        const permissionError = new FirestorePermissionError({
            path: collectionPath,
            operation: operation,
            requestResourceData: values
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Inc." {...field} />
              </FormControl>
              <FormDescription>
                The name of the account.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="details"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Details</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Company details..." {...field} />
                    </FormControl>
                    <FormDescription>
                        Any details about the account.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : (account ? 'Save Changes' : 'Submit')}
        </Button>
      </form>
    </Form>
  )
}
