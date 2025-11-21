
'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { initializeServerApp } from '@/firebase/server';
import { 
    staticAccounts, 
    staticContacts, 
    staticProducts, 
    staticAccountProducts, 
    staticShippingLocations, 
    staticCallNotes 
} from '@/app/main/page';
import { type Account, type Contact, type Product, type AccountProduct, type ShippingLocation, type CallNote } from '@/lib/types';


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

        await firestore.runTransaction(async (transaction) => {
            const userProfileDoc = await transaction.get(userProfileRef);

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

            // 3. Seed the database with static data for the new company
            const accountIdMap = new Map<string, string>();

            // Seed Accounts
            for (const account of staticAccounts) {
                const newAccountRef = firestore.collection('accounts-db').doc();
                const oldId = account.id;
                const newId = newAccountRef.id;
                accountIdMap.set(oldId, newId);

                const newAccountData: Omit<Account, 'id'> = {
                    ...account,
                    companyId: companyId,
                };
                transaction.set(newAccountRef, newAccountData);
            }

            // Seed Contacts
            for (const contact of staticContacts) {
                const newContactRef = firestore.collection('contacts').doc();
                 const newContactData: Omit<Contact, 'id'> = {
                    ...contact,
                    companyId: companyId,
                };
                transaction.set(newContactRef, newContactData);
            }
            
            // Seed Products
            for (const product of staticProducts) {
                const newProductRef = firestore.collection('products').doc();
                const newProductData: Omit<Product, 'id'> = {
                    ...product,
                    companyId: companyId,
                };
                transaction.set(newProductRef, newProductData);
            }

            // Seed AccountProducts (linking table)
            for (const ap of staticAccountProducts) {
                const newAccountProductRef = firestore.collection('account-products').doc();
                const newAccountId = accountIdMap.get(ap.accountId);
                if (newAccountId) {
                    const newAccountProductData: Omit<AccountProduct, 'id'> = {
                        ...ap,
                        accountId: newAccountId,
                        companyId: companyId,
                    };
                    transaction.set(newAccountProductRef, newAccountProductData);
                }
            }
            
            // Seed ShippingLocations
            for (const sl of staticShippingLocations) {
                const newShippingLocationRef = firestore.collection('shipping-locations').doc();
                const newOriginalAccountId = accountIdMap.get(sl.originalAccountId);
                const newRelatedAccountId = accountIdMap.get(sl.relatedAccountId);
                if (newOriginalAccountId && newRelatedAccountId) {
                    const newShippingLocationData: Omit<ShippingLocation, 'id'> = {
                        ...sl,
                        originalAccountId: newOriginalAccountId,
                        relatedAccountId: newRelatedAccountId,
                        companyId: companyId,
                    };
                    transaction.set(newShippingLocationRef, newShippingLocationData);
                }
            }

            // Seed CallNotes
            for (const note of staticCallNotes) {
                const newCallNoteRef = firestore.collection('call-notes').doc();
                const newAccountId = accountIdMap.get(note.accountId);
                if (newAccountId) {
                     const newCallNoteData: Omit<CallNote, 'id'> = {
                        ...note,
                        accountId: newAccountId,
                        companyId: companyId,
                        // Firestore server timestamps can't be used in transactions like this
                        // so we convert the static ones to Firestore Timestamps
                        callDate: note.callDate instanceof Timestamp ? note.callDate : Timestamp.fromDate(new Date()),
                    };
                    transaction.set(newCallNoteRef, newCallNoteData);
                }
            }
        });

        console.log(`Transaction for user ${uid} completed successfully.`);
        return { success: true };
    } catch (error: any) {
        console.error('Error in createUserAndCompany:', error);
        return { error: error.code || error.message || 'An unknown error occurred.' };
    }
}
