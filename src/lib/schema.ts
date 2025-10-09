import { z } from 'zod';

export const addAccountSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  details: z.string().optional(),
  contacts: z.array(z.string()).optional(),
  accountProducts: z.array(z.string()).optional(),
});

export const addProductSchema = z.object({
    name: z.string().min(1, 'Name is required.'),
    productNumber: z.string().min(1, 'Product number is required.'),
    volumes: z.array(z.string()).refine(value => value.some(item => item), {
        message: "You must select at least one volume.",
    }),
});

export const editProductSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Name is required.'),
    productNumber: z.string().min(1, 'Product number is required.'),
    volumes: z.array(z.string()).refine(value => value.some(item => item), {
        message: "You must select at least one volume.",
    }),
});

export const deleteProductSchema = z.object({
  id: z.string(),
});

export const contactSchema = z.object({
    accountNumber: z.string(),
    name: z.string().min(1, 'Name is required.'),
    email: z.string().email('Invalid email address.').min(1, 'Email is required.'),
    phone: z.string().min(1, 'Phone is required'),
    location: z.string().min(1, 'Location is required'),
    isMainContact: z.boolean().default(false),
});

export const deleteContactSchema = z.object({
  id: z.string(),
});

export const addProductToAccountSchema = z.object({
    accountId: z.string(),
    productId: z.string().min(1, 'Please select a product.'),
    notes: z.string(),
    priceType: z.enum(['spot', 'bid']).optional(),
    bidFrequency: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
    lastBidPrice: z.number().optional(),
    winningBidPrice: z.number().optional(),
    priceDetails: z.object({
        type: z.enum(['quote', 'last_paid']),
        price: z.number().optional(),
    }).optional(),
    createdAt: z.date().optional(),
}).refine(data => {
    if (data.priceType === 'bid' && !data.bidFrequency) {
        return false;
    }
    return true;
}, {
    message: 'Bid frequency is required when price type is Bid.',
    path: ['bidFrequency'],
});

export const editProductNoteSchema = z.object({
    noteId: z.string(),
    notes: z.string().min(1, "Cannot be empty."),
});
