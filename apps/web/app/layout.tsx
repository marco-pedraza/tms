import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { SideNav } from '@/components/side-nav';
import QueryClientProvider from '@/components/query-client-provider';
import { Toaster } from '@/components/ui/sonner';
import { I18nProvider } from '@/providers/i18n-provider';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <QueryClientProvider>
          <I18nProvider>
            <div className="flex min-h-screen">
              <aside className="w-64 border-r bg-background">
                <SideNav />
              </aside>
              <main className="flex-1 p-6">{children}</main>
            </div>
            <Toaster richColors />
          </I18nProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
