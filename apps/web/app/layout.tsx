import localFont from 'next/font/local';
import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import AuthLayout from '@/components/auth-layout';
import DateFnsLocaleProvider from '@/components/date-fns-locale-provider';
import QueryClientProvider from '@/components/query-client-provider';
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
                <SessionProvider>
                  <AuthLayout>{children}</AuthLayout>
                  <Toaster richColors />
                </SessionProvider>
              </NextIntlClientProvider>
            </QueryClientProvider>
          </NuqsAdapter>
        </DateFnsLocaleProvider>
      </body>
    </html>
  );
}
