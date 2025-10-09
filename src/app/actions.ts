'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';

import {
  editProductNoteSchema,
  editProductSchema,
  deleteProductSchema,
} from '@/lib/schema';
import {
  updateAccountProductNote as dbUpdateNote,
  updateProduct as dbUpdateProduct,
  deleteProduct as dbDeleteProduct,
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
