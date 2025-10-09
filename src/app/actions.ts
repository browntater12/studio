'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  editProductNoteSchema,
  editProductSchema,
  deleteProductSchema,
  deleteContactSchema,
  editAccountProductSchema,
  deleteAccountProductSchema,
} from '@/lib/schema';
import {
  updateAccountProductNote as dbUpdateNote,
  updateProduct as dbUpdateProduct,
  deleteProduct as dbDeleteProduct,
  deleteContact as dbDeleteContact,
  updateAccountProduct as dbUpdateAccountProduct,
  deleteAccountProduct as dbDeleteAccountProduct,
} from '@/lib/data';

export async function updateProductNote(prevState: any, formData: FormData) {
    const validatedFields = editProductNoteSchema.safeParse({
        noteId: formData.get('noteId'),
        notes: formData.get('notes'),
    });

    if (!validatedFields.success) {
        return {
            type: 'error',
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to update note.',
        };
    }

    const { noteId, notes } = validatedFields.data;

    try {
        await dbUpdateNote(noteId, notes);
        revalidatePath(`/dashboard/account`); // This might be too broad, need to figure out which account
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
        await dbUpdateProduct(id, data);
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

export async function deleteContact(prevState: any, formData: FormData) {
  const validatedFields = deleteContactSchema.safeParse({
    id: formData.get('id'),
  });

  if (!validatedFields.success) {
    return {
      type: 'error',
      message: 'Invalid contact ID.',
    };
  }

  try {
    await dbDeleteContact(validatedFields.data.id);
    revalidatePath('/dashboard/account');
    return { type: 'success', message: 'Contact deleted successfully.' };
  } catch (e: any) {
    return { type: 'error', message: e.message || 'Database Error: Failed to delete contact.' };
  }
}

export async function updateAccountProduct(prevState: any, formData: FormData) {
    const bidFrequencyValue = formData.get('bidFrequency');
    const rawData = {
        id: formData.get('id'),
        accountId: formData.get('accountId'),
        productId: formData.get('productId'),
        notes: formData.get('notes'),
        priceType: formData.get('priceType'),
        bidFrequency: bidFrequencyValue === 'null' || bidFrequencyValue === '' ? undefined : bidFrequencyValue,
        lastBidPrice: formData.get('lastBidPrice') ? parseFloat(formData.get('lastBidPrice') as string) : undefined,
        winningBidPrice: formData.get('winningBidPrice') ? parseFloat(formData.get('winningBidPrice') as string) : undefined,
        priceDetails: {
            type: formData.get('priceDetails.type'),
            price: formData.get('priceDetails.price') ? parseFloat(formData.get('priceDetails.price') as string) : undefined,
        }
    };
    
    const validatedFields = editAccountProductSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            type: 'error',
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to update product details.',
        };
    }
    
    const { id, ...data } = validatedFields.data;

    try {
        await dbUpdateAccountProduct(id, data);
        revalidatePath(`/dashboard/account/${data.accountId}`);
        return { type: 'success', message: 'Product details updated successfully.' };
    } catch (e: any) {
        return { type: 'error', message: e.message || 'Database Error: Failed to update product details.' };
    }
}

export async function deleteAccountProduct(prevState: any, formData: FormData) {
    const validatedFields = deleteAccountProductSchema.safeParse({
        id: formData.get('id'),
    });

    if (!validatedFields.success) {
        return {
            type: 'error',
            message: 'Invalid ID.',
        };
    }

    try {
        await dbDeleteAccountProduct(validatedFields.data.id);
        revalidatePath('/dashboard/account'); // revalidate any account page
        return { type: 'success', message: 'Product link from account deleted.' };
    } catch (e: any) {
        return { type: 'error', message: e.message || 'Database Error: Failed to delete product link.' };
    }
}
