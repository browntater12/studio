
import { z } from 'zod';

export const addAccountSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  accountNumber: z.string().optional(),
  industry: z.string().min(1, 'Industry is required.'),
  status: z.enum(['lead', 'customer', 'key-account', 'supplier']),
  address: z.string().optional(),
  details: z.string().optional(),
}).refine(data => {
    if (data.status !== 'lead') {
        return data.accountNumber && data.accountNumber.length > 0;
    }
    return true;
}, {
    message: "Account number is required for Customers and Key Accounts.",
    path: ['accountNumber'],
});

const baseProductSchema = z.object({
    name: z.string().min(1, 'Product name is required.'),
    productCode: z.string().optional(),
    attribute1: z.string().optional(),
    attribute2: z.string().optional(),
    attribute3: z.string().optional(),
    attribute4: z.string().optional(),
});

export const createProductSchema = baseProductSchema;

export const editProductSchema = baseProductSchema.extend({
    id: z.string(),
});


export const contactSchema = z.object({
    accountNumber: z.string(),
    name: z.string().min(1, 'Name is required.'),
    position: z.string().optional(),
    email: z.string().email('Invalid email address.').optional().or(z.literal('')),
    phone: z.string().optional(),
    location: z.string().optional(),
    isMainContact: z.boolean().default(false),
});

// Base schema for account-product relationship without refinement
const accountProductBaseSchema = z.object({
    accountId: z.string(),
    productId: z.string().min(1, "A product must be selected."),
    notes: z.string().optional(),
    createdAt: z.any().optional(),
    type: z.enum(['purchasing', 'opportunity']),
    price: z.number().optional(),
});


// Refined schema for adding a product
export const addProductToAccountSchema = accountProductBaseSchema;


// Extend the base schema first, then apply the same refinement
export const editAccountProductSchema = accountProductBaseSchema.extend({
    id: z.string(),
});

export const deleteAccountProductSchema = z.object({
    id: z.string(),
});

export const editProductNoteSchema = z.object({
    noteId: z.string(),
    notes: z.string(),
});


export const shippingLocationSchema = z.object({
    relatedAccountId: z.string().min(1, 'An account must be selected.'),
    originalAccountId: z.string(),
});

export const callNoteSchema = z.object({
    accountId: z.string(),
    type: z.enum(['note', 'phone-call', 'in-person', 'initial-meeting'], {
        required_error: "You need to select a note type.",
    }),
    callDate: z.date({
        required_error: "A date for the call is required.",
    }),
    note: z.string().min(1, "Note content cannot be empty."),
});
