import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import Image from 'next/image';

export default function MainPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-lg font-semibold">Territory Manager</h1>
        </div>
        <Button asChild>
          <Link href="/login">Sign In</Link>
        </Button>
      </header>
      <main className="flex-1">
        <section className="relative h-[60vh] w-full">
            <Image
                src="https://picsum.photos/seed/landsape/1200/800"
                alt="Sales map background"
                fill
                className="object-cover"
                data-ai-hint="map landscape"
            />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center text-white p-4">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                    Visualize Your Sales Landscape
                </h2>
                <p className="mt-4 max-w-2xl text-lg sm:text-xl">
                    The ultimate tool for territory management. See your accounts, contacts, and opportunities on an interactive map.
                </p>
                <Button asChild size="lg" className="mt-8">
                    <Link href="/login">Get Started</Link>
                </Button>
            </div>
        </section>
      </main>
    </div>
  );
}
