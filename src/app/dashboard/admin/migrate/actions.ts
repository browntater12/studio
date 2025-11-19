'use server';

import { initializeServerApp } from '@/firebase/server';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

const COLLECTIONS_TO_MIGRATE = [
    'accounts-db',
    'contacts',
    'products',
    'account-products',
    'shipping-locations',
    'call-notes'
];

export async function migrateDataToCompany(userEmail: string, companyId: string) {
    try {
        const adminApp = initializeServerApp();
        const adminAuth = getAdminAuth(adminApp);
        const adminDb = getAdminFirestore(adminApp);

        // 1. Find user and update their profile with companyId
        let user;
        try {
            user = await adminAuth.getUserByEmail(userEmail);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                 return { success: false, message: `User with email ${userEmail} not found.` };
            }
            throw error;
        }

        const userProfileRef = adminDb.collection('users').doc(user.uid);
        await userProfileRef.set({ companyId: companyId }, { merge: true });

        // 2. Iterate through collections and update documents
        let totalDocsUpdated = 0;
        for (const collectionName of COLLECTIONS_TO_MIGRATE) {
            const collectionRef = adminDb.collection(collectionName);
            const snapshot = await collectionRef.where('companyId', '==', null).get();
            
            if (snapshot.empty) {
                continue;
            }

            const batch = adminDb.batch();
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { companyId: companyId });
            });
            await batch.commit();
            totalDocsUpdated += snapshot.size;
        }

        return { success: true, message: `Successfully migrated ${totalDocsUpdated} documents to company '${companyId}' and updated user profile.` };

    } catch (error: any) {
        console.error('Data migration failed:', error);
        return { success: false, message: error.message || 'An unknown server error occurred.' };
    }
}
