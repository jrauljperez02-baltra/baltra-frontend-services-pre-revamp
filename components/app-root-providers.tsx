'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import AuthProvider from '@/auth/AuthWrapper';
import { CompanyRuntimeProvider } from '@/context/CompanyContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function AppRootProviders({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const skipCompanyProvider = pathname === '/health';

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
                <QueryClientProvider client={queryClient}>
                    {skipCompanyProvider ? (
                        children
                    ) : (
                        <CompanyRuntimeProvider>
                            {children}
                        </CompanyRuntimeProvider>
                    )}
                </QueryClientProvider>
            </AuthProvider>
            <Toaster position="top-center" />
        </ThemeProvider>
    );
}
