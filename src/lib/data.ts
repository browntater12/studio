import type { Account, Product, Contact, AccountProduct } from './types';
import { PlaceHolderImages } from './placeholder-images';

// In-memory database
let accounts: Account[] = [
  {
    id: 'acc_1',
    accountNumber: 'CUST-001',
    name: 'Innovate Corp',
    industry: 'Technology',
    status: 'customer',
    details: 'Long-standing customer, primarily uses our bulk solvent solutions. Exploring expansion into specialty chemicals.',
    contacts: [
      { id: 'con_1', name: 'Alice Johnson', phone: '123-456-7890', email: 'alice.j@innovate.com', location: 'New York, NY', isMainContact: true, avatarUrl: PlaceHolderImages[0].imageUrl },
      { id: 'con_2', name: 'Bob Williams', phone: '123-456-7891', email: 'bob.w@innovate.com', location: 'New York, NY', isMainContact: false, avatarUrl: PlaceHolderImages[1].imageUrl },
    ],
    accountProducts: [
      { productId: 'prod_1', notes: 'Quarterly order of 5,000 gallons. Consistent usage.' },
      { productId: 'prod_3', notes: 'Trialing for new manufacturing line. Potential for large volume increase.' },
    ],
  },
  {
    id: 'acc_2',
    accountNumber: 'CUST-002',
    name: 'Apex Manufacturing',
    industry: 'Industrial',
    status: 'customer',
    details: 'Heavy user of drummed products. Consistent and reliable partner.',
    contacts: [
      { id: 'con_3', name: 'Charlie Brown', phone: '234-567-8901', email: 'charlie.b@apex.com', location: 'Chicago, IL', isMainContact: true, avatarUrl: PlaceHolderImages[2].imageUrl },
    ],
    accountProducts: [
      { productId: 'prod_2', notes: 'Standing order of 20 drums per month.' },
    ],
  },
  {
    id: 'acc_3',
    accountNumber: 'LEAD-001',
    name: 'Quantum Solutions',
    industry: 'Biotechnology',
    status: 'lead',
    address: '456 Innovation Drive, Boston, MA',
    details: 'New lead from recent trade show. Interested in high-purity solvents in pails.',
    contacts: [
        { id: 'con_4', name: 'Diana Prince', phone: '345-678-9012', email: 'diana.p@quantum.com', location: 'Boston, MA', isMainContact: true, avatarUrl: PlaceHolderImages[3].imageUrl },
    ],
    accountProducts: [],
  },
];

let products: Product[] = [
  { id: 'prod_1', name: 'Isopropyl Alcohol 99%', productNumber: 'CHEM-001A', volumes: ['pails', 'drums', 'totes', 'bulk'] },
  { id: 'prod_2', name: 'Acetone', productNumber: 'CHEM-002B', volumes: ['pails', 'drums'] },
  { id: 'prod_3', name: 'Methanol', productNumber: 'CHEM-003C', volumes: ['pails', 'drums', 'totes', 'bulk'] },
  { id: 'prod_4', name: 'Toluene', productNumber: 'CHEM-004D', volumes: ['drums', 'totes'] },
];

// Data access functions
export async function getAccounts(): Promise<Account[]> {
  return accounts;
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  return accounts.find(acc => acc.id === id);
}

export async function getProducts(): Promise<Product[]> {
  return products;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return products.find(p => p.id === id);
}

export async function addAccount(data: Omit<Account, 'id' | 'contacts' | 'accountProducts'>): Promise<Account> {
  const highestId = accounts.reduce((maxId, acc) => {
    const currentId = parseInt(acc.id.split('_')[1]);
    return currentId > maxId ? currentId : maxId;
  }, 0);

  const newAccount: Account = {
    ...data,
    id: `acc_${highestId + 1}`,
    contacts: [],
    accountProducts: [],
  };
  accounts.push(newAccount);
  return newAccount;
}

export async function updateAccount(id: string, data: Omit<Account, 'id' | 'contacts' | 'accountProducts'>): Promise<Account> {
    const accountIndex = accounts.findIndex(acc => acc.id === id);
    if (accountIndex === -1) {
        throw new Error('Account not found');
    }
    const account = accounts[accountIndex];
    const updatedAccount = {
        ...account,
        ...data
    };
    accounts[accountIndex] = updatedAccount;
    return updatedAccount;
}

export async function addContactToAccount(accountId: string, contactData: Omit<Contact, 'id' | 'avatarUrl'>): Promise<Contact> {
  const account = await getAccountById(accountId);
  if (!account) throw new Error('Account not found');

  if (contactData.isMainContact) {
    account.contacts.forEach(c => c.isMainContact = false);
  }
  
  const newContact: Contact = {
    ...contactData,
    id: `con_${Date.now()}`,
    avatarUrl: PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)].imageUrl,
  };

  account.contacts.push(newContact);
  return newContact;
}

export async function updateContact(accountId: string, contactData: Omit<Contact, 'avatarUrl'> & { contactId: string }): Promise<Contact> {
    const account = await getAccountById(accountId);
    if (!account) throw new Error('Account not found');

    const contactIndex = account.contacts.findIndex(c => c.id === contactData.contactId);
    if (contactIndex === -1) throw new Error('Contact not found');

    if (contactData.isMainContact) {
        account.contacts.forEach(c => {
            if (c.id !== contactData.contactId) {
                c.isMainContact = false;
            }
        });
    }

    const updatedContact = { ...account.contacts[contactIndex], ...contactData };
    account.contacts[contactIndex] = updatedContact;
    
    return updatedContact;
}

export async function addProductToAccount(accountId: string, productData: Omit<AccountProduct, ''>): Promise<AccountProduct> {
    const account = await getAccountById(accountId);
    if (!account) throw new Error('Account not found');

    const existingProduct = account.accountProducts.find(p => p.productId === productData.productId);
    if (existingProduct) {
        throw new Error('Product already exists for this account. You can edit the notes from the product list.');
    }

    account.accountProducts.push(productData);
    return productData;
}

export async function updateAccountProductNote(accountId: string, productId: string, notes: string): Promise<AccountProduct> {
    const account = await getAccountById(accountId);
    if (!account) throw new Error('Account not found');

    const accountProduct = account.accountProducts.find(p => p.productId === productId);
    if (!accountProduct) throw new Error('Product not found for this account.');

    accountProduct.notes = notes;
    return accountProduct;
}
