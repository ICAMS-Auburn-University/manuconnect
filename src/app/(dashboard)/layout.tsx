import type { Metadata } from 'next';

import '../global.css';
import { redirect } from 'next/navigation';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner';
import { getServerSession } from '@/app/_internal/auth/getSession';
import IdleSignOut from '@/components/auth/IdleSignOut';

export const metadata: Metadata = {
  title: {
    template: '%s | ManuConnect',
    default: 'ManuConnect',
  },
  description: 'Connecting Ideas With Manufacturers',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (!session) {
    redirect('/sign-in');
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <IdleSignOut />
      <div className="flex justify-center items-center flex-col max-w-7xl mx-auto sm:px-16 px-6 min-h-screen">
        <Navbar />
        {/* Alert Bar Here */}
        {children}
        <Toaster />
        <Footer />
      </div>
    </div>
  );
}
