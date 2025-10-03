export type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  isMainContact: boolean;
  avatarUrl: string;
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
  contacts: Contact[];
  accountProducts: AccountProduct[];
  address?: string;
};

export type Product = {
  id: string;
  name: string;
  productNumber: string;
  volumes: ('pails' | 'drums' | 'totes' | 'bulk')[];
};

export type ProductVolume = 'pails' | 'drums' | 'totes' | 'bulk';
