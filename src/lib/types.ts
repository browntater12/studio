import { DocumentReference, Timestamp } from 'firebase/firestore';

export type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  isMainContact: boolean;
  avatarUrl?: string; // Made optional
};

export type AccountProduct = {
  productId: string;
  notes: string;
};

export type Account = {
  id: string;
  accountNumber?: string;
  name: string;
  industry?: string;
  status: 'lead' | 'customer';
  details: string;
  address?: string;
  // These are now fetched from subcollections
  contacts?: Contact[];
  accountProducts?: AccountProduct[];
};

export type Product = {
  id: string;
  name: string;
  productNumber: string;
  volumes: ('pails' | 'drums' | 'totes' | 'bulk')[];
};

export type ProductVolume = 'pails' | 'drums' | 'totes' | 'bulk';
