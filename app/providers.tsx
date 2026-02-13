'use client';
import { CompanyProvider } from '@/context/CompanyContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type React from 'react';

const queryClient = new QueryClient();

export const Providers = ({
    children,
    companyId,
}: {
    children: React.ReactNode;
    companyId: number;
}) => {
    return (
        <CompanyProvider companyId={companyId}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </CompanyProvider>
    );
};
