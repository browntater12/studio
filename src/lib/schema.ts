import { z } from 'zod';

const baseAccountSchema = z.object({
  name: z.string().min(2, { message: 'Account name must be at least 2 characters.' }),
  accountNumber: z.string().nullable().optional().transform(val => val === '' || val === null ? undefined : val),
  industry: z.string().nullable().optional().transform(val => val === '' || val === null ? undefined : val),
  status: z.enum(['lead', 'customer'], { required_error: 'Status is required.' }),
  details: z.string().nullable().optional().transform(val => val === '' || val === null ? undefined : val),
  address: z.string().nullable().optional().transform(val => val === '' || val === null ? undefined : val),
});

export const addAccountSchema = baseAccountSchema.superRefine((data, ctx) => {
  if (data.status === 'lead' && (!data.address || data.address.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['address'],
      message: 'Address is required for leads.',
    });
  }
});

export const editAccountSchema = baseAccountSchema.extend({
    id: z.string(),
}).superRefine((data, ctx) => {
    if (data.status === 'lead' && (!data.address || data.address.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['address'],
            message: 'Address is required for leads.',
        });
    }
});

export const addContactSchema = z.object({
  accountId: z.string(),
  name: z.string().min(2, { message: "Contact name must be at least 2 characters." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  email: z.string().email({ message: "Invalid email address." }),
  location: z.string().min(2, { message: "Location is required." }),
  isMainContact: z.boolean().default(false),
});

export const editContactSchema = addContactSchema.extend({
  contactId: z.string(),
});

export const addProductToAccountSchema = z.object({
  accountId: z.string({ required_error: "Please select a product." }),
  productId: z.string({ required_error: "Please select a product." }),
  notes: z.string().min(3, { message: "Notes must be at least 3 characters." }),
});

export const editProductNoteSchema = z.object({
  accountId: z.string(),
  productId: z.string(),
  notes: z.string().min(3, { message: "Notes must be at least 3 characters." }),
});

export const createProductSchema = z.object({
    name: z.string().min(3, { message: 'Product name must be at least 3 characters.' }),
    productNumber: z.string().min(3, { message: 'Product number must be at least 3 characters.' }),
    volumes: z.array(z.enum(['pails', 'drums', 'totes', 'bulk'])).min(1, { message: 'At least one volume must be selected.' }),
});

export const editProductSchema = createProductSchema.extend({
  id: z.string(),
});

export const deleteProductSchema = z.object({
    id: z.string(),
});