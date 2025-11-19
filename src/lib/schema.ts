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

export const createProductSchema = z.object({
    name: z.string().min(1, 'Name is required.'),
    productNumber: z.string().optional(),
    notes: z.string().optional(),
    industries: z.array(z.string()).refine(value => value.length > 0, {
        message: "You must select at least one industry.",
    }),
});

export const editProductSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Name is required.'),
    productNumber: z.string().optional(),
    notes: z.string().optional(),
    industries: z.array(z.string()).refine(value => value.length > 0, {
        message: "You must select at least one industry.",
    }),
});

const baseSubProductSchema = z.object({
    baseProductId: z.string(),
    name: z.string().min(1, 'Product name is required.'),
    description: z.string().optional(),
    productCode: z.string().min(1, 'Product code is required.'),
    size: z.enum(['bags', 'pails', 'drums', 'totes', 'bulk'], {
        required_error: "You need to select a product size.",
    }),
    volume: z.number().optional(),
    volumeUnit: z.enum(['lb', 'gal', 'kg']).optional(),
});

export const subProductSchema = baseSubProductSchema.refine(data => {
    // If volume is provided, volumeUnit must also be provided.
    if (data.volume !== undefined && data.volume !== null && !data.volumeUnit) {
      return false;
    }
    return true;
  }, {
    message: "Unit is required when volume is provided.",
    path: ['volumeUnit'],
  });

export const editSubProductSchema = baseSubProductSchema.extend({
    id: z.string(),
}).refine(data => {
    // If volume is provided, volumeUnit must also be provided.
    if (data.volume !== undefined && data.volume !== null && !data.volumeUnit) {
      return false;
    }
    return true;
  }, {
    message: "Unit is required when volume is provided.",
    path: ['volumeUnit'],
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
    productId: z.string().min(1, 'Please select a product.').optional(),
    subProductId: z.string().optional(),
    notes: z.string().optional(),
    priceType: z.enum(['spot', 'bid']).optional(),
    spotFrequency: z.enum(['daily', 'monthly', 'annually']).optional(),
    bidFrequency: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
    lastBidPrice: z.number().optional(),
    winningBidPrice: z.number().optional(),
    priceDetails: z.object({
        type: z.enum(['quote', 'last_paid']),
        price: z.number().optional(),
    }).optional(),
    createdAt: z.any().optional(),
    // Fields for Product Opportunity
    opportunityName: z.string().optional(),
    estimatedVolumes: z.array(z.string()).optional(),
    competition: z.string().optional(),
    isOpportunity: z.boolean().default(false).optional(),
});


// Refined schema for adding a product
export const addProductToAccountSchema = accountProductBaseSchema.refine(data => {
    if (data.isOpportunity) {
        return data.opportunityName && data.opportunityName.length > 0;
    }
    return data.productId && data.productId.length > 0;
}, {
    message: 'Product Name is required for an opportunity.',
    path: ['opportunityName'],
}).refine(data => {
    if (data.isOpportunity) {
        return true; // No other validation needed for opportunities
    }
    if (data.priceType === 'bid' && !data.bidFrequency) {
        return false;
    }
    return true;
}, {
    message: 'Bid frequency is required when price type is Bid for an existing product.',
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

export const deleteAccountProductSchema = z.object({
    id: z.string(),
});

export const editProductNoteSchema = z.object({
    noteId: z.string(),
    notes: z.string(),
});


export const shippingLocationSchema = z.object({
    accountId: z.string().min(1, 'Please select an account.'),
    name: z.string().min(1, 'Location name is required.'),
    address: z.string().min(1, 'Address is required.'),
    formType: z.enum(['new', 'other']).default('other').optional(),
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
