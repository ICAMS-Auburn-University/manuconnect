import type { Metadata } from 'next';

import '../globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: {
    template: '%s | ManuConnect',
    default: 'ManuConnect',
  },
  description: 'Connecting Ideas With Manufacturers',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
