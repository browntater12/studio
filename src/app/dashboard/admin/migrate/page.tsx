'use client';

import * as React from 'react';
import { migrateDataToCompany } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function MigratePage() {
    const [isMigrating, setIsMigrating] = React.useState(false);
    const { toast } = useToast();

    const handleMigration = async () => {
        setIsMigrating(true);
        try {
            const result = await migrateDataToCompany('admin@example.com', 'Brenntag');
            if (result.success) {
                toast({
                    title: 'Migration Successful!',
                    description: result.message,
                    variant: 'default',
                });
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            console.error('Migration failed:', error);
            toast({
                title: 'Migration Failed',
                description: error.message || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                     <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="mt-4">One-Time Data Migration</CardTitle>
                    <CardDescription>
                        Click the button below to assign all existing data (accounts, products, etc.) to the company 'Brenntag' and associate it with the user 'admin@example.com'. This is a one-time operation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleMigration}
                        disabled={isMigrating}
                        className="w-full"
                    >
                        {isMigrating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Migrating...
                            </>
                        ) : (
                            'Start Data Migration'
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
