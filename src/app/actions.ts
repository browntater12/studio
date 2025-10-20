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
