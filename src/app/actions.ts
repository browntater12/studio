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
  createProductSchema,
  editProductSchema,
  deleteProductSchema,
} from '@/lib/schema';
import {
  updateAccount as dbUpdateAccount,
  addProductToAccount as dbAddProduct,
  updateAccountProductNote as dbUpdateNote,
  addProduct as dbAddProductGlobal,
  updateProduct as dbUpdateProduct,
  deleteProduct as dbDeleteProduct,
} from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';


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

export async function createProduct(prevState: any, formData: FormData) {
    const validatedFields = createProductSchema.safeParse({
        name: formData.get('name'),
        productNumber: formData.get('productNumber'),
        volumes: formData.getAll('volumes'),
    });

    if (!validatedFields.success) {
        return {
            type: 'error',
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to create product.',
        };
    }

    try {
        const app = initializeServerApp();
        const firestore = getFirestore(app);
        await dbAddProductGlobal(firestore, validatedFields.data);
        revalidatePath('/dashboard/products');
        revalidatePath('/dashboard/account');
        return { type: 'success', message: 'Product created successfully.' };
    } catch (e: any) {
        return { type: 'error', message: e.message || 'Database Error: Failed to create product.' };
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
