import { getAccountById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { AddAccountForm } from '@/components/forms/add-account-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit } from 'lucide-react';

export default async function EditAccountPage({ params }: { params: { id: string } }) {
  const account = await getAccountById(params.id);

  if (!account) {
    notFound();
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
