'use client';

import React from 'react';
import { useCompany } from '@/context/CompanyContext';
import { fetchStores, type StoreItem } from '@/lib/admin-api';
import { useCompanyData } from '@/querys/company';

function formatMonth(d = new Date()) {
    // YYYY-MM (UTC-agnostic)
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
}

export function StoreIndicator() {
    const { companyId, isAdmin, isImpersonating } = useCompany();
    const [items, setItems] = React.useState<StoreItem[] | null>(null);
    const [err, setErr] = React.useState<string | null>(null);

    // Fetch company data when impersonating to show company name in header
    const { data: companyData } = useCompanyData(companyId ?? 0);

    React.useEffect(() => {
        let mounted = true;
        setErr(null);
        setItems(null);

        if (!isAdmin || isImpersonating) {
            return;
        }

        (async () => {
            try {
                const month = formatMonth();
                const data = await fetchStores(companyId, undefined, 'all', {
                    month,
                });
                if (!mounted) return;
                setItems(Array.isArray(data) ? data : []);
            } catch (e: any) {
                if (!mounted) return;
                setErr(e?.message || '');
            }
        })();
        return () => {
            mounted = false;
        };
    }, [companyId, isAdmin, isImpersonating]);

    if (err) {
        // Fail silently; don't break header layout
        return null;
    }

    // When impersonating, show the company name at the top-right
    if (isImpersonating) {
        const name = companyData?.name || (companyId ? `Empresa #${companyId}` : 'Empresa');
        const text = name;
        return (
            <div
                className="hidden sm:block max-w-[45vw] truncate text-base font-medium text-muted-foreground"
                title={text}
                aria-label={text}
            >
                {text}
            </div>
        );
    }

    const text = (items || []).map((s) => `${s.name}`).join(', ');

    if (!text) return null;

    return (
        <div
            className="hidden sm:block max-w-[45vw] truncate text-base font-medium text-muted-foreground"
            title={text}
            aria-label={text}
        >
            {text}
        </div>
    );
}
