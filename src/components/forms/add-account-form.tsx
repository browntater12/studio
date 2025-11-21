
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
import { useState, useEffect } from "react"
import { useFirestore, useDoc, useUser, useMemoFirebase } from "@/firebase"
import { collection, addDoc, doc, updateDoc, query, where, getDocs } from "firebase/firestore"
import { FirestorePermissionError } from "@/firebase/errors"
import { errorEmitter } from "@/firebase/error-emitter"
import { type Account, type UserProfile } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const industryOptions = [
    'Adhesives',
    'Agriculture',
    'Alcohol',
    'Animal Butchering',
    'Animal By-Products',
    'Chemical Services',
    'Cooling',
    'Cooperative',
    'Energy',
    'Ethanol',
    'Food',
    'Manufacturing',
    'Mechanical Contractor',
    'Mining & Wells',
    'Municipal',
    'Oil and Gas',
    'Pharmaceuticals',
    'Plating and Coating',
    'Soybean Processing',
    'Stone and Concrete',
    'Water Treatment',
  ];

export function AddAccountForm({ account }: { account?: Account}) {
    const { toast } = useToast()
    const router = useRouter()
    const [ isSubmitting, setIsSubmitting ] = useState(false)
    const { user } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const form = useForm<z.infer<typeof addAccountSchema>>({
    resolver: zodResolver(addAccountSchema),
    defaultValues: account ? {
        ...account
    } : {
        name: "",
        accountNumber: "",
        industry: "",
        status: "lead",
        address: "",
        details: "",
        companyId: "",
    },
  })

  useEffect(() => {
    if (userProfile && !form.getValues('companyId')) {
      form.setValue('companyId', userProfile.companyId);
    }
    if (account) {
        form.reset(account);
    }
  }, [userProfile, form, account]);
 
  async function onSubmit(values: z.infer<typeof addAccountSchema>) {
    if (!firestore) {
        toast({
            title: 'Error',
            description: 'Database not available.',
            variant: 'destructive'
        });
        return;
    }
    if (!userProfile) {
        toast({
            title: 'Error',
            description: 'User profile not loaded. Please wait and try again.',
            variant: 'destructive'
        });
        return;
    }
    const companyId = userProfile.companyId;
    if (!companyId) {
        toast({
            title: 'Error',
            description: 'Company information is not available. Cannot save account.',
            variant: 'destructive'
        });
        return;
    }
    
    setIsSubmitting(true);
    
    // Ensure companyId is set in the values to be submitted
    const valuesWithCompanyId = { ...values, companyId };
    
    try {
        const accountsCollection = collection(firestore, 'accounts-db');
        if (account) {
            const accountRef = doc(firestore, 'accounts-db', account.id);
            updateDoc(accountRef, valuesWithCompanyId);
            toast({
                title: 'Account Updated',
                description: 'The account has been updated successfully.',
            });
            router.push(`/dashboard/account/${account.id}`);
        } else {
            // Check for unique account number on creation
            if (values.accountNumber) {
                const q = query(accountsCollection, where("accountNumber", "==", values.accountNumber), where("companyId", "==", companyId));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    form.setError("accountNumber", {
                        type: "manual",
                        message: "This account number is already in use within your company.",
                    });
                    setIsSubmitting(false);
                    return;
                }
            }
            
            const docRef = await addDoc(accountsCollection, valuesWithCompanyId);
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
            requestResourceData: valuesWithCompanyId
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        if (form.formState.isValid) { // Only set submitting to false if we don't have a manual error
            setIsSubmitting(false);
        }
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
                        <SelectItem value="supplier">Supplier</SelectItem>
                    </SelectContent>
                </Select>
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
                <Input placeholder="1148" {...field} value={field.value || ''} />
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
                  {industryOptions.sort().map(option => (
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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St, Anytown USA" {...field} value={field.value || ''} />
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
                        <Textarea placeholder="Garratt Callahan utilizes our Omaha facility..." {...field} value={field.value || ''} />
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
