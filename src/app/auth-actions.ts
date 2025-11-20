
'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeServerApp } from '@/firebase/server';

interface UserData {
    uid: string;
    email: string;
    displayName?: string | null;
}

// Helper function to introduce a delay
function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function createUserAndCompany(userData: UserData) {
    try {
        const adminApp = initializeServerApp();
        const firestore = getFirestore(adminApp);
        const auth = getAuth(adminApp);
        
        const { uid, email, displayName } = userData;

        // Add a small delay to allow auth state to propagate on the backend
        await delay(1000);

        const userRecord = await auth.getUser(uid);

        // Use a transaction to ensure all or nothing
        await firestore.runTransaction(async (transaction) => {
            const userProfileRef = firestore.collection('users').doc(uid);
            const userProfileDoc = await transaction.get(userProfileRef);

            // Only proceed if the user profile doesn't already exist.
            if (userProfileDoc.exists) {
                console.log(`User profile for ${uid} already exists. Skipping creation.`);
                // Return from the transaction function, but the outer function will still return success.
                return; 
            }

            // 1. Create a new company
            const companyRef = firestore.collection('companies').doc();
            const companyName = userRecord.displayName ? `${userRecord.displayName}'s Company` : `Company for ${email}`;
            transaction.set(companyRef, {
                name: companyName,
                createdAt: new Date(),
                ownerId: uid
            });
            const companyId = companyRef.id;

            // 2. Create the user profile and link it to the company
            transaction.set(userProfileRef, {
                email: userRecord.email,
                displayName: userRecord.displayName || displayName || '',
                companyId: companyId,
            });
        });

        // Always return success if the transaction completes or if the user already existed.
        return { success: true };
    } catch (error: any) {
        console.error('Error in createUserAndCompany:', error);
        // We return the error message to be displayed on the client.
        return { error: error.code || error.message || 'An unknown error occurred.' };
    }
}
