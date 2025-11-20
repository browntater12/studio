'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, type User } from 'firebase/auth';

import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { createUserAndCompany } from '@/app/auth-actions';
import { GoogleIcon } from '../icons/google-icon';

const signUpSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

function LoadingOverlay() {
    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
            <div className="bg-background p-8 rounded-lg shadow-xl text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Creating Your Account</h2>
                <p className="text-muted-foreground">Please wait, do not refresh the page.</p>
            </div>
        </div>
    );
}

export function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSignUpCompletion = async (user: User) => {
    const creationResult = await createUserAndCompany({ 
        uid: user.uid, 
        email: user.email!, 
        displayName: user.displayName 
    });

    if (creationResult?.error) {
        throw new Error(creationResult.error);
    }
    
    toast({
        title: "Account Created!",
        description: "You're now being redirected to your dashboard.",
    });
    onSuccess();
    router.push('/dashboard');
  };

  const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
    if (!auth) {
        toast({ variant: "destructive", title: "Sign Up Failed", description: "Authentication service not available." });
        return;
    }
    setIsSubmitting(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        await handleSignUpCompletion(userCredential.user);
    } catch (error: any) {
      console.error("Email/Password Sign Up Error:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
          description = "This email address is already in use. Please sign in or use a different email.";
      } else if (error.message) {
          description = error.message;
      }
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    if (!auth) {
        toast({ variant: "destructive", title: "Sign Up Failed", description: "Authentication service not available." });
        return;
    };
    setIsGoogleSubmitting(true);
    setIsSubmitting(true); // Also trigger the loading overlay for Google sign-in
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await handleSignUpCompletion(result.user);
    } catch(error: any) {
        console.error("Google sign up error:", error);
        let description = "Could not sign up with Google. Please try again.";
        if (error.code === 'auth/account-exists-with-different-credential') {
            description = 'An account already exists with the same email address but different sign-in credentials. Please sign in using the original method.';
        } else if (error.message) {
          description = error.message;
        }
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: description,
        });
    } finally {
        setIsGoogleSubmitting(false);
        setIsSubmitting(false);
    }
  }


  return (
    <>
      {isSubmitting && <LoadingOverlay />}
      <div className="grid gap-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting || isGoogleSubmitting} className="w-full">
              {isSubmitting && !isGoogleSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </Form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        <Button variant="outline" onClick={handleGoogleSignIn} disabled={isSubmitting || isGoogleSubmitting}>
            {isGoogleSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
            Google
        </Button>
      </div>
    </>
  );
}
