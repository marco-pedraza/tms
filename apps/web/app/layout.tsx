import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { SideNav } from '@/components/side-nav';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

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
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <QueryClientProvider client={queryClient}>
          <div className="flex min-h-screen">
            <aside className="w-64 border-r bg-background">
              <SideNav />
            </aside>
            <main className="flex-1 p-6">{children}</main>
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}
