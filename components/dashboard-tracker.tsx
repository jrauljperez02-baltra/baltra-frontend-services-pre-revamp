'use client';

import { useEffect, useState } from 'react';
import { trackDashboardView, trackPageView } from '@/lib/mixpanel';
import {
    fetchUserAttributesSafe,
    hasCompanyId,
    type UserAttributes,
} from '@/lib/user-attributes';

interface DashboardTrackerProps {
    pageName: string;
    trackDashboard?: boolean;
}

export function DashboardTracker({
    pageName,
    trackDashboard = false,
}: DashboardTrackerProps) {
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

    useEffect(() => {
        if (loading || !attrs.email) return;

        const user = {
            email: attrs.email,
            id: attrs.userId ?? undefined,
            isSuperadmin: attrs.isSuperadmin ?? undefined,
        };

        const companyId = hasCompanyId(attrs) ? attrs.companyId : null;

        trackPageView(pageName, user, companyId);

        if (trackDashboard) {
            trackDashboardView(user, companyId);
        }
    }, [pageName, trackDashboard, attrs, loading]);

    return null;
}
