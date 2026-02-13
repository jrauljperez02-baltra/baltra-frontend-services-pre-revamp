// app/(dashboard)/ClientGate.tsx
'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useCompany } from '@/context/CompanyContext';

export default function ClientGate({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAdmin, isImpersonating } = useCompany();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (isAdmin && !isImpersonating && pathname !== '/dashboard') {
            router.push('/dashboard');
        }
    }, [isAdmin, isImpersonating, pathname, router]);

    const hideSidebar = isAdmin && !isImpersonating; // Admin default view: no sidebar

    return (
        <SidebarProvider>
            {!hideSidebar && <AppSidebar variant="inset" isAdmin={isAdmin} />}
            <SidebarInset>
                <div className="flex-1 overflow-auto">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
