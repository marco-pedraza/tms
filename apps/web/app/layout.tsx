import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { SideNav } from '@/components/side-nav';
import QueryClientProvider from '@/components/query-client-provider';
import { Toaster } from '@/components/ui/sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'IMS.ai - Sistema de Inventario de Autobuses',
  description:
    'Administra datos geográficos para el Sistema de Inventario de Autobuses',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <QueryClientProvider>
          <NextIntlClientProvider>
            <div className="flex min-h-screen">
              <aside className="w-64 border-r bg-background">
                <SideNav />
              </aside>
              <main className="flex-1 px-24 py-6">{children}</main>
            </div>
            <Toaster richColors />
          </NextIntlClientProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
