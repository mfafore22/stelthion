import '@/app/globals.css';
import { LocaleProvider } from './lib/locale-provider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stelthion',
  description: 'Stelthion Platform',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}