import type { Metadata } from 'next';

import '../globals.css';
import { redirect } from 'next/navigation';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { getServerSession } from '@/app/_internal/auth/getSession';

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
    <div>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <div className="flex justify-center items-center flex-col max-w-7xl mx-auto sm:px-16 px-6 min-h-screen">
          {/* Alert Bar Here */}
          <Navbar />
          {children}
          <Toaster />
          <Footer />
        </div>
      </ThemeProvider>
    </div>
  );
}
