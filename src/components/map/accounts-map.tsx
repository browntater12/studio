'use client';

import * as React from 'react';
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { type Account } from '@/lib/types';
import { Building2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

const geocodeCache = new Map<string, google.maps.LatLngLiteral>();

function AccountMarker({ account }: { account: Account }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [position, setPosition] = React.useState<google.maps.LatLngLiteral | null>(null);
  const [infowindowOpen, setInfowindowOpen] = React.useState(false);

  React.useEffect(() => {
    if (!account.address) return;

    if (geocodeCache.has(account.address)) {
        setPosition(geocodeCache.get(account.address)!);
        return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: account.address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const pos = { lat: location.lat(), lng: location.lng() };
        geocodeCache.set(account.address!, pos);
        setPosition(pos);
      } else {
        console.error(`Geocode was not successful for the following reason: ${status}`);
      }
    });
  }, [account.address]);

  if (!position) return null;

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        onClick={() => setInfowindowOpen(true)}
        position={position}
        title={account.name}
      >
        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
            <Building2 size={14} />
        </div>
      </AdvancedMarker>
      {infowindowOpen && (
        <InfoWindow
          anchor={marker}
          maxWidth={200}
          onCloseClick={() => setInfowindowOpen(false)}
        >
          <div className="p-2 space-y-2">
            <h3 className="font-semibold">{account.name}</h3>
            <p className="text-sm text-muted-foreground">{account.address}</p>
            <Button asChild size="sm" className="w-full">
                <Link href={`/dashboard/account/${account.id}`}>View Account</Link>
            </Button>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function AccountsMap({ accounts }: { accounts: Account[] }) {
  const accountsWithAddress = accounts.filter(account => account.address);

  return (
    <Map
      mapId="sales-territory-map"
      defaultCenter={{ lat: 41.2565, lng: -95.9345 }} // Default to Omaha, NE
      defaultZoom={6}
      gestureHandling={'greedy'}
      disableDefaultUI={true}
    >
      {accountsWithAddress.map(account => (
        <AccountMarker key={account.id} account={account} />
      ))}
    </Map>
  );
}
