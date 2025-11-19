import { DocumentReference, Timestamp } from 'firebase/firestore';

export type UserProfile = {
  id: string;
  displayName?: string;
  email?: string;
  companyId: string;
};

export type Contact = {
  id: string;
  accountNumber: string;
  name: string;
  position?: string;
  phone?: string;
  email?: string;
  location?: string;
  isMainContact: boolean;
  avatarUrl?: string;
  companyId: string;
};

export type AccountProduct = {
  id?: string;
  accountId: string;
  productId: string;
  notes: string;
  createdAt?: Timestamp;
  type: 'purchasing' | 'opportunity';
  price?: number;
  companyId: string;
};

export type Account = {
  id: string;
  accountNumber?: string;
  name: string;
  industry?: string;
  status: 'lead' | 'customer' | 'key-account' | 'supplier';
  details: string;
  address?: string;
  companyId: string;
  // Contacts are no longer a subcollection, so they are not part of the Account type
  accountProducts?: AccountProduct[];
};

export type Product = {
  id: string;
  name: string;
  productCode: string;
  attribute1?: string;
  attribute2?: string;
  attribute3?: string;
  attribute4?: string;
  companyId: string;
};

export type ProductVolume = 'pails' | 'drums' | 'totes' | 'bulk';

export type ShippingLocation = {
  id: string;
  originalAccountId: string;
  relatedAccountId: string;
  companyId: string;
};

export type CallNoteType = 'note' | 'phone-call' | 'in-person' | 'initial-meeting';

export type CallNote = {
  id: string;
  accountId: string;
  callDate: Timestamp;
  note: string;
  type: CallNoteType;
  companyId: string;
};

export type ProductUsage = {
  accountName: string;
  accountId: string;
  notes: string;
};
