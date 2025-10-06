import {
  collection,
  doc,
  writeBatch,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase-admin/firestore';
import type { Firestore as AdminFirestore } from 'firebase-admin/firestore';
import { initializeServerApp } from '@/firebase/server';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

import type { Account, Product, Contact, AccountProduct } from './types';


// Data access functions
export async function getAccounts(): Promise<Account[]> {
  const db = getAdminFirestore(initializeServerApp());
  const accountsCol = collection(db, 'accounts-db');
  const accountSnapshot = await getDocs(accountsCol);
  const accounts: Account[] = [];
  for (const doc of accountSnapshot.docs) {
    accounts.push({ id: doc.id, ...doc.data() } as Account);
  }
  return accounts;
}

export async function getAccountProductNotes(accountId: string): Promise<AccountProduct[]> {
    const db = getAdminFirestore(initializeServerApp());
    const q = query(collection(db, 'account-products'), where('accountId', '==', accountId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccountProduct));
}

export async function getAccountById(
  id: string
): Promise<Account | undefined> {
  const db = getAdminFirestore(initializeServerApp());
  const accountRef = doc(db, 'accounts-db', id);
  const accountSnap = await getDoc(accountRef);

  if (!accountSnap.exists()) {
    return undefined;
  }

  const accountData = { id: accountSnap.id, ...accountSnap.data() } as Account;

  return accountData;
}

export async function getProducts(): Promise<Product[]> {
  const db = getAdminFirestore(initializeServerApp());
  const productsCol = collection(db, 'products');
  const productSnapshot = await getDocs(productsCol);
  return productSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Product)
  );
}

export async function getProductById(
  id: string
): Promise<Product | undefined> {
  const db = getAdminFirestore(initializeServerApp());
  const productRef = doc(db, 'products', id);
  const productSnap = await getDoc(productRef);
  return productSnap.exists()
    ? ({ id: productSnap.id, ...productSnap.data() } as Product)
    : undefined;
}

export async function updateAccount(
  id: string,
  data: Partial<Omit<Account, 'id' | 'contacts' | 'accountProducts'>>
): Promise<void> {
  const db = getAdminFirestore(initializeServerApp());
  const accountRef = db.collection('accounts-db').doc(id);
  await updateDoc(accountRef, data);
}

export async function updateAccountProductNote(
  noteId: string,
  notes: string
): Promise<void> {
  const db = getAdminFirestore(initializeServerApp());
  const noteRef = db.collection('account-products').doc(noteId);
  await updateDoc(noteRef, { notes });
}

export async function addProductToAccount(
  productData: Omit<AccountProduct, 'id'>
): Promise<void> {
  const db = getAdminFirestore(initializeServerApp());
  const accountProductsCollection = db.collection('account-products');
  await addDoc(accountProductsCollection, productData);
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, 'id'>>
): Promise<void> {
  const db = getAdminFirestore(initializeServerApp());
  const productRef = db.collection('products').doc(id);
  if (data.productNumber) {
    const q = db.collection('products').where('productNumber', '==', data.productNumber);
    const existing = await q.get();
    if (!existing.empty && existing.docs.some(doc => doc.id !== id)) {
        throw new Error('A product with this product number already exists.');
    }
  }
  await updateDoc(productRef, data);
}

export async function deleteProduct(id: string): Promise<void> {
  const db = getAdminFirestore(initializeServerApp());
  const productRef = db.collection('products').doc(id);

  // In a real app, this might be a Cloud Function for safety.
  // For now, we will just delete the product doc.
  // Note: References in account-products will be orphaned.
  await deleteDoc(productRef);
}
