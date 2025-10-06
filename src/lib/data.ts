import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  writeBatch,
  query,
  where,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';

import { getSdks } from '@/firebase';
import type { Account, Product, Contact, AccountProduct } from './types';
import { PlaceHolderImages } from './placeholder-images';
import {
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';

function getDb() {
  return getSdks(undefined as any).firestore;
}

// Data access functions
export async function getAccounts(): Promise<Account[]> {
  const db = getDb();
  const accountsCol = collection(db, 'accounts');
  const accountSnapshot = await getDocs(accountsCol);
  const accounts: Account[] = [];
  for (const doc of accountSnapshot.docs) {
    accounts.push({ id: doc.id, ...doc.data() } as Account);
  }
  return accounts;
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  const db = getDb();
  const accountRef = doc(db, 'accounts', id);
  const accountSnap = await getDoc(accountRef);

  if (!accountSnap.exists()) {
    return undefined;
  }

  const accountData = { id: accountSnap.id, ...accountSnap.data() } as Account;

  // Fetch subcollections
  const contactsCol = collection(db, 'accounts', id, 'contacts');
  const contactsSnap = await getDocs(contactsCol);
  accountData.contacts = contactsSnap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Contact)
  );

  const productsCol = collection(db, 'accounts', id, 'products');
  const productsSnap = await getDocs(productsCol);
  // The document ID is the productId for this subcollection
  accountData.accountProducts = productsSnap.docs.map(
    (doc) => ({ productId: doc.id, ...doc.data() } as AccountProduct)
  );

  return accountData;
}

export async function getProducts(): Promise<Product[]> {
  const db = getDb();
  const productsCol = collection(db, 'products');
  const productSnapshot = await getDocs(productsCol);
  return productSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Product)
  );
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const db = getDb();
  const productRef = doc(db, 'products', id);
  const productSnap = await getDoc(productRef);
  return productSnap.exists()
    ? ({ id: productSnap.id, ...productSnap.data() } as Product)
    : undefined;
}

export async function addAccount(
  data: Omit<Account, 'id' | 'contacts' | 'accountProducts'>
): Promise<Account> {
  const db = getDb();
  const accountsCol = collection(db, 'accounts');
  const docRef = await addDoc(accountsCol, data);
  return {
    ...data,
    id: docRef.id,
    contacts: [],
    accountProducts: [],
  };
}

export async function updateAccount(
  id: string,
  data: Partial<Omit<Account, 'id' | 'contacts' | 'accountProducts'>>
): Promise<void> {
  const db = getDb();
  const accountRef = doc(db, 'accounts', id);
  updateDocumentNonBlocking(accountRef, data);
}

export async function addContactToAccount(
  accountId: string,
  contactData: Omit<Contact, 'id' | 'avatarUrl'>
): Promise<void> {
  const db = getDb();
  const contactsCol = collection(db, 'accounts', accountId, 'contacts');
  
  if (contactData.isMainContact) {
    const q = query(contactsCol, where('isMainContact', '==', true));
    const mainContactsSnap = await getDocs(q);
    const batch = writeBatch(db);
    mainContactsSnap.forEach(doc => {
      batch.update(doc.ref, { isMainContact: false });
    });
    await batch.commit();
  }

  addDocumentNonBlocking(contactsCol, {
    ...contactData,
    avatarUrl: PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)].imageUrl,
  });
}

export async function updateContact(
  accountId: string,
  contactData: Omit<Contact, 'avatarUrl'> & { contactId: string }
): Promise<void> {
  const db = getDb();
  const contactRef = doc(db, 'accounts', accountId, 'contacts', contactData.contactId);
  
  if (contactData.isMainContact) {
    const contactsCol = collection(db, 'accounts', accountId, 'contacts');
    const q = query(contactsCol, where('isMainContact', '==', true));
    const mainContactsSnap = await getDocs(q);
    const batch = writeBatch(db);
    mainContactsSnap.forEach(doc => {
      if (doc.id !== contactData.contactId) {
        batch.update(doc.ref, { isMainContact: false });
      }
    });
    await batch.commit();
  }
  
  updateDocumentNonBlocking(contactRef, contactData);
}

export async function addProductToAccount(
  accountId: string,
  productData: { productId: string; notes: string }
): Promise<void> {
  const db = getDb();
  const productRef = doc(db, 'accounts', accountId, 'products', productData.productId);
  const docSnap = await getDoc(productRef);

  if (docSnap.exists()) {
    throw new Error(
      'Product already exists for this account. You can edit the notes from the product list.'
    );
  }

  setDocumentNonBlocking(productRef, { notes: productData.notes }, {});
}

export async function updateAccountProductNote(
  accountId: string,
  productId: string,
  notes: string
): Promise<void> {
  const db = getDb();
  const productRef = doc(db, 'accounts', accountId, 'products', productId);
  updateDocumentNonBlocking(productRef, { notes });
}

export async function addProduct(data: Omit<Product, 'id'>): Promise<void> {
  const db = getDb();
  const q = query(collection(db, 'products'), where('productNumber', '==', data.productNumber));
  const existing = await getDocs(q);

  if (!existing.empty) {
      throw new Error('A product with this product number already exists.');
  }

  addDocumentNonBlocking(collection(db, 'products'), data);
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, 'id'>>
): Promise<void> {
  const db = getDb();
  const productRef = doc(db, 'products', id);
  if (data.productNumber) {
    const q = query(collection(db, 'products'), where('productNumber', '==', data.productNumber));
    const existing = await getDocs(q);
    if (!existing.empty && existing.docs.some(doc => doc.id !== id)) {
        throw new Error('A product with this product number already exists.');
    }
  }
  updateDocumentNonBlocking(productRef, data);
}

export async function deleteProduct(id: string): Promise<void> {
  const db = getDb();
  const productRef = doc(db, 'products', id);

  // This is a complex operation to do on the client.
  // In a real app, this would be a Cloud Function.
  // For now, we will just delete the product doc.
  // The references in account subcollections will be orphaned.
  deleteDocumentNonBlocking(productRef);
}
