'use client';

import { useEffect, useState } from 'react';
import type React from 'react';
import {
    fetchUserAttributesSafe,
    hasCompanyId,
    type UserAttributes,
} from '@/lib/user-attributes';

export const ShowCompany2 = ({
    children,
    allowedCompanies,
}: {
    children: React.ReactNode;
    allowedCompanies?: number[];
}) => {
    const [attrs, setAttrs] = useState<UserAttributes>({
        email: null,
        userId: null,
        companyId: null,
        isSuperadmin: null,
        isAdmin: null,
        emailVerified: null,
        companiesIds: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        (async () => {
            const result = await fetchUserAttributesSafe();
            if (!alive) return;
            setAttrs(result);
            setLoading(false);
        })();
        return () => {
            alive = false;
        };
    }, []);

    if (loading) return null;

    if (!hasCompanyId(attrs)) return null;
    if (allowedCompanies && !allowedCompanies.includes(attrs.companyId)) {
        return null;
    }
    return <>{children}</>;
};
