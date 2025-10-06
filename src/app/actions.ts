'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getFirestore as getServerFirestore } from 'firebase-admin/firestore';
import { initializeServerApp } from '@/firebase/server';

import {
  addAccountSchema,
  editAccountSchema,
  addContactSchema,
  editContactSchema,
  addProductToAccountSchema,
  editProductNoteSchema,
  createProductSchema,
  editProductSchema,
  deleteProductSchema,
} from '@/lib/schema';
import {
  updateAccount as dbUpdateAccount,
  addContactToAccount as dbAddContact,
  updateContact as dbUpdateContact,
  addProductToAccount as dbAddProduct,
  updateAccountProductNote as dbUpdateNote,
  addProduct as dbAddProductGlobal,
  updateProduct as dbUpdateProduct,
  deleteProduct as dbDeleteProduct,
  getAccountById,
} from '@/lib/data';


export async function addAccount(prevState: any, formData: FormData) {
  const validatedFields = addAccountSchema.safeParse({
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
      message: 'Missing Fields. Failed to Create Account.',
    };
  }

  let docRef;
  try {
    const app = initializeServerApp();
    const firestore = getServerFirestore(app);
    docRef = await firestore.collection('accounts').add(validatedFields.data);
  } catch (e) {
    console.error(e);
    return {
      type: 'error',
      message: 'Database Error: Failed to Create Account.',
    };
  }

  revalidatePath('/dashboard');
  redirect(`/dashboard/account/${docRef.id}`);
}

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

    try {
        await dbUpdateAccount(validatedFields.data.id, validatedFields.data);
    } catch (e) {
        return {
            type: 'error',
            message: 'Database Error: Failed to Update Account.',
        };
    }

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/account/${validatedFields.data.id}`);
    redirect(`/dashboard/account/${validatedFields.data.id}`);
}

export async function addContact(prevState: any, formData: FormData) {
    const validatedFields = addContactSchema.safeParse({
        accountId: formData.get('accountId'),
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        location: formData.get('location'),
        isMainContact: formData.get('isMainContact') === 'on',
    });

    if (!validatedFields.success) {
        return {
            type: 'error',
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to add contact.',
        };
    }

    try {
        await dbAddContact(validatedFields.data.accountId, validatedFields.data);
        revalidatePath(`/dashboard/account/${validatedFields.data.accountId}`);
        return { type: 'success', message: 'Contact added successfully.' };
    } catch (e) {
        return { type: 'error', message: 'Database Error: Failed to add contact.' };
    }
}

export async function updateContact(prevState: any, formData: FormData) {
    const validatedFields = editContactSchema.safeParse({
        accountId: formData.get('accountId'),
        contactId: formData.get('contactId'),
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        location: formData.get('location'),
        isMainContact: formData.get('isMainContact') === 'on',
    });

    if (!validatedFields.success) {
        return {
            type: 'error',
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to update contact.',
        };
    }

    try {
        await dbUpdateContact(validatedFields.data.accountId, validatedFields.data);
        revalidatePath(`/dashboard/account/${validatedFields.data.accountId}`);
        return { type: 'success', message: 'Contact updated successfully.' };
    } catch (e: any) {
        return { type: 'error', message: e.message || 'Database Error: Failed to update contact.' };
    }
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

    try {
        await dbAddProduct(validatedFields.data.accountId, validatedFields.data);
        revalidatePath(`/dashboard/account/${validatedFields.data.accountId}`);
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

    try {
        await dbUpdateNote(validatedFields.data.accountId, validatedFields.data.productId, validatedFields.data.notes);
        revalidatePath(`/dashboard/account/${validatedFields.data.accountId}`);
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
        await dbAddProductGlobal(validatedFields.data);
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

    try {
        await dbUpdateProduct(validatedFields.data.id, validatedFields.data);
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
    await dbDeleteProduct(validatedFields.data.id);
    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard/account');
    return { type: 'success', message: 'Product deleted successfully.' };
  } catch (e: any) {
    return { type: 'error', message: e.message || 'Database Error: Failed to delete product.' };
  }
}
