'use client';

import * as React from 'react';
import {
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
  useMap,
} from '@vis.gl/react-google-maps';
import { type Account } from '@/lib/types';
import { Building2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

const geocodeCache = new Map<string, google.maps.LatLngLiteral>();

function CurrentLocationMarker({ onPositionChange }: { onPositionChange: (pos: google.maps.LatLngLiteral) => void }) {
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
                    onPositionChange(pos);
                },
                (error) => {
                    console.error("Error getting user location:", error.message);
                }
            );
        }
    }, [onPositionChange]);

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
                    <div className="p-1 font-semibold text-black">Your Location</div>
                </InfoWindow>
            )}
        </>
    );
}


function AccountMarker({ account, isPublic, onAccountSelect, onPositionChange }: { account: Account, isPublic?: boolean, onAccountSelect?: (id: string) => void, onPositionChange: (pos: google.maps.LatLngLiteral) => void; }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [position, setPosition] = React.useState<google.maps.LatLngLiteral | null>(null);
  const [infowindowOpen, setInfowindowOpen] = React.useState(false);

  React.useEffect(() => {
    if (!account.address) return;

    const processGeocode = (pos: google.maps.LatLngLiteral) => {
        setPosition(pos);
        onPositionChange(pos);
    }

    if (geocodeCache.has(account.address)) {
        processGeocode(geocodeCache.get(account.address)!);
        return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: account.address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const pos = { lat: location.lat(), lng: location.lng() };
        geocodeCache.set(account.address!, pos);
        processGeocode(pos);
      } else {
        console.error(`Geocode was not successful for the following reason: ${status}`);
      }
    });
  }, [account.address, onPositionChange]);

  const handleGetDirections = () => {
    if (account.address) {
      const encodedAddress = encodeURIComponent(account.address);
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
      window.open(url, '_blank');
    }
  }

  const handleViewAccount = () => {
    if (onAccountSelect) {
      onAccountSelect(account.id);
      setInfowindowOpen(false);
    }
  }

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
              'bg-primary': account.status === 'customer',
              'bg-cyan-500': account.status === 'supplier',
            }
          )}
        >
          <Building2 size={14} className="text-white"/>
        </div>
      </AdvancedMarker>
      {infowindowOpen && (
        <InfoWindow
          anchor={marker}
          maxWidth={200}
          onCloseClick={() => setInfowindowOpen(false)}
        >
          <div className="p-2 space-y-2">
            <h3 className="font-semibold text-black">{account.name}</h3>
            <p className="text-sm text-muted-foreground">{account.address}</p>
            {isPublic ? (
                 <Button size="sm" className="w-full" onClick={handleViewAccount}>View Account</Button>
            ) : (
                <Button asChild size="sm" className="w-full">
                    <Link href={`/dashboard/account/${account.id}`}>View Account</Link>
                </Button>
            )}
            <Button variant="outline" size="sm" className="w-full" onClick={handleGetDirections}>
                Get Directions
            </Button>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function Map({ children }: { children: React.ReactNode }) {
    const map = useMap();
    const [positions, setPositions] = React.useState<google.maps.LatLngLiteral[]>([]);

    const handlePositionChange = React.useCallback((pos: google.maps.LatLngLiteral) => {
        setPositions(prev => [...prev, pos]);
    }, []);

    React.useEffect(() => {
        if (!map || positions.length === 0) return;

        const bounds = new window.google.maps.LatLngBounds();
        positions.forEach(pos => bounds.extend(pos));
        
        if (positions.length > 1) {
            map.fitBounds(bounds, 50); // 50px padding
        } else if (positions.length === 1) {
            map.setCenter(bounds.getCenter());
            map.setZoom(10);
        }
    }, [map, positions]);
    
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            // @ts-ignore
            return React.cloneElement(child, { onPositionChange: handlePositionChange });
        }
        return child;
    });

    return <>{childrenWithProps}</>;
}

export function AccountsMap({ accounts, isPublic, onAccountSelect }: { accounts: Account[], isPublic?: boolean, onAccountSelect?: (id: string) => void }) {
  const accountsWithAddress = accounts.filter(account => account.address);
  const defaultCenter = { lat: 41.2565, lng: -95.9345 }; // Omaha, NE

  return (
    <GoogleMap
      mapId="sales-territory-map"
      defaultCenter={defaultCenter}
      defaultZoom={6}
      gestureHandling={'greedy'}
      disableDefaultUI={true}
    >
      <Map>
        <CurrentLocationMarker />
        {accountsWithAddress.map(account => (
            <AccountMarker 
                key={account.id} 
                account={account} 
                isPublic={isPublic} 
                onAccountSelect={onAccountSelect} 
            />
        ))}
      </Map>
    </GoogleMap>
  );
}
