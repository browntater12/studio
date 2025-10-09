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
  const accountsCol = db.collection('accounts-db');
  const accountSnapshot = await accountsCol.get();
  const accounts: Account[] = [];
  for (const doc of accountSnapshot.docs) {
    accounts.push({ id: doc.id, ...doc.data() } as Account);
  }
  return accounts;
}

export async function getAccountProductNotes(accountId: string): Promise<AccountProduct[]> {
    const db = getAdminFirestore(initializeServerApp());
    const q = db.collection('account-products').where('accountId', '==', accountId);
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccountProduct));
}

export async function getAccountById(
  id: string
): Promise<Account | undefined> {
  const db = getAdminFirestore(initializeServerApp());
  const accountRef = db.collection('accounts-db').doc(id);
  const accountSnap = await accountRef.get();

  if (!accountSnap.exists) {
    return undefined;
  }

  const accountData = { id: accountSnap.id, ...accountSnap.data() } as Account;

  return accountData;
}

export async function getProducts(): Promise<Product[]> {
  const db = getAdminFirestore(initializeServerApp());
  const productsCol = db.collection('products');
  const productSnapshot = await productsCol.get();
  return productSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Product)
  );
}

export async function getProductById(
  id: string
): Promise<Product | undefined> {
  const db = getAdminFirestore(initializeServerApp());
  const productRef = db.collection('products').doc(id);
  const productSnap = await productRef.get();
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
  await accountRef.update(data);
}

export async function updateAccountProductNote(
  noteId: string,
  notes: string
): Promise<void> {
  const db = getAdminFirestore(initializeServerApp());
  const noteRef = db.collection('account-products').doc(noteId);
  await noteRef.update({ notes });
}

export async function addProductToAccount(
  productData: Omit<AccountProduct, 'id'>
): Promise<void> {
  const db = getAdminFirestore(initializeServerApp());
  const accountProductsCollection = db.collection('account-products');
  await accountProductsCollection.add(productData);
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
  await productRef.update(data);
}

export async function deleteProduct(id: string): Promise<void> {
  const db = getAdminFirestore(initializeServerApp());
  const productRef = db.collection('products').doc(id);
  await productRef.delete();
}

export async function deleteContact(id: string): Promise<void> {
    const db = getAdminFirestore(initializeServerApp());
    const contactRef = db.collection('contacts').doc(id);
    await contactRef.delete();
}

export async function updateAccountProduct(
    id: string,
    data: Partial<Omit<AccountProduct, 'id'>>
): Promise<void> {
    const db = getAdminFirestore(initializeServerApp());
    const accountProductRef = db.collection('account-products').doc(id);
    await accountProductRef.update(data);
}

export async function deleteAccountProduct(id: string): Promise<void> {
    const db = getAdminFirestore(initializeServerApp());
    const accountProductRef = db.collection('account-products').doc(id);
    await accountProductRef.delete();
}
