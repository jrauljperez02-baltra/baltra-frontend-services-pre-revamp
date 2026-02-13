'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCompanyID } from '@/context/CompanyContext';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    fetchOnboardingChecklists,
    fetchOnboardingSummary,
} from '@/lib/admin-api';
import type { UserAttributes } from '@/lib/user-attributes';

// Reuse chart styles from onboarding/page
// Minimal inline copy of HorizontalBarChart used there
// Types for chart items
type ChartItem = { question: string; percentage: number; label?: string };
const HorizontalBarChart = ({
    data,
    color,
}: {
    data: ChartItem[];
    color: string;
}) => {
    return (
        <div className="space-y-4">
            {data.map((item, index) => {
                const pctRaw = Number(item.percentage);
                const pct = Number.isFinite(pctRaw)
                    ? Math.max(0, Math.min(100, pctRaw))
                    : 0;
                return (
                    <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span
                                className="font-medium text-gray-700 flex-1 pr-4"
                                title={item.question}
                            >
                                {item.question.length > 50
                                    ? `${item.question.substring(0, 50)}...`
                                    : item.question}
                            </span>
                            <span className="font-semibold text-gray-900 min-w-[40px]">
                                {pct}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="h-3 rounded-full transition-all duration-500 ease-out"
                                style={{
                                    width: `${pct}%`,
                                    backgroundColor: color,
                                }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

interface AdminOnboardingStatsProps {
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

export function AdminOnboardingStats({
    selectedStore,
    selectedIds,
    dateRange,
    attrs,
}: AdminOnboardingStatsProps) {
    const baseCompanyId = useCompanyID();
    const companyId = useMemo(
        () => parseSelectedCompanyId(selectedStore, baseCompanyId),
        [selectedStore, baseCompanyId]
    );

    const apiParams = useMemo(() => {
        const dateParams = {
            start_date: dateRange.startDate,
            end_date: dateRange.endDate,
        };
        if (selectedIds && selectedIds.length > 0) {
            return { ...dateParams, company_ids: selectedIds };
        }
        if (selectedStore === 'all') {
            return { ...dateParams, company_ids: attrs.companiesIds ?? [] };
        }
        return { ...dateParams, scope: 'idcompany' as const };
    }, [selectedIds, selectedStore, dateRange, attrs.companiesIds]);

    const { data: summary, isLoading: loadingSummary } = useQuery({
        queryKey: ['admin-onboarding-summary', companyId, apiParams],
        queryFn: async () => fetchOnboardingSummary(companyId, apiParams),
        enabled: !!attrs,
    });
    const { data: checklists, isLoading: loadingChecklists } = useQuery({
        queryKey: ['admin-onboarding-checklists', companyId, apiParams],
        queryFn: async () => fetchOnboardingChecklists(companyId, apiParams),
        enabled: !!attrs,
    });

    let checklist1: ChecklistItem[] = [];
    let checklist2: ChecklistItem[] = [];
    if (Array.isArray(checklists)) {
        for (const block of checklists as any[]) {
            if (block?.checklist === 1) checklist1 = block.items || [];
            if (block?.checklist === 2) checklist2 = block.items || [];
        }
    } else if (checklists && (checklists as any).items) {
        // single payload shape
        checklist1 = (checklists as any).items;
    } else if (
        checklists &&
        ((checklists as any).checklist_1 || (checklists as any).checklist_2)
    ) {
        // new payload shape: { checklist_1: [{ question, percentage, ... }], checklist_2: [...] }
        const c1 = (checklists as any).checklist_1 ?? [];
        const c2 = (checklists as any).checklist_2 ?? [];
        checklist1 = Array.isArray(c1)
            ? c1.map((it: any) => ({
                  item: it.question ?? String(it?.item ?? ''),
                  completion: Number(it.percentage) ?? 0,
              }))
            : [];
        checklist2 = Array.isArray(c2)
            ? c2.map((it: any) => ({
                  item: it.question ?? String(it?.item ?? ''),
                  completion: Number(it.percentage) ?? 0,
              }))
            : [];
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Estadísticas de Onboarding</CardTitle>
                <CardDescription>
                    Seguimiento del proceso de integración de nuevos empleados
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center p-6 rounded-lg bg-muted/50 min-h-[120px] flex flex-col justify-center relative">
                        <div className="text-3xl font-bold">
                            {summary?.employees_in_onboarding ?? '-'}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                            Empleados en Onboarding
                        </div>
                        <div className="mt-2">
                            {summary && (
                                <Badge
                                    variant="secondary"
                                    className="text-xs px-2 py-1 whitespace-normal text-center max-w-full break-words"
                                >
                                    +{summary.change_from_last_week} desde la
                                    semana pasada
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="text-center p-6 rounded-lg bg-muted/50 min-h-[120px] flex flex-col justify-center">
                        <div className="text-3xl font-bold">
                            {summary?.checklist1_completion ?? 0}%
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">
                            Checklist 1 Completado
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {summary?.checklist1_employees ?? 0} de{' '}
                            {summary?.employees_in_onboarding ?? 0} empleados
                        </div>
                    </div>

                    <div className="text-center p-6 rounded-lg bg-muted/50 min-h-[120px] flex flex-col justify-center">
                        <div className="text-3xl font-bold">
                            {summary?.checklist2_completion ?? 0}%
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">
                            Checklist 2 Completado
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {summary?.checklist2_employees ?? 0} de{' '}
                            {summary?.employees_in_onboarding ?? 0} empleados
                        </div>
                    </div>

                    <div className="text-center p-6 rounded-lg bg-muted/50 min-h-[120px] flex flex-col justify-center">
                        <div className="text-3xl font-bold">
                            {summary?.average_satisfaction ?? 0}/5
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                            Satisfacción Promedio
                        </div>
                        <div className="mt-2">
                            {summary && (
                                <Badge
                                    variant="secondary"
                                    className="text-xs px-2 py-1 whitespace-normal text-center max-w-full break-words"
                                >
                                    {summary.satisfaction_change >= 0
                                        ? '+'
                                        : ''}
                                    {summary.satisfaction_change} vs mes
                                    anterior
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* Checklist Details */}
                <div className="space-y-8">
                    {/* Checklist 1 */}
                    {checklist1.length > 0 && (
                        <div>
                            <h4 className="font-medium mb-4 text-lg">
                                Checklist 1 - Resultados
                            </h4>
                            {(() => {
                                const data = checklist1.map((item) => ({
                                    question: item.item,
                                    percentage: item.completion,
                                }));
                                return (
                                    <HorizontalBarChart
                                        data={data}
                                        color="#3b82f6"
                                    />
                                );
                            })()}
                        </div>
                    )}

                    {/* Checklist 2 */}
                    {checklist2.length > 0 && (
                        <div>
                            <h4 className="font-medium mb-4 text-lg">
                                Checklist 2 - Resultados
                            </h4>
                            {(() => {
                                const data = checklist2.map((item) => ({
                                    question: item.item,
                                    percentage: item.completion,
                                }));
                                return (
                                    <HorizontalBarChart
                                        data={data}
                                        color="#f97316"
                                    />
                                ); // orange like onboarding/page
                            })()}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
