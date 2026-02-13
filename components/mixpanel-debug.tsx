'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trackEvent } from '@/lib/mixpanel';
import {
    fetchUserAttributesSafe,
    hasCompanyId,
    isUserSuperadmin,
    type UserAttributes,
} from '@/lib/user-attributes';

export function MixpanelDebug() {
    const [attrs, setAttrs] = useState<UserAttributes>({
        email: null,
        userId: null,
        companyId: null,
        isSuperadmin: null,
        isAdmin: null,
        emailVerified: null,
        companiesIds: null,
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [lastEvent, setLastEvent] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const a = await fetchUserAttributesSafe();
                if (!alive) return;
                setAttrs(a);
            } catch (e) {
                if (!alive) return;
                setError('No se pudieron obtener los atributos de usuario.');
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const userForEvent = useMemo(
        () => ({
            email: attrs.email ?? undefined,
            id: attrs.userId ?? undefined,
            isSuperadmin: attrs.isSuperadmin ?? undefined,
        }),
        [attrs]
    );

    const companyIdForEvent: number | null = hasCompanyId(attrs)
        ? attrs.companyId
        : null;

    const sendTestEvent = () => {
        const eventName = 'test_event_' + Date.now();
        trackEvent(eventName, userForEvent, companyIdForEvent, {
            test_property: 'debug_value',
            timestamp: new Date().toISOString(),
            userId: attrs.userId ?? undefined,
            companyId: companyIdForEvent ?? undefined,
            isSuperadmin: isUserSuperadmin(attrs),
            tokenSet: Boolean(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN),
        });
        setLastEvent(eventName);
    };

    const reloadAttrs = async () => {
        setLoading(true);
        setError('');
        const a = await fetchUserAttributesSafe();
        setAttrs(a);
        setLoading(false);
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Mixpanel Debug</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                    <div>
                        <strong>User:</strong>{' '}
                        {loading
                            ? 'Cargando…'
                            : attrs.email || 'No autenticado'}
                    </div>
                    <div>
                        <strong>User ID:</strong>{' '}
                        {loading ? 'Cargando…' : attrs.userId || '—'}
                    </div>
                    <div>
                        <strong>Company ID:</strong>{' '}
                        {loading
                            ? 'Cargando…'
                            : hasCompanyId(attrs)
                              ? attrs.companyId
                              : 'None'}
                    </div>
                    <div>
                        <strong>Superadmin:</strong>{' '}
                        {loading
                            ? 'Cargando…'
                            : attrs.isSuperadmin === null
                              ? '—'
                              : attrs.isSuperadmin
                                ? 'Yes'
                                : 'No'}
                    </div>
                    <div>
                        <strong>Token Set:</strong>{' '}
                        {process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ? 'Yes' : 'No'}
                    </div>
                    {error && (
                        <div className="text-xs text-red-600">{error}</div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button
                        onClick={sendTestEvent}
                        className="w-full"
                        disabled={loading}
                    >
                        Send Test Event
                    </Button>
                    <Button
                        variant="outline"
                        onClick={reloadAttrs}
                        className="w-full"
                    >
                        Reload Attributes
                    </Button>
                </div>

                {lastEvent && (
                    <div className="text-xs text-green-600">
                        Last event sent: {lastEvent}
                    </div>
                )}

                <div className="text-xs text-gray-500">
                    Check browser DevTools → Network tab for Mixpanel requests
                </div>
            </CardContent>
        </Card>
    );
}
