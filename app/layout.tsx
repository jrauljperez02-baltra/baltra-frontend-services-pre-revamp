import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type React from 'react';
import 'react-day-picker/style.css';
import './globals.css';
import AppRootProviders from '@/components/app-root-providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Baltra Pipeline',
    description:
        'Pipeline integral de RRHH para contratación de trabajadores de primera línea',
    manifest: '/manifest.json',
    generator: 'v0.dev',
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                {/* Client providers */}
                <AppRootProviders>{children}</AppRootProviders>
            </body>
        </html>
    );
}

// Note: AppRootProviders is a Client Component and will be bundled client-side.
