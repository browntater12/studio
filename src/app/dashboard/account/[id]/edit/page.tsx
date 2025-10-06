'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useParams, notFound } from 'next/navigation';
import { AddAccountForm } from '@/components/forms/add-account-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { type Account } from '@/lib/types';

export default function EditAccountPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();

  const accountRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'accounts', id);
  }, [firestore, id]);

  const { data: account, isLoading } = useDoc<Account>(accountRef);

  if (isLoading) {
    return (
      <div className="flex justify-center items-start pt-8">
        <Card className="w-full max-w-2xl">
          <CardHeader>
             <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!account) {
    return notFound();
  }

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit />
            Edit Account: {account.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AddAccountForm account={account} />
        </CardContent>
      </Card>
    </div>
  );
}
