import { DocumentReference, Timestamp } from 'firebase/firestore';

export type Contact = {
  id: string;
  accountNumber: string; // Added to link to account
  name: string;
  position?: string;
  phone: string;
  email: string;
  location: string;
  isMainContact: boolean;
  avatarUrl?: string;
};

export type AccountProduct = {
  id?: string;
  accountId: string;
  productId: string;
  notes: string;
  priceType?: 'spot' | 'bid';
  spotFrequency?: 'monthly' | 'quarterly' | 'annually';
  spotQuantity?: number;
  bidFrequency?: 'monthly' | 'quarterly' | 'yearly';
  lastBidPrice?: number;
  winningBidPrice?: number;
  priceUnit?: 'lb' | 'gal' | 'kg';
  priceDetails?: {
    type: 'quote' | 'last_paid';
    price?: number;
  };
  createdAt?: Timestamp;
};

export type Account = {
  id: string;
  accountNumber?: string;
  name: string;
  industry?: string;
  status: 'lead' | 'customer' | 'key-account' | 'supplier';
  details: string;
  address?: string;
  // Contacts are no longer a subcollection, so they are not part of the Account type
  accountProducts?: AccountProduct[];
};

export type Product = {
  id: string;
  name: string;
  productCode: string;
  size: string;
  volume?: number;
  volumeUnit?: 'lb' | 'gal' | 'kg';
};

export type ProductVolume = 'pails' | 'drums' | 'totes' | 'bulk';

export type ShippingLocation = {
  id: string;
  accountId: string;
  name: string;
  address: string;
};

export type CallNoteType = 'note' | 'phone-call' | 'in-person' | 'initial-meeting';

export type CallNote = {
  id: string;
  accountId: string;
  callDate: Timestamp;
  note: string;
  type: CallNoteType;
};

export type ProductUsage = {
  accountName: string;
  accountId: string;
  notes: string;
};

    