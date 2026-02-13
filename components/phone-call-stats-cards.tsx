'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Users, Clock, XCircle, CheckCircle, CalendarDays } from 'lucide-react';
import { useCompanyID } from '@/context/CompanyContext';
import {
    fetchPhoneFunnel,
    type PhoneFunnelResult,
    type PhoneFunnelState,
} from '@/lib/admin-dashboard';

type StateCard = {
    key: string;
    label: string;
    description: string;
    icon: typeof Users;
    accentClass: string;
};

const CARD_DEFINITIONS: StateCard[] = [
    {
        key: 'invitados a llamada',
        label: 'Invitados a llamada',
        description: 'Candidatos citados en el periodo',
        icon: Users,
        accentClass: 'text-baltra-600',
    },
    {
        key: 'incompleto',
        label: 'Incompleto',
        description: 'Siguen pendientes de concluir la llamada',
        icon: Clock,
        accentClass: 'text-amber-600',
    },
    {
        key: 'rechazado',
        label: 'Rechazado',
        description: 'No superaron la llamada telefónica',
        icon: XCircle,
        accentClass: 'text-red-600',
    },
    {
        key: 'exitoso',
        label: 'Exitoso',
        description: 'Aprobaron la llamada telefónica',
        icon: CheckCircle,
        accentClass: 'text-emerald-600',
    },
    {
        key: 'agendados e2',
        label: 'Agendados E2',
        description: 'Candidatos con entrevista E2 programada',
        icon: CalendarDays,
        accentClass: 'text-baltra-600',
    },
    {
        key: 'todos los candidatos',
        label: 'Todos los candidatos',
        description: 'Total de candidatos en el periodo',
        icon: Users,
        accentClass: 'text-baltra-600',
    },
];

function normalizeKey(state?: string | null) {
    return (state || '').trim().toLowerCase();
}

function formatPercent(value?: number) {
    if (typeof value !== 'number' || Number.isNaN(value)) return null;
    const formatted = value.toFixed(1).replace(/\.0$/, '');
    return `${formatted}%`;
}

interface PhoneCallStatsCardsProps {
    startDate: string;
    endDate: string;
}

export function PhoneCallStatsCards({
    startDate,
    endDate,
}: PhoneCallStatsCardsProps) {
    const companyId = useCompanyID();
    const [funnel, setFunnel] = useState<PhoneFunnelResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            if (!companyId) return;

            try {
                setLoading(true);
                setError(null);
                const statsData = await fetchPhoneFunnel(companyId, {
                    start_date: startDate,
                    end_date: endDate,
                    include_percent: true,
                });
                setFunnel(statsData);
            } catch (err) {
                console.error('Error fetching phone interview stats:', err);
                setError(
                    err instanceof Error ? err.message : 'Error fetching stats'
                );
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [companyId, startDate, endDate]);

    const statesByKey = useMemo(() => {
        const map = new Map<string, PhoneFunnelState>();
        if (!funnel?.states) return map;
        for (const state of funnel.states) {
            map.set(normalizeKey(state.state), state);
        }
        return map;
    }, [funnel?.states]);

    const calculatePercent = (state?: PhoneFunnelState | null) => {
        if (!state) return null;
        const provided = state.percent;
        if (typeof provided === 'number' && !Number.isNaN(provided)) {
            return provided;
        }
        const total = funnel?.total ?? 0;
        if (!total) return null;
        return (state.count / total) * 100;
    };

    if (loading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                                <div className="h-8 bg-gray-200 rounded w-12" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <Card className="sm:col-span-2 lg:col-span-3 xl:col-span-6">
                    <CardContent className="p-6">
                        <p className="text-destructive text-sm">
                            Error cargando estadísticas: {error}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!funnel) {
        return null;
    }

    const scopeCompanyIds = funnel.meta?.scope_company_ids as
        | Array<string | number>
        | undefined;

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {CARD_DEFINITIONS.map((card) => {
                    const state = statesByKey.get(card.key);
                    const count =
                        state?.count ??
                        (card.key === 'invitados a llamada' ? funnel.total : 0);
                    const percentValue =
                        calculatePercent(state) ??
                        (card.key === 'invitados a llamada' ? 100 : null);
                    const percent =
                        percentValue != null ? formatPercent(percentValue) : null;
                    const Icon = card.icon;

                    return (
                        <Card key={card.key}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">
                                            {card.label}
                                        </p>
                                        <p className="text-3xl font-bold mt-1">
                                            {count ?? 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {card.description}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <Icon className={`h-5 w-5 ${card.accentClass}`} />
                                        {percent && (
                                            <p className="text-sm font-semibold mt-2">
                                                {percent}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
                <span>
                    Periodo:{' '}
                    <strong>
                        {funnel.meta?.start_date && funnel.meta?.end_date
                            ? `${funnel.meta.start_date} a ${funnel.meta.end_date}`
                            : `${startDate} a ${endDate}`}
                    </strong>
                </span>
            </div>
        </div>
    );
}
