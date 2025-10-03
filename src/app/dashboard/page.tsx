import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSearch } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getAccounts } from '@/lib/data';

export default async function DashboardPage() {
    const accounts = await getAccounts();

    if (accounts.length > 0) {
        redirect(`/dashboard/account/${accounts[0].id}`);
    }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileSearch className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="mt-4">No Account Selected</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Select an account from the sidebar to view its details, or add a new account to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
