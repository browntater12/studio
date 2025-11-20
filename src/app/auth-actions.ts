
'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeServerApp } from '@/firebase/server';

interface UserData {
    uid: string;
    email: string;
    displayName?: string | null;
}

export async function createUserAndCompany(userData: UserData) {
    console.log("Starting createUserAndCompany for UID:", userData.uid);
    try {
        const adminApp = initializeServerApp();
        const firestore = getFirestore(adminApp);
        const auth = getAuth(adminApp);
        
        const { uid, email, displayName } = userData;

        const userProfileRef = firestore.collection('users').doc(uid);

        // Use a transaction to ensure all or nothing
        await firestore.runTransaction(async (transaction) => {
            const userProfileDoc = await transaction.get(userProfileRef);

            // Only proceed if the user profile doesn't already exist.
            if (userProfileDoc.exists) {
                console.log(`User profile for ${uid} already exists. Skipping creation.`);
                return; 
            }
            console.log(`User profile for ${uid} does not exist. Proceeding with creation.`);

            // 1. Create a new company
            const companyRef = firestore.collection('companies').doc();
            const userRecord = await auth.getUser(uid);
            const companyName = userRecord.displayName ? `${userRecord.displayName}'s Company` : `Company for ${email}`;
            
            transaction.set(companyRef, {
                name: companyName,
                createdAt: FieldValue.serverTimestamp(),
                ownerId: uid
            });
            const companyId = companyRef.id;
            console.log(`Created company with ID: ${companyId} for user ${uid}`);


            // 2. Create the user profile and link it to the company
            transaction.set(userProfileRef, {
                email: userRecord.email,
                displayName: userRecord.displayName || '',
                companyId: companyId,
            });
            console.log(`Created user profile for ${uid} and linked to company ${companyId}`);
        });

        console.log(`Transaction for user ${uid} completed successfully.`);
        return { success: true };
    } catch (error: any) {
        console.error('Error in createUserAndCompany:', error);
        return { error: error.code || error.message || 'An unknown error occurred.' };
    }
}
