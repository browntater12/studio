'use client';

import * as React from 'react';
import { Wand2, Loader2, ServerCrash } from 'lucide-react';
import { generateSalesInsights } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Separator } from '../ui/separator';

type Insights = {
  summary: string;
  potentialActions: string[];
};

export function SalesInsights({ accountId }: { accountId: string }) {
  const [open, setOpen] = React.useState(false);
  const [insights, setInsights] = React.useState<Insights | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleGenerateInsights = async () => {
    setLoading(true);
    setError(null);
    setInsights(null);
    const result = await generateSalesInsights(accountId);
    if (result.error) {
      setError(result.error);
    } else {
      setInsights(result as Insights);
    }
    setLoading(false);
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
        // Reset state when closing dialog
        setInsights(null);
        setError(null);
        setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={handleGenerateInsights}>
          <Wand2 className="mr-2 h-4 w-4" />
          Generate Insights
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Sales Insights</DialogTitle>
          <DialogDescription>
            An AI-generated summary and potential actions based on account data.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          {loading && (
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Account Summary</h3>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </div>
                 <Separator />
                <div>
                    <h3 className="font-semibold mb-2">Potential Actions</h3>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                </div>
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <ServerCrash className="h-4 w-4" />
              <AlertTitle>Generation Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {insights && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Account Summary</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{insights.summary}</p>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold">Suggested Actions</h3>
                <ul className="mt-2 space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                  {insights.potentialActions.map((action, index) => (
                    <li key={index}>{action.replace(/^\d+\.\s/, '')}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
