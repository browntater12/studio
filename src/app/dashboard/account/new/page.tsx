import { AddAccountForm } from '@/components/forms/add-account-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

export default function NewAccountPage() {
  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle />
            Create New Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AddAccountForm />
        </CardContent>
      </Card>
    </div>
  );
}
