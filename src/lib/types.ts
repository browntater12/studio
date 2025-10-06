import { DocumentReference, Timestamp } from 'firebase/firestore';

export type Contact = {
  id: string;
  accountNumber: string; // Added to link to account
  name: string;
  phone: string;
  email: string;
  location: string;
  isMainContact: boolean;
  avatarUrl?: string;
};

export type AccountProduct = {
  productId: string;
  notes: string;
  priceType?: 'spot' | 'bid';
  bidFrequency?: 'monthly' | 'quarterly' | 'yearly';
  lastBidPrice?: number;
  winningBidPrice?: number;
};

export type Account = {
  id: string;
  accountNumber?: string;
  name: string;
  industry?: string;
  status: 'lead' | 'customer';
  details: string;
  address?: string;
  // Contacts are no longer a subcollection, so they are not part of the Account type
  accountProducts?: AccountProduct[];
};

export type Product = {
  id: string;
  name: string;
  productNumber: string;
  volumes: ('pails' | 'drums' | 'totes' | 'bulk')[];
};

export type ProductVolume = 'pails' | 'drums' | 'totes' | 'bulk';
