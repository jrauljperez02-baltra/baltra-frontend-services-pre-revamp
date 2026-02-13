'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { PieChart, Pie, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { useMemo } from 'react';
import { useCompanyID } from '@/context/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { fetchOriginsEvaluated } from '@/lib/admin-api';
import type { UserAttributes } from '@/lib/user-attributes';

interface AdminCandidateOriginsProps {
    selectedIds?: number[];
    selectedStore: string;
    dateRange: { startDate: string; endDate: string };
    attrs: UserAttributes;
}

function parseSelectedCompanyId(
    selected: string,
    fallbackCompanyId: number
): number {
    if (!selected || selected === 'all') return fallbackCompanyId;
    const m = selected.match(/(\d+)/);
    return m ? Number(m[1]) : fallbackCompanyId;
}

function mapOriginLabel(source?: string): string {
    switch (source) {
        case 'other':
            return 'No Elegido';
        case 'publicidad_en_tienda':
            return 'Publicidad en Tienda';
        case 'publicidad_fuera_de_tienda':
            return 'Publicidad Fuera de Tienda';
        default:
            return source ?? '';
    }
}

export function AdminCandidateOrigins({
    selectedStore,
    selectedIds,
    dateRange,
    attrs,
}: AdminCandidateOriginsProps) {
    const baseCompanyId = useCompanyID();
    const companyId = useMemo(
        () => parseSelectedCompanyId(selectedStore, baseCompanyId),
        [selectedStore, baseCompanyId]
    );

    const mainApiParams = useMemo(() => {
        const params = {
            start_date: dateRange.startDate,
            end_date: dateRange.endDate,
        };
        if (selectedIds && selectedIds.length > 0) {
            return { ...params, company_ids: selectedIds };
        }
        if (selectedStore === 'all') {
            return { ...params, company_ids: attrs.companiesIds ?? [] };
        }
        return { ...params, scope: 'idcompany' as const };
    }, [selectedIds, selectedStore, dateRange, attrs.companiesIds]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['admin-origins-evaluated', companyId, mainApiParams],
        queryFn: async () => fetchOriginsEvaluated(companyId, mainApiParams),
        enabled: !!attrs,
    });

    const globalApiParams = useMemo(() => {
        return {
            start_date: dateRange.startDate,
            end_date: dateRange.endDate,
            company_ids: attrs.companiesIds ?? [],
        };
    }, [dateRange, attrs.companiesIds]);

    // Always fetch the global consolidated (scope=all) to display alongside the selected view
    const { data: globalAll } = useQuery({
        queryKey: [
            'admin-origins-evaluated',
            companyId,
            globalApiParams,
            'global',
        ],
        queryFn: async () => fetchOriginsEvaluated(companyId, globalApiParams),
        enabled: !!attrs,
    });

    const originData = useMemo(() => {
        const arr = (data ?? []).filter((it) => it.source !== 'no_company');
        const total = arr.reduce((sum, it) => sum + (it.evaluated || 0), 0) || 1;
        return arr.map((it) => ({
            name: mapOriginLabel(it.source),
            value: it.evaluated,
            percentage:
                it.percentage ?? Math.round((it.evaluated / total) * 1000) / 10,
        }));
    }, [data]);

    const totalCandidates = originData.reduce(
        (sum, item) => sum + item.value,
        0
    );
    const totalGlobal = useMemo(
        () =>
            (globalAll ?? []).reduce((sum, it) => sum + (it.evaluated || 0), 0),
        [globalAll]
    );

    const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#1d4ed8', '#1e3a8a'];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Origen de Candidatos Evaluados</CardTitle>
                <CardDescription>
                    Distribución de candidatos por canal de adquisición
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                        <span className="text-sm font-medium">
                            Consolidado Global
                        </span>
                        <span className="text-lg font-bold">
                            {totalGlobal.toLocaleString()}
                        </span>
                    </div>
                    {!attrs.isSuperadmin && selectedStore !== 'all' && (
                        <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                            <span className="text-sm font-medium">
                                Consolidado Seleccionado
                            </span>
                            <span className="text-lg font-bold">
                                {totalCandidates.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Chart */}
                    <div className="h-64">
                        {isLoading && (
                            <div>Cargando origen de candidatos...</div>
                        )}
                        {isError && (
                            <div className="text-red-600">
                                No se pudo cargar el origen.
                            </div>
                        )}
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={originData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    labelLine={false}
                                    label={(entry) =>
                                        `${entry.name}: ${Number(entry.value ?? 0).toLocaleString()}`
                                    }
                                >
                                    {originData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${entry.name ?? index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number, _name: any, entry: any) => [
                                        Number(value ?? 0).toLocaleString(),
                                        entry?.payload?.name ?? 'Origen',
                                    ]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Stats */}
                    <div className="space-y-4">
                        {originData.map((item, index) => (
                            <div
                                key={item.name ?? `origin-${index}`}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{
                                            backgroundColor:
                                                COLORS[index % COLORS.length],
                                        }}
                                    />
                                    <div>
                                        <div className="font-medium">
                                            {item.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {item.percentage}% del total
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold">
                                        {item.value.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        candidatos
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="pt-4 border-t">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">
                                    {selectedStore === 'all'
                                        ? 'Total Global:'
                                        : 'Total Seleccionado:'}
                                </span>
                                <span className="text-xl font-bold">
                                    {totalCandidates.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
