'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Only initialize Firebase on the client side.
    if (typeof window !== 'undefined') {
      return initializeFirebase();
    }
    return null;
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices?.firebaseApp}
      auth={firebaseServices?.auth}
      firestore={firebaseServices?.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
