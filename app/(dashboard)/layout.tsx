import type React from 'react';
import ClientGate from './ClientGate';

export default async function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return <ClientGate>{children}</ClientGate>;
}
