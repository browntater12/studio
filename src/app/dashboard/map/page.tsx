import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map as MapIcon } from 'lucide-react';

export default function MapPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <MapIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4">Map</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This page is ready for your map implementation.
            </p>
          </CardContent>
        </Card>
      </div>
  );
}
