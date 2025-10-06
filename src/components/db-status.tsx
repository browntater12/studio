'use client';

import * as React from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Badge } from './ui/badge';
import { Loader2, Server, ServerCrash } from 'lucide-react';

export function DbStatus() {
  const [status, setStatus] = React.useState<'checking' | 'connected' | 'error'>('checking');
  const firestore = useFirestore();

  React.useEffect(() => {
    async function checkDb() {
      if (!firestore) return;
      try {
        const q = query(collection(firestore, 'accounts'), limit(1));
        await getDocs(q);
        setStatus('connected');
      } catch (error) {
        console.error("Database connection check failed:", error);
        setStatus('error');
      }
    }
    checkDb();
  }, [firestore]);

  return (
    <div className="flex items-center justify-center w-full">
      {status === 'checking' && (
        <Badge variant="outline" className="text-muted-foreground">
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          Checking DB...
        </Badge>
      )}
      {status === 'connected' && (
        <Badge variant="outline" className="text-green-600 border-green-600/50 bg-green-500/10">
          <Server className="mr-2 h-3.5 w-3.5" />
          DB Connected
        </Badge>
      )}
      {status === 'error' && (
        <Badge variant="destructive">
          <ServerCrash className="mr-2 h-3.5 w-3.5" />
          DB Error
        </Badge>
      )}
    </div>
  );
}
