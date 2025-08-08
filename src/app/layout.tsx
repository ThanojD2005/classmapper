
'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

// This metadata would ideally be in a server component layout, but for simplicity with 'use client' we remove it.
// export const metadata: Metadata = {
//   title: 'ClassMapper',
//   description: 'An app to locate and manage students in a classroom.',
// };


function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const isAuthPage = pathname === '/login';

  if (loading && !isAuthPage) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user && !isAuthPage) {
    // Handled by the redirect in AuthContext, but this prevents flashing the content.
    return null;
  }

  return <>{children}</>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-sans antialiased', inter.variable)}>
        <AuthProvider>
            <AppContent>
              {children}
            </AppContent>
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
