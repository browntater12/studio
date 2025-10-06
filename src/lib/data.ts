import {
  collection,
  doc,
  writeBatch,
  query,
  where,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { Firestore as AdminFirestore } from 'firebase-admin/firestore';

import type { Account, Product, Contact, AccountProduct } from './types';


// Data access functions
export async function getAccounts(db: Firestore | AdminFirestore): Promise<Account[]> {
  const accountsCol = collection(db, 'accounts-db');
  const accountSnapshot = await getDocs(accountsCol);
  const accounts: Account[] = [];
  for (const doc of accountSnapshot.docs) {
    accounts.push({ id: doc.id, ...doc.data() } as Account);
  }
  return accounts;
}

export async function getAccountById(
  db: Firestore | AdminFirestore,
  id: string
): Promise<Account | undefined> {
  const accountRef = doc(db, 'accounts-db', id);
  const accountSnap = await getDoc(accountRef);

  if (!accountSnap.exists()) {
    return undefined;
  }

  const accountData = { id: accountSnap.id, ...accountSnap.data() } as Account;

  // Fetch subcollections
  const productsCol = collection(db, 'accounts-db', id, 'products');
  const productsSnap = await getDocs(productsCol);
  // The document ID is the productId for this subcollection
  accountData.accountProducts = productsSnap.docs.map(
    (doc) => ({ productId: doc.id, ...doc.data() } as AccountProduct)
  );

  return accountData;
}

export async function getProducts(db: Firestore | AdminFirestore): Promise<Product[]> {
  const productsCol = collection(db, 'products');
  const productSnapshot = await getDocs(productsCol);
  return productSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Product)
  );
}

export async function getProductById(
  db: Firestore,
  id: string
): Promise<Product | undefined> {
  const productRef = doc(db, 'products', id);
  const productSnap = await getDoc(productRef);
  return productSnap.exists()
    ? ({ id: productSnap.id, ...productSnap.data() } as Product)
    : undefined;
}

export async function updateAccount(
  db: AdminFirestore,
  id: string,
  data: Partial<Omit<Account, 'id' | 'contacts' | 'accountProducts'>>
): Promise<void> {
  const accountRef = db.collection('accounts-db').doc(id);
  await accountRef.update(data);
}

export async function addProductToAccount(
  db: AdminFirestore,
  accountId: string,
  productData: { productId: string; notes: string }
): Promise<void> {
  const productRef = db.collection('accounts-db').doc(accountId).collection('products').doc(productData.productId);
  const docSnap = await productRef.get();

  if (docSnap.exists) {
    throw new Error(
      'Product already exists for this account. You can edit the notes from the product list.'
    );
  }

  await productRef.set({ notes: productData.notes });
}

export async function updateAccountProductNote(
  db: AdminFirestore,
  accountId: string,
  productId: string,
  notes: string
): Promise<void> {
  const productRef = db.collection('accounts-db').doc(accountId).collection('products').doc(productId);
  await productRef.update({ notes });
}

export async function addProduct(db: AdminFirestore, data: Omit<Product, 'id'>): Promise<void> {
  const q = db.collection('products').where('productNumber', '==', data.productNumber);
  const existing = await q.get();

  if (!existing.empty) {
      throw new Error('A product with this product number already exists.');
  }

  await db.collection('products').add(data);
}

export async function updateProduct(
  db: AdminFirestore,
  id: string,
  data: Partial<Omit<Product, 'id'>>
): Promise<void> {
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

export async function deleteProduct(db: AdminFirestore, id: string): Promise<void> {
  const productRef = db.collection('products').doc(id);

  // In a real app, this might be a Cloud Function for safety.
  // For now, we will just delete the product doc.
  // Note: References in account subcollections will be orphaned.
  await productRef.delete();
}
