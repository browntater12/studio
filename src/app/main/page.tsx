
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
const staticAccounts: Account[] = [
  {
    id: '1',
    name: 'John Deere-Ankeny', 
    accountNumber: '1042',
    address: '825 SW Irvinedale Dr, Ankeny, IA 50023',
    status: 'key-account',
    industry: 'Manufacturing',
    details: 'John Deere at this location manufactures their See & Spray technology.',
    companyId: 'static',
  },
  {
    id: '2',
    name: 'Pella Corporation',
    accountNumber: '1054',
    address: '102 Main St, Pella, IA 50219',
    status: 'customer',
    industry: 'Manufacturing',
    details: 'Pella Corporation is a leading manufacturer of windows and doors.',
    companyId: 'static',
  },
  {
    id: '3',
    name: 'CemenTech',
    accountNumber: '1246',
    address: '1700 N 14th St, Indianola, IA 50125',
    status: 'lead',
    industry: 'Manufacturing',
    details: 'CemenTech manufacturers cement trucks that mix the cement in the truck',
    companyId: 'static',
  },
  {
    id: '4',
    name: 'Heartland Co-op',
    accountNumber: '1405',
    address: '13733 University Ave, Clive, IA 50325',
    status: 'lead',
    industry: 'Agriculture',
    details: 'Supplier of raw materials to local farmers. Locations in Iowa and Nebraska.',
    companyId: 'static',
  },
  {
    id: '5',
    name: 'Newton Manufacturing Co',
    accountNumber: '1112',
    address: '1123 1st Ave E, Newton, IA 50208',
    status: 'customer',
    industry: 'Manufacturing',
    details: 'Manufactures promotional materials for companies in Iowa.',
    companyId: 'static',
  },
  {
    id: '6',
    name: 'Midwest Underground',
    accountNumber: '1001',
    address: '32nd St SW, 1104 32nd St SW, Bondurant, IA 50035',
    status: 'customer',
    industry: 'Manufacturing',
    details: 'Build, rent, and sell equipment for developing underground infrastructure.',
    companyId: 'static',
  },
  {
    id: '7',
    name: 'Innovative Injection',
    accountNumber: '1043',
    address: '2360 Grand Ave, West Des Moines, IA 50265',
    status: 'customer',
    industry: 'Manufacturing',
    details: 'Innovative Injection uses injection molding to manufacture new materials.',
    companyId: 'static',
  },
  {
    id: '8',
    name: 'Principal Financial',
    accountNumber: '1336',
    address: '711 High St, Des Moines, IA 50392',
    status: 'key-account',
    industry: 'Insurance',
    details: 'Principal Financial provides insurance services.',
    companyId: 'static',
  },
  {
    id: '9',
    name: 'Vermeer Corp.',
    accountNumber: '1302',
    address: '1210 E Vermeer Rd, Pella, IA 50219',
    status: 'customer',
    industry: 'Manufacturing',
    details: 'Vermeer manufactures industrial and agricultural equipment',
    companyId: 'static',
  }, 
  {
    id: '10',
    name: 'Caseys',
    accountNumber: '1003',
    address: '1 SE Convenience Blvd, Ankeny, IA 50021',
    status: 'lead',
    industry: 'Food',
    details: 'Caseys is a large gas station company with the best pizza.',
    companyId: 'static',
  }

];

const staticContacts: Contact[] = [
    // John Deere-Ankeny (1042)
    { id: 'c1', accountNumber: '1042', name: 'Sarah Johnson', position: 'Plant Manager', phone: '515-555-0101', email: 'sarah.j@jdankeny.com', location: 'Ankeny, IA', isMainContact: true, companyId: 'static' },
    { id: 'c2', accountNumber: '1042', name: 'Tom Clark', position: 'Head of Maintenance', phone: '515-555-0113', email: 'tom.c@jdankeny.com', location: 'Ankeny, IA', isMainContact: false, companyId: 'static' },
    // Pella Corporation (1054)
    { id: 'c3', accountNumber: '1054', name: 'Mike Williams', position: 'Operations Director', phone: '641-555-0102', email: 'mike.w@pella.com', location: 'Pella, IA', isMainContact: true, companyId: 'static' },
    { id: 'c4', accountNumber: '1054', name: 'Emily Brown', position: 'Purchasing Agent', phone: '641-555-0103', email: 'emily.b@pella.com', location: 'Pella, IA', isMainContact: false, companyId: 'static' },
    // CemenTech (1246)
    { id: 'c5', accountNumber: '1246', name: 'David Chen', position: 'Lead Engineer', phone: '515-555-0104', email: 'david.c@cementech.com', location: 'Indianola, IA', isMainContact: true, companyId: 'static' },
    // Heartland Co-op (1405)
    { id: 'c6', accountNumber: '1405', name: 'Maria Garcia', position: 'Regional Manager', phone: '515-555-0105', email: 'maria.g@heartland.com', location: 'Clive, IA', isMainContact: true, companyId: 'static' },
    { id: 'c13', accountNumber: '1405', name: 'Jeff Richardson', position: 'Safety Coordinator', phone: '515-555-0114', email: 'jeff.r@heartland.com', location: 'Des Moines, IA', isMainContact: false, companyId: 'static' },
    // Newton Manufacturing Co (1112)
    { id: 'c7', accountNumber: '1112', name: 'Tom Allen', position: 'CEO', phone: '641-555-0106', email: 'tom.a@newtonmfg.com', location: 'Newton, IA', isMainContact: true, companyId: 'static' },
    // Midwest Underground (1001)
    { id: 'c8', accountNumber: '1001', name: 'Robert King', position: 'Fleet Manager', phone: '515-555-0107', email: 'robert.k@midwestug.com', location: 'Bondurant, IA', isMainContact: true, companyId: 'static' },
    // Innovative Injection (1043)
    { id: 'c9', accountNumber: '1043', name: 'Jennifer White', position: 'Production Supervisor', phone: '515-555-0108', email: 'jennifer.w@innovativeinjection.com', location: 'West Des Moines, IA', isMainContact: false, companyId: 'static' },
    { id: 'c10', accountNumber: '1043', name: 'Chris Green', position: 'Owner', phone: '515-555-0109', email: 'chris.g@innovativeinjection.com', location: 'West Des Moines, IA', isMainContact: true, companyId: 'static' },
    // Principal Financial (1336)
    { id: 'c11', accountNumber: '1336', name: 'Patricia Hall', position: 'Facilities Manager', phone: '515-555-0110', email: 'patricia.h@principal.com', location: 'Des Moines, IA', isMainContact: true, companyId: 'static' },
    // Vermeer Corp. (1302)
    { id: 'c12', accountNumber: '1302', name: 'Mark Davis', position: 'Supply Chain Lead', phone: '641-555-0111', email: 'mark.d@vermeer.com', location: 'Pella, IA', isMainContact: true, companyId: 'static' },
    { id: 'c14', accountNumber: '1302', name: 'Laura Wilson', position: 'Environmental Health and Safety', phone: '641-555-0115', email: 'laura.w@vermeer.com', location: 'Pella, IA', isMainContact: false, companyId: 'static' },
    // Caseys (1003)
    { id: 'c15', accountNumber: '1003', name: 'Brian Miller', position: 'Head of Procurement', phone: '515-555-0112', email: 'brian.m@caseys.com', location: 'Ankeny, IA', isMainContact: true, companyId: 'static' },
];

const staticProducts: Product[] = [
    { id: 'p1', name: 'Formula 101', productCode: 'F101', companyId: 'static' },
    { id: 'p2', name: 'Cooling Tower Biocide', productCode: 'CTB-2', companyId: 'static' },
    { id: 'p3', name: 'Boiler Antiscalant', productCode: 'BAS-5', companyId: 'static' },
];

const staticAccountProducts: AccountProduct[] = [
    // John Deere
    { id: 'ap1', accountId: '1', productId: 'p1', notes: 'Main corporate account purchasing.', type: 'purchasing', price: 150.00, companyId: 'static' },
    { id: 'ap2', accountId: '1', productId: 'p2', notes: 'Considering for all cooling towers.', type: 'opportunity', price: 220.50, companyId: 'static' },
    // Pella
    { id: 'ap3', accountId: '2', productId: 'p3', notes: 'Quarterly bulk order.', type: 'purchasing', price: 550.00, companyId: 'static' },
    // CemenTech
    { id: 'ap4', accountId: '3', productId: 'p1', notes: 'Lead interested in Formula 101 for their new line.', type: 'opportunity', price: 160.00, companyId: 'static' },
    // Heartland Co-op
    { id: 'ap5', accountId: '4', productId: 'p2', notes: 'Interested in replacing their current biocide.', type: 'opportunity', price: 230.00, companyId: 'static' },
    // Newton Manufacturing
    { id: 'ap6', accountId: '5', productId: 'p1', notes: 'Small regular orders.', type: 'purchasing', price: 155.00, companyId: 'static' },
    { id: 'ap7', accountId: '5', productId: 'p3', notes: 'Used in their main boiler system.', type: 'purchasing', price: 560.00, companyId: 'static' },
    // Midwest Underground
    { id: 'ap8', accountId: '6', productId: 'p1', notes: 'Heavy duty cleaner for equipment.', type: 'purchasing', price: 175.00, companyId: 'static' },
    // Innovative Injection
    { id: 'ap9', accountId: '7', productId: 'p2', notes: 'For their molding machine cooling systems.', type: 'purchasing', price: 215.00, companyId: 'static' },
    { id: 'ap10', accountId: '7', productId: 'p3', notes: 'Trial for boiler efficiency.', type: 'opportunity', price: 570.00, companyId: 'static' },
    // Principal Financial
    { id: 'ap11', accountId: '8', productId: 'p2', notes: 'For the HVAC cooling towers in their main building.', type: 'purchasing', price: 225.00, companyId: 'static' },
    // Vermeer Corp.
    { id: 'ap12', accountId: '9', productId: 'p1', notes: 'Used on the factory floor.', type: 'purchasing', price: 145.00, companyId: 'static' },
    { id: 'ap13', accountId: '9', productId: 'p2', notes: 'Testing CTB-2 against competitor.', type: 'opportunity', price: 210.00, companyId: 'static' },
    { id: 'ap14', accountId: '9', productId: 'p3', notes: 'Used across multiple boilers in the facility.', type: 'purchasing', price: 540.00, companyId: 'static' },
    // Caseys
    { id: 'ap15', accountId: '10', productId: 'p1', notes: 'Potential for use as a kitchen degreaser in all locations.', type: 'opportunity', price: 130.00, companyId: 'static' },
];

const staticShippingLocations: ShippingLocation[] = [
    { id: 'sl1', originalAccountId: '2', relatedAccountId: '1', companyId: 'static' },
    { id: 'sl2', originalAccountId: '1', relatedAccountId: '9', companyId: 'static' },
    { id: 'sl3', originalAccountId: '4', relatedAccountId: '10', companyId: 'static' },
    { id: 'sl4', originalAccountId: '8', relatedAccountId: '7', companyId: 'static' },
    { id: 'sl5', originalAccountId: '6', relatedAccountId: '3', companyId: 'static' },
];

const staticCallNotes: CallNote[] = [
    { id: 'cn1', accountId: '1', callDate: Timestamp.fromDate(new Date('2024-04-10T10:00:00Z')), type: 'initial-meeting', note: 'Initial meeting with Sarah Johnson. Discussed See & Spray tech and potential for Formula 101 as a cleaner.', companyId: 'static' },
    { id: 'cn2', accountId: '1', callDate: Timestamp.fromDate(new Date('2024-05-21T14:30:00Z')), type: 'phone-call', note: 'Follow-up call with Tom Clark about the CTB-2 proposal for their cooling towers. He is reviewing it with his team.', companyId: 'static' },
    { id: 'cn3', accountId: '2', callDate: Timestamp.fromDate(new Date('2024-05-01T09:00:00Z')), type: 'in-person', note: 'Met with Mike Williams on site. Toured the window manufacturing line. Confirmed quarterly bulk order for BAS-5.', companyId: 'static' },
    { id: 'cn4', accountId: '2', callDate: Timestamp.fromDate(new Date('2024-06-15T11:00:00Z')), type: 'note', note: 'Emily Brown emailed asking for updated safety data sheets for BAS-5. Sent them over.', companyId: 'static' },
    { id: 'cn5', accountId: '3', callDate: Timestamp.fromDate(new Date('2024-06-20T13:00:00Z')), type: 'phone-call', note: 'Cold call with David Chen. He\'s interested in a sample of Formula 101 for their cement mixing trucks. Will follow up next week.', companyId: 'static' },
    { id: 'cn6', accountId: '4', callDate: Timestamp.fromDate(new Date('2024-05-30T16:00:00Z')), type: 'initial-meeting', note: 'Met Maria Garcia at a trade show. She mentioned they are unhappy with their current biocide supplier. Great opportunity for CTB-2.', companyId: 'static' },
    { id: 'cn7', accountId: '4', callDate: Timestamp.fromDate(new Date('2024-06-18T10:30:00Z')), type: 'phone-call', note: 'Called Maria to schedule a follow-up. Set a meeting for July 5th to discuss specifics.', companyId: 'static' },
    { id: 'cn8', accountId: '5', callDate: Timestamp.fromDate(new Date('2024-06-11T11:00:00Z')), type: 'note', note: 'Received re-order for Formula 101 from Newton Mfg. No issues reported.', companyId: 'static' },
    { id: 'cn9', accountId: '6', callDate: Timestamp.fromDate(new Date('2024-06-05T08:30:00Z')), type: 'in-person', note: 'On-site visit with Robert King. Demoed Formula 101 on some heavy equipment. He was very impressed with the performance.', companyId: 'static' },
    { id: 'cn10', accountId: '6', callDate: Timestamp.fromDate(new Date('2024-06-25T14:00:00Z')), type: 'phone-call', note: 'Robert called to increase their standard order of Formula 101 by 50%.', companyId: 'static' },
    { id: 'cn11', accountId: '7', callDate: Timestamp.fromDate(new Date('2024-05-15T15:00:00Z')), type: 'note', note: 'Chris Green mentioned they are starting a trial for BAS-5 for boiler efficiency. Will check back in a month.', companyId: 'static' },
    { id: 'cn12', accountId: '7', callDate: Timestamp.fromDate(new Date('2024-06-22T12:00:00Z')), type: 'in-person', note: 'Met with Jennifer White. The BAS-5 trial is going well, seeing positive results.', companyId: 'static' },
    { id: 'cn13', accountId: '8', callDate: Timestamp.fromDate(new Date('2024-06-28T09:30:00Z')), type: 'phone-call', note: 'Call with Patricia Hall to confirm the delivery schedule for their CTB-2 order for the downtown office HVAC.', companyId: 'static' },
    { id: 'cn14', accountId: '9', callDate: Timestamp.fromDate(new Date('2024-06-03T13:45:00Z')), type: 'in-person', note: 'Met with Mark Davis and Laura Wilson. Discussed the results of the CTB-2 test. They are moving forward with replacing their current product.', companyId: 'static' },
    { id: 'cn15', accountId: '9', callDate: Timestamp.fromDate(new Date('2024-06-19T11:20:00Z')), type: 'note', note: 'Received the first official PO from Vermeer for CTB-2.', companyId: 'static' },
    { id: 'cn16', accountId: '10', callDate: Timestamp.fromDate(new Date('2024-06-12T10:00:00Z')), type: 'initial-meeting', note: 'Initial discovery call with Brian Miller. He is interested in Formula 101 as a potential kitchen degreaser for all Casey\'s locations. Sent over pricing for a pilot program.', companyId: 'static' },
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
