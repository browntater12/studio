'use client';

import * as React from 'react';
import {
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
  Pin,
} from '@vis.gl/react-google-maps';
import { type Account } from '@/lib/types';
import { Building2, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

const geocodeCache = new Map<string, google.maps.LatLngLiteral>();

function CurrentLocationMarker() {
    const [markerRef, marker] = useAdvancedMarkerRef();
    const [position, setPosition] = React.useState<google.maps.LatLngLiteral | null>(null);
    const [infowindowOpen, setInfowindowOpen] = React.useState(true);

    React.useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position: GeolocationPosition) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setPosition(pos);
                },
                (error) => {
                    console.error("Error getting user location:", error.message);
                }
            );
        }
    }, []);

    if (!position) return null;

    return (
        <>
            <AdvancedMarker
                ref={markerRef}
                position={position}
                onClick={() => setInfowindowOpen(true)}
                title={"Your Location"}
            >
                <div className="relative">
                    <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                </div>
            </AdvancedMarker>
             {infowindowOpen && (
                <InfoWindow
                    anchor={marker}
                    onCloseClick={() => setInfowindowOpen(false)}
                >
                    <div className="p-1 font-semibold">Your Location</div>
                </InfoWindow>
            )}
        </>
    );
}


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
        <div
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center',
            {
              'bg-yellow-500': account.status === 'lead',
              'bg-purple-500': account.status === 'key-account',
              'bg-primary text-primary-foreground': account.status === 'customer',
            }
          )}
        >
          <Building2 size={14} className={cn(
            (account.status === 'lead' || account.status === 'key-account') ? 'text-white' : ''
          )}/>
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
    <GoogleMap
      mapId="sales-territory-map"
      defaultCenter={{ lat: 41.2565, lng: -95.9345 }} // Default to Omaha, NE
      defaultZoom={6}
      gestureHandling={'greedy'}
      disableDefaultUI={true}
    >
      <CurrentLocationMarker />
      {accountsWithAddress.map(account => (
        <AccountMarker key={account.id} account={account} />
      ))}
    </GoogleMap>
  );
}
