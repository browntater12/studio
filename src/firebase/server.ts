'use server';

import { initializeApp, getApps, App } from 'firebase-admin/app';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeServerApp(): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  // This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
  // for authentication, which is automatically set by Firebase App Hosting.
  return initializeApp();
}
