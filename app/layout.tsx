import React from 'react';
import './globals.css';
import { Inter, Montserrat } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

const interFont = Inter({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-inter',
});

const montserratFont = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${interFont.className} ${montserratFont.className} antialiased`}
      >
        <SpeedInsights />
        <Analytics />
        {children}
      </body>
    </html>
  );
};

export default layout;
