
'use client';

import * as React from 'react';
import { type Account, type Contact, type Product, type AccountProduct, type ShippingLocation, type CallNote } from '@/lib/types';
import { APIProvider } from '@vis.gl/react-google-maps';
import { AccountsMap } from '@/components/map/accounts-map';
import { Loader2, Terminal, ArrowLeft, Package } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MapFilters } from '@/components/map/map-filters';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { PublicSidebar } from '@/components/public-sidebar';
import { PublicAccountHeader } from '@/components/public/public-account-header';
import { PublicAccountInfo } from '@/components/public/public-account-info';
import { PublicContactList } from '@/components/public/public-contact-list';
import { PublicProductList } from '@/components/public/public-product-list';
import { PublicShippingLocations } from '@/components/public/public-shipping-locations';
import { PublicCallNotes } from '@/components/public/public-call-notes';
import { Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Hardcoded data for the public landing page
export const staticAccounts: Account[] = [
  {
    id: '1',
    name: 'John Deere-Ankeny', 
    address: '825 SW Irvinedale Dr, Ankeny, IA 50023',
    status: 'key-account',
    industry: 'Manufacturing',
    details: 'John Deere at this location manufactures their See & Spray technology.',
    companyId: 'static',
    accountNumber: '1042',
  },
  {
    id: '2',
    name: 'Pella Corporation',
    address: '102 Main St, Pella, IA 50219',
    status: 'customer',
    industry: 'Manufacturing',
    details: 'Pella Corporation is a leading manufacturer of windows and doors.',
    companyId: 'static',
    accountNumber: '1054',
  },
  {
    id: '3',
    name: 'ChemenTech',
    address: '1700 N 14th St, Indianola, IA 50125',
    status: 'lead',
    industry: 'Manufacturing',
    details: 'Cementech manufacturers cement trucks that mix the cement in the truck',
    companyId: 'static',
    accountNumber: '1246',
  },
  {
    id: '4',
    name: 'Heartland Co-op',
    address: '13733 University Ave, Clive, IA 50325',
    status: 'lead',
    industry: 'Agriculture',
    details: 'Supplier of raw materials to local farmers. Locations in Iowa and Nebraska.',
    companyId: 'static',
    accountNumber: '1405',
  },
  {
    id: '5',
    name: 'Newton Manufacturing Co',
    address: '1123 1st Ave E, Newton, IA 50208',
    status: 'customer',
    industry: 'Manufacturing',
    details: 'Manufactures promotional materials for companies in Iowa.',
    companyId: 'static',
    accountNumber: '1112',
  },
  {
    id: '6',
    name: 'Midwest Underground',
    address: '32nd St SW, 1104 32nd St SW, Bondurant, IA 50035',
    status: 'customer',
    industry: 'Manufacturing',
    details: 'Build, rent, and sell equipment for developing underground infrastructure.',
    companyId: 'static',
    accountNumber: '1001',
  },
  {
    id: '7',
    name: 'Innovative Injection',
    address: '2360 Grand Ave, West Des Moines, IA 50265',
    status: 'customer',
    industry: 'Manufacturing',
    details: 'Innovative Injection uses injection molding to manufacture new materials.',
    companyId: 'static',
    accountNumber: '1043',
  },
  {
    id: '8',
    name: 'Principal Financial',
    address: '711 High St, Des Moines, IA 50392',
    status: 'key-account',
    industry: 'Insurance',
    details: 'Principal Financial provides insurance services.',
    companyId: 'static',
    accountNumber: '1336',
  },
  {
    id: '9',
    name: 'Vermeer Corp.',
    address: '1210 E Vermeer Rd, Pella, IA 50219',
    status: 'customer',
    industry: 'Manufacturing',
    details: 'Vermeer manufactures industrial and agricultural equipment',
    companyId: 'static',
    accountNumber: '1302',
  }, 
  {
    id: '10',
    name: 'Caseys',
    address: '1 SE Convenience Blvd, Ankeny, IA 50021',
    status: 'lead',
    industry: 'Food',
    details: 'Caseys is a large gas station company with the best pizza.',
    companyId: 'static',
    accountNumber: '1003',
  }

];

export const staticContacts: Contact[] = [
    {
        id: 'c1',
        accountNumber: 'GC-HQ',
        name: 'Jane Doe',
        position: 'CEO',
        phone: '123-456-7890',
        email: 'jane.doe@gchq.com',
        location: 'Woburn, MA',
        isMainContact: true,
        companyId: 'static',
    },
    {
        id: 'c2',
        accountNumber: 'GC-HQ',
        name: 'John Smith',
        position: 'CTO',
        phone: '123-456-7891',
        email: 'john.smith@gchq.com',
        location: 'Woburn, MA',
        isMainContact: false,
        companyId: 'static',
    },
    {
        id: 'c3',
        accountNumber: 'MM-001',
        name: 'Peter Jones',
        position: 'Plant Manager',
        phone: '402-555-1234',
        email: 'peter.jones@midwestmfg.com',
        location: 'Omaha, NE',
        isMainContact: true,
        companyId: 'static',
    }
];

export const staticProducts: Product[] = [
    { id: 'p1', name: 'Formula 101', productCode: 'F101', companyId: 'static' },
    { id: 'p2', name: 'Cooling Tower Biocide', productCode: 'CTB-2', companyId: 'static' },
    { id: 'p3', name: 'Boiler Antiscalant', productCode: 'BAS-5', companyId: 'static' },
];

export const staticAccountProducts: AccountProduct[] = [
    { id: 'ap1', accountId: '1', productId: 'p1', notes: 'Main corporate account purchasing.', type: 'purchasing', price: 150.00, companyId: 'static' },
    { id: 'ap2', accountId: '1', productId: 'p2', notes: 'Considering for all cooling towers.', type: 'opportunity', price: 220.50, companyId: 'static' },
    { id: 'ap3', accountId: '2', productId: 'p3', notes: 'Quarterly bulk order.', type: 'purchasing', price: 550.00, companyId: 'static' },
];

export const staticShippingLocations: ShippingLocation[] = [
    { id: 'sl1', originalAccountId: '2', relatedAccountId: '1', companyId: 'static' },
];

export const staticCallNotes: CallNote[] = [
    { id: 'cn1', accountId: '1', callDate: Timestamp.fromDate(new Date('2023-10-26T10:00:00Z')), type: 'initial-meeting', note: 'Initial meeting with Jane and John. Discussed their current water treatment challenges and our capabilities.', companyId: 'static' },
    { id: 'cn2', accountId: '1', callDate: Timestamp.fromDate(new Date('2023-11-15T14:30:00Z')), type: 'phone-call', note: 'Follow-up call with John about the CTB-2 proposal. He is reviewing it with his team.', companyId: 'static' },
];


function MapView({ accounts, filters, onAccountSelect }: { accounts: Account[], filters: any, onAccountSelect: (id: string) => void }) {
  const { statusFilter, setStatusFilter, industryFilter, setIndustryFilter, industries, isLoading } = filters;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

   const filteredAccounts = React.useMemo(() => {
    return accounts.filter(account => {
      const statusMatch = statusFilter === 'all' || account.status === statusFilter;
      const industryMatch = industryFilter === 'all' || account.industry === industryFilter;
      return statusMatch && industryMatch;
    });
  }, [accounts, statusFilter, industryFilter]);

  if (!apiKey) {
    return (
       <div className="flex h-screen w-full items-center justify-center p-4">
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Google Maps API Key is Missing</AlertTitle>
          <AlertDescription>
            This page requires a Google Maps API Key to display the map. Please add it to your environment variables.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  return (
    <div className="flex-1 flex flex-col h-full">
        <MapFilters 
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            industryFilter={industryFilter}
            setIndustryFilter={setIndustryFilter}
            industries={industries}
            isLoading={isLoading}
        />
        <div className="flex-1 min-h-0">
            {isLoading ? (
                <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <APIProvider apiKey={apiKey}>
                    <AccountsMap accounts={filteredAccounts || []} onAccountSelect={onAccountSelect} isPublic={true} />
                </APIProvider>
            )}
        </div>
    </div>
  )
}

function ProductView({ products }: { products: Product[] }) {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Products
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Product Code</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>{product.productCode}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

function AccountDetailView({ account, onBack }: { account: Account, onBack: () => void }) {
    const accountContacts = staticContacts.filter(c => c.accountNumber === account.accountNumber);
    const accountProducts = staticAccountProducts.filter(ap => ap.accountId === account.id);
    const shippingLocations = staticShippingLocations.filter(sl => sl.originalAccountId === account.id);
    const callNotes = staticCallNotes.filter(cn => cn.accountId === account.id);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto h-full">
            <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            <PublicAccountHeader account={account} />
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <PublicContactList account={account} contacts={accountContacts || []} />
                    <PublicProductList
                        accountProducts={accountProducts}
                        allProducts={staticProducts}
                    />
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <PublicAccountInfo account={account} />
                    <PublicShippingLocations locations={shippingLocations} allAccounts={staticAccounts} />
                    <PublicCallNotes notes={callNotes} />
                </div>
            </div>
        </div>
    )
}

type View = 'map' | 'products' | 'account';

export default function MainPage() {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [industryFilter, setIndustryFilter] = React.useState('all');
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);
  const [currentView, setCurrentView] = React.useState<'map' | 'products'>('map');

  const accounts = staticAccounts;
  const isLoading = false;

  const industries = React.useMemo(() => {
    const allIndustries = accounts.map(acc => acc.industry).filter(Boolean) as string[];
    return [...new Set(allIndustries)].sort();
  }, [accounts]);

  const selectedAccount = selectedAccountId ? accounts.find(acc => acc.id === selectedAccountId) : null;
  
  const handleAccountSelect = (id: string) => {
    setSelectedAccountId(id);
  }

  const handleBackToMapView = () => {
    setSelectedAccountId(null);
  }

  const handleNavigation = (view: 'map' | 'products') => {
      setSelectedAccountId(null);
      setCurrentView(view);
  }

  const renderContent = () => {
      if (selectedAccountId && selectedAccount) {
          return <AccountDetailView account={selectedAccount} onBack={handleBackToMapView} />
      }

      switch (currentView) {
          case 'map':
              return <MapView 
                accounts={accounts}
                filters={{ statusFilter, setStatusFilter, industryFilter, setIndustryFilter, industries, isLoading }}
                onAccountSelect={handleAccountSelect}
             />;
          case 'products':
              return <ProductView products={staticProducts} />;
          default:
              return null;
      }
  }

  return (
    <SidebarProvider>
      <PublicSidebar 
        accounts={accounts} 
        onAccountSelect={handleAccountSelect} 
        onNavigate={handleNavigation}
        currentView={currentView}
      />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-2 flex-1">
              <Logo className="h-8 w-8 text-primary" />
              <h1 className="text-lg font-semibold">Territory Manager</h1>
            </div>
            <Button asChild>
              <a href="/login">Sign In</a>
            </Button>
        </header>
        <main className="flex-1 flex flex-col h-[calc(100vh-3.5rem)]">
          {renderContent()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
