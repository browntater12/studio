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
import { useFirestore } from "reactfire"
import { collection, addDoc } from "firebase/firestore"
import { FirestorePermissionError } from "@/firebase/errors"
import { errorEmitter } from "@/firebase/error-emitter"


export function AddAccountForm() {
    const { toast } = useToast()
    const router = useRouter()
    const [ isSubmitting, setIsSubmitting ] = useState(false)

    const firestore = useFirestore();
    const accountsCollection = collection(firestore, 'accounts-db');


  const form = useForm<z.infer<typeof addAccountSchema>>({
    resolver: zodResolver(addAccountSchema),
    defaultValues: {
        name: "",
        details: "",
        contacts: [],
        accountProducts: [],

    },
  })
 
  async function onSubmit(values: z.infer<typeof addAccountSchema>) {
    setIsSubmitting(true);
    if (navigator.onLine) {
        addDoc(accountsCollection, values)
                    .then((docRef) => {
                        toast({
                            title: 'Account Created',
                            description: 'The new account has been added successfully.',
                        });
                        router.push(`/dashboard/account/${docRef.id}`);
                    })
                    .catch(async (error) => {
                        console.error("Original Firebase Error:", error);
                        const permissionError = new FirestorePermissionError({
                            path: accountsCollection.path,
                            operation: 'create',
                            requestResourceData: values
                        });
                        errorEmitter.emit('permission-error', permissionError);
                    })
                    .finally(() => {
                        setIsSubmitting(false);
                    });
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
            {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </Form>
  )
}
