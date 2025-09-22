import localFont from 'next/font/local';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import DateFnsLocaleProvider from '@/components/date-fns-locale-provider';
import QueryClientProvider from '@/components/query-client-provider';
import Sidebar from '@/components/sidebar';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const geistSans = localFont({
  src: '../fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});
const geistMono = localFont({
  src: '../fonts/GeistMonoVF.woff',
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
        <DateFnsLocaleProvider>
          <NuqsAdapter>
            <QueryClientProvider>
              <NextIntlClientProvider>
                <div className="flex min-h-screen">
                  <aside className="w-64 border-r bg-background">
                    <Sidebar />
                  </aside>
                  <main className="flex-1 p-6">{children}</main>
                </div>
                <Toaster richColors />
              </NextIntlClientProvider>
            </QueryClientProvider>
          </NuqsAdapter>
        </DateFnsLocaleProvider>
      </body>
    </html>
  );
}
