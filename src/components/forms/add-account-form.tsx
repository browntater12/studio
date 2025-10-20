'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from 'lucide-react';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const industryOptions = [
    'Pharmaceuticals',
    'Mechanical Contractor',
    'Plating and Coating',
    'Agriculture',
    'Animal Butchering',
    'Oil and Gas',
    'Soybean Processing',
    'Ethanol',
    'Cooling',
    'Adhesives',
    'Animal By-Products',
    'Manufacturing',
    'Mining & Wells',
    'Alcohol',
    'Chemical Services',
    'Water Treatment',
    'Municipal',
  ];

export function AddAccountForm({ account }: { account?: Account}) {
    const { toast } = useToast()
    const router = useRouter()
    const [ isSubmitting, setIsSubmitting ] = useState(false)

    const firestore = useFirestore();


  const form = useForm<z.infer<typeof addAccountSchema>>({
    resolver: zodResolver(addAccountSchema),
    defaultValues: account ? {
        name: account.name,
        accountNumber: account.accountNumber,
        industry: account.industry,
        status: account.status,
        address: account.address,
        details: account.details,
    } : {
        name: "",
        accountNumber: "",
        industry: "",
        status: "lead",
        address: "",
        details: "",
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
            updateDoc(accountRef, values);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input placeholder="Garratt Callahan Co" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Number</FormLabel>
              <FormControl>
                <Input placeholder="1148" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industry</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an industry" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {industryOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="key-account">Key Account</SelectItem>
                    </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St, Anytown USA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="details"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Account Details</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Garratt Callahan utilizes our Omaha facility..." {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {account ? 'Save Changes' : 'Add Account'}
        </Button>
      </form>
    </Form>
  )
}
