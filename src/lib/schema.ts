
import { z } from 'zod';

export const addAccountSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  accountNumber: z.string().optional(),
  industry: z.string().min(1, 'Industry is required.'),
  status: z.enum(['lead', 'customer', 'key-account']),
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

export const createProductSchema = z.object({
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

export const contactSchema = z.object({
    accountNumber: z.string(),
    name: z.string().min(1, 'Name is required.'),
    position: z.string().optional(),
    email: z.string().email('Invalid email address.').min(1, 'Email is required.'),
    phone: z.string().min(1, 'Phone is required'),
    location: z.string().min(1, 'Location is required'),
    isMainContact: z.boolean().default(false),
});

// Base schema for account-product relationship without refinement
const accountProductBaseSchema = z.object({
    accountId: z.string(),
    productId: z.string().min(1, 'Please select a product.'),
    notes: z.string().optional(),
    priceType: z.enum(['spot', 'bid']).optional(),
    bidFrequency: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
    lastBidPrice: z.number().optional(),
    winningBidPrice: z.number().optional(),
    priceDetails: z.object({
        type: z.enum(['quote', 'last_paid']),
        price: z.number().optional(),
    }).optional(),
    createdAt: z.any().optional(),
});


// Refined schema for adding a product
export const addProductToAccountSchema = accountProductBaseSchema.refine(data => {
    if (data.priceType === 'bid' && !data.bidFrequency) {
        return false;
    }
    return true;
}, {
    message: 'Bid frequency is required when price type is Bid.',
    path: ['bidFrequency'],
});

// Extend the base schema first, then apply the same refinement
export const editAccountProductSchema = accountProductBaseSchema.extend({
    id: z.string(),
}).refine(data => {
    if (data.priceType === 'bid' && !data.bidFrequency) {
        return false;
    }
    return true;
}, {
    message: 'Bid frequency is required when price type is Bid.',
    path: ['bidFrequency'],
});

export const shippingLocationSchema = z.object({
    accountId: z.string(),
    name: z.string().min(1, 'Location name is required.'),
    address: z.string().min(1, 'Address is required.'),
});
