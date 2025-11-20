'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithEmailAndPassword } from 'firebase/auth';

import { useAuth, useUser } from '@/firebase';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons/logo';
import { SignUpForm } from '@/components/forms/sign-up-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  rememberMe: z.boolean().default(false).optional(),
});

function SignUpDialog() {
    const [open, setOpen] = React.useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="link" type="button">Sign up</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create an Account</DialogTitle>
                    <DialogDescription>
                        Get started by creating your own account and company space.
                    </DialogDescription>
                </DialogHeader>
                <SignUpForm onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  React.useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);


  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Authentication service not available.',
        });
        return;
    }
    setIsSubmitting(true);
    try {
        const persistence = values.rememberMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistence);
        await signInWithEmailAndPassword(auth, values.email, values.password);
        // The onAuthStateChanged listener in the provider will handle the redirect.
    } catch (error: any) {
        let description = "An unexpected error occurred. Please try again.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = "Invalid login credentials. Please try again.";
        } else if (error.code === 'auth/too-many-requests') {
            description = "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.";
        }
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: description,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isUserLoading || user) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
                <Logo className="h-8 w-8 text-primary" />
                <CardTitle>Territory Manager</CardTitle>
            </div>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
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
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Remember me
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
            <p className="text-muted-foreground">Don't have an account?</p>
            <SignUpDialog />
        </CardFooter>
      </Card>
    </div>
  );
}
