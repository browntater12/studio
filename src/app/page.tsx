import { redirect } from 'next/navigation';

export default function RootPage() {
  // The root page redirects to the first account, or the dashboard if no accounts exist.
  // This can be customized to redirect to a specific page.
  redirect('/dashboard');
}
