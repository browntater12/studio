
'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeServerApp } from '@/firebase/server';

interface UserData {
    idToken?: string;
    email: string;
    password?: string;
    displayName?: string | null;
}

export async function createUserAndCompany(userData: UserData) {
    try {
        const adminApp = initializeServerApp();
        const auth = getAuth(adminApp);
        const firestore = getFirestore(adminApp);

        let userRecord;
        if (userData.idToken) {
            // Google Sign-In flow: User should already exist from client-side signInWithPopup
            // We just need to get their record.
             userRecord = await auth.getUserByEmail(userData.email);
        } else if (userData.password) {
            // Email/Password flow: Create the user
            userRecord = await auth.createUser({
                email: userData.email,
                password: userData.password,
            });
        } else {
            throw new Error("Either idToken or password must be provided.");
        }
        
        const uid = userRecord.uid;

        // Use a transaction to ensure all or nothing
        await firestore.runTransaction(async (transaction) => {
            const userProfileRef = firestore.collection('users').doc(uid);
            const userProfileDoc = await transaction.get(userProfileRef);

            // Only proceed if the user profile doesn't already exist.
            if (userProfileDoc.exists) {
                // This can happen if a user signs in with Google, then tries to sign up
                // with the same email/password. We just let them proceed.
                console.log(`User profile for ${uid} already exists. Skipping creation.`);
                return;
            }

            // 1. Create a new company
            const companyRef = firestore.collection('companies').doc();
            const companyName = userData.displayName ? `${userData.displayName}'s Company` : `Company for ${userData.email}`;
            transaction.set(companyRef, {
                name: companyName,
                createdAt: new Date(),
                ownerId: uid
            });
            const companyId = companyRef.id;

            // 2. Create the user profile and link it to the company
            transaction.set(userProfileRef, {
                email: userRecord.email,
                displayName: userRecord.displayName || userData.displayName || '',
                companyId: companyId,
            });
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error in createUserAndCompany:', error);
        // We return the error message to be displayed on the client.
        return { error: error.code || error.message || 'An unknown error occurred.' };
    }
}
