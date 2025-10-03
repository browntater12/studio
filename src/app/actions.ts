'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  addAccountSchema,
  addContactSchema,
  addProductToAccountSchema,
  editProductNoteSchema
} from '@/lib/schema';
import {
  addAccount as dbAddAccount,
  addContactToAccount as dbAddContact,
  addProductToAccount as dbAddProduct,
  updateAccountProductNote as dbUpdateNote,
  getAccountById,
} from '@/lib/data';

import { summarizeAccountNotes } from '@/ai/flows/summarize-account-notes';
import { generatePotentialActions } from '@/ai/flows/generate-potential-actions';


export async function addAccount(prevState: any, formData: FormData) {
  const validatedFields = addAccountSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      type: 'error',
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Account.',
    };
  }

  try {
    const newAccount = await dbAddAccount(validatedFields.data);
    revalidatePath('/dashboard');
    return { type: 'success', message: 'Account created successfully', accountId: newAccount.id };
  } catch (e) {
    return {
      type: 'error',
      message: 'Database Error: Failed to Create Account.',
    };
  }
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

export async function generateSalesInsights(accountId: string) {
    const account = await getAccountById(accountId);

    if (!account) {
        return { error: "Account not found" };
    }

    const allNotes = account.accountProducts.map(p => `- ${p.notes}`).join('\n');
    const fullNotes = `Account Details: ${account.details}\n\nProduct Notes:\n${allNotes}`;

    try {
        const [summary, actions] = await Promise.all([
            summarizeAccountNotes({
                accountName: account.name,
                notes: fullNotes,
            }),
            generatePotentialActions({
                accountName: account.name,
                accountDetails: account.details,
                productNotes: allNotes,
            })
        ]);
        
        return { 
            summary: summary.summary, 
            potentialActions: actions.potentialActions 
        };
    } catch (e) {
        console.error("AI generation failed:", e);
        return { error: "Failed to generate insights. Please try again." };
    }
}
