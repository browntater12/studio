'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeServerApp } from '@/firebase/server';

import {
  editAccountSchema,
  addProductToAccountSchema,
  editProductNoteSchema,
  editProductSchema,
  deleteProductSchema,
} from '@/lib/schema';
import {
  updateAccount as dbUpdateAccount,
  addProductToAccount as dbAddProduct,
  updateAccountProductNote as dbUpdateNote,
  updateProduct as dbUpdateProduct,
  deleteProduct as dbDeleteProduct,
  getAccountById as dbGetAccountById,
  getProducts as dbGetProducts,
} from '@/lib/data';
import { summarizeAccountNotes } from '@/ai/flows/summarize-account-notes';
import { generatePotentialActions } from '@/ai/flows/generate-potential-actions';


export async function updateAccount(prevState: any, formData: FormData) {
    const validatedFields = editAccountSchema.safeParse({
        id: formData.get('id'),
        name: formData.get('name'),
        accountNumber: formData.get('accountNumber'),
        industry: formData.get('industry'),
        status: formData.get('status'),
        details: formData.get('details'),
        address: formData.get('address'),
    });

    if (!validatedFields.success) {
        return {
            type: 'error',
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Account.',
        };
    }
    
    const { id, ...data } = validatedFields.data;

    try {
        const app = initializeServerApp();
        const firestore = getFirestore(app);
        await dbUpdateAccount(firestore, id, data);
    } catch (e) {
        return {
            type: 'error',
            message: 'Database Error: Failed to Update Account.',
        };
    }

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/account/${id}`);
    redirect(`/dashboard/account/${id}`);
}

export async function addProductToAccount(prevState: any, formData: FormData) {
    const validatedFields = addProductToAccountSchema.safeParse({
        accountId: formData.get('accountId'),
        productId: formData.get('productId'),
        notes: formData.get('notes'),
        priceType: formData.get('priceType'),
        bidFrequency: formData.get('bidFrequency'),
        lastBidPrice: formData.get('lastBidPrice'),
        winningBidPrice: formData.get('winningBidPrice'),
        priceDetails: {
            type: formData.get('priceDetails.type'),
            price: formData.get('priceDetails.price'),
        }
    });

    if (!validatedFields.success) {
        return {
            type: 'error',
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to add product.',
        };
    }

    const { accountId, ...productData } = validatedFields.data;

    try {
        const app = initializeServerApp();
        const firestore = getFirestore(app);
        await dbAddProduct(firestore, accountId, productData);
        revalidatePath(`/dashboard/account/${accountId}`);
        return { type: 'success', message: 'Product added successfully.' };
    } catch (e: any) {
        return { type: 'error', message: e.message || 'Database Error: Failed to add product.' };
    }
}

export async function updateProductNote(prevState: any, formData: FormData) {
    const validatedFields = editProductNoteSchema.safeParse({
        accountId: formData.get('accountId'),
        productId: formData.get('productId'),
        notes: formData.get('notes'),
    });

    if (!validatedFields.success) {
        return {
            type: 'error',
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to update note.',
        };
    }

    const { accountId, productId, notes } = validatedFields.data;

    try {
        const app = initializeServerApp();
        const firestore = getFirestore(app);
        await dbUpdateNote(firestore, accountId, productId, notes);
        revalidatePath(`/dashboard/account/${accountId}`);
        return { type: 'success', message: 'Note updated successfully.' };
    } catch (e: any) {
        return { type: 'error', message: e.message || 'Database Error: Failed to update note.' };
    }
}

export async function updateProduct(prevState: any, formData: FormData) {
    const validatedFields = editProductSchema.safeParse({
        id: formData.get('id'),
        name: formData.get('name'),
        productNumber: formData.get('productNumber'),
        volumes: formData.getAll('volumes'),
    });

    if (!validatedFields.success) {
        return {
            type: 'error',
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to update product.',
        };
    }

    const { id, ...data } = validatedFields.data;

    try {
        const app = initializeServerApp();
        const firestore = getFirestore(app);
        await dbUpdateProduct(firestore, id, data);
        revalidatePath('/dashboard/products');
        revalidatePath('/dashboard/account');
        return { type: 'success', message: 'Product updated successfully.' };
    } catch (e: any) {
        return { type: 'error', message: e.message || 'Database Error: Failed to update product.' };
    }
}

export async function deleteProduct(prevState: any, formData: FormData) {
  const validatedFields = deleteProductSchema.safeParse({
    id: formData.get('id'),
  });

  if (!validatedFields.success) {
    return {
      type: 'error',
      message: 'Invalid product ID.',
    };
  }

  try {
    const app = initializeServerApp();
    const firestore = getFirestore(app);
    await dbDeleteProduct(firestore, validatedFields.data.id);
    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard/account');
    return { type: 'success', message: 'Product deleted successfully.' };
  } catch (e: any) {
    return { type: 'error', message: e.message || 'Database Error: Failed to delete product.' };
  }
}

export async function generateSalesInsights(accountId: string) {
  try {
    const app = initializeServerApp();
    const firestore = getFirestore(app);

    const account = await dbGetAccountById(firestore, accountId);
    if (!account) {
      return { error: 'Account not found.' };
    }

    const allProducts = await dbGetProducts(firestore);

    const productNotesText =
      account.accountProducts
        ?.map(ap => {
          const product = allProducts.find(p => p.id === ap.productId);
          return `- ${product?.name || 'Unknown Product'}: ${ap.notes}`;
        })
        .join('\n') || 'No product notes.';

    const allNotes = [
      `Account Details: ${account.details || 'N/A'}`,
      `Product Notes:\n${productNotesText}`,
    ].join('\n\n');

    const [summaryResult, actionsResult] = await Promise.all([
      summarizeAccountNotes({
        accountName: account.name,
        notes: allNotes,
      }),
      generatePotentialActions({
        accountName: account.name,
        accountDetails: account.details || 'N/A',
        productNotes: productNotesText,
      }),
    ]);

    return {
      summary: summaryResult.summary,
      potentialActions: actionsResult.potentialActions,
    };
  } catch (e: any) {
    console.error('Error generating sales insights:', e);
    return { error: e.message || 'An unexpected error occurred.' };
  }
}
