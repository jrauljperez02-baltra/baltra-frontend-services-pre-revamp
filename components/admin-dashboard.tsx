'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { AdminConversionFunnel } from '@/components/admin-conversion-funnel';
import { AdminRejectionReasons } from '@/components/admin-rejection-reasons';
import { AdminCandidateOrigins } from '@/components/admin-candidate-origins';
import { AdminOnboardingStats } from '@/components/admin-onboarding-stats';
import { AdminDocumentStats } from '@/components/admin-document-stats';
import { AdminScreeningQuestions } from '@/components/admin-screening-questions';
import { AdminStoreNavigation } from '@/components/admin-store-navigation';
import { Users, TrendingUp, FileCheck } from 'lucide-react';
import { BaltraLogo } from '@/components/baltra-logo';
import { useCompany, useCompanyID } from '@/context/CompanyContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    fetchHiresByRole,
    fetchStores,
    fetchTimeToHire,
} from '@/lib/admin-api';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { NavUser } from '@/components/nav-user';
import { NavUserSkeleton } from '@/components/nav-user-skeleton';
import {
    fetchUserAttributesSafe,
    type UserAttributes,
} from '@/lib/user-attributes';
import { useSearchParams } from 'next/navigation';

export function AdminDashboard({
    initialSelectedStore = 'all',
}: {
    initialSelectedStore?: string;
}) {
    const [selectedStore, setSelectedStore] =
        useState<string>(initialSelectedStore);
    // Multiple selection of stores (company IDs)
    const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
    const searchParams = useSearchParams();
    const initialTab = (searchParams?.get('tab') || 'overview').toString();
    const [activeTab, setActiveTab] = useState(initialTab);
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [endDate, setEndDate] = useState<string>(() => {
        const d = new Date();
        const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
    });

    // user attributes for user menu
    const [attrs, setAttrs] = useState<UserAttributes>({
        email: null,
        userId: null,
        companyId: null,
        isSuperadmin: null,
        isAdmin: null,
        companiesIds: null,
    });
    const [loadingAttrs, setLoadingAttrs] = useState(true);
    useEffect(() => {
        let mounted = true;
        (async () => {
            const a = await fetchUserAttributesSafe();
            if (mounted) {
                console.log('[AdminDashboard] User attributes loaded:', {
                    companyId: a.companyId,
                    isAdmin: a.isAdmin,
                    companiesIds: a.companiesIds,
                    companiesIdsLength: a.companiesIds?.length ?? 0,
                });
                setAttrs(a);
                setLoadingAttrs(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const range: DateRange = useMemo(() => {
        const toDate = (s: string) => {
            const [y, m, d] = s.split('-').map(Number);
            return new Date(y, (m || 1) - 1, d || 1);
        };
        return { from: toDate(startDate), to: toDate(endDate) };
    }, [startDate, endDate]);

    const {
        baseCompanyId,
        companyId: effectiveCompanyId,
        isAdmin,
        isImpersonating,
        impersonate,
        clearImpersonation,
    } = useCompany();
    const queryClient = useQueryClient();
    const companyId = useMemo(() => {
        if (!selectedStore || selectedStore === 'all')
            return effectiveCompanyId;
        const m = selectedStore.match(/(\d+)/);
        return m ? Number(m[1]) : effectiveCompanyId;
    }, [selectedStore, effectiveCompanyId]);

    // When changing selected store or date range, proactively refetch all admin-* queries
    // This complements React Query's key change refetch for snappier UX.
    useEffect(() => {
        // invalidate in a microtask to ensure state is settled
        queueMicrotask(() => {
            queryClient.invalidateQueries({
                predicate: (q) =>
                    Array.isArray(q.queryKey) &&
                    typeof q.queryKey[0] === 'string' &&
                    (q.queryKey[0] as string).startsWith('admin-'),
            });
        });
    }, [queryClient, selectedStore, startDate, endDate]);

    const apiParams = useMemo(() => {
        const dateParams = { start_date: startDate, end_date: endDate };
        let params;
        if (selectedStoreIds.length > 0) {
            params = { ...dateParams, company_ids: selectedStoreIds };
        } else if (isAdmin && selectedStore === 'all') {
            params = { ...dateParams, company_ids: attrs.companiesIds ?? [] };
        } else {
            params = { ...dateParams, scope: 'idcompany' as const };
        }
        console.log('[AdminDashboard] API params computed:', {
            selectedStore,
            selectedStoreIdsLength: selectedStoreIds.length,
            isAdmin,
            companiesIdsLength: attrs.companiesIds?.length ?? 0,
            hasCompanyIds: 'company_ids' in params,
            companyIdsLength: 'company_ids' in params ? (params.company_ids as any[]).length : 0,
            hasScope: 'scope' in params,
        });
        return params;
    }, [
        isAdmin,
        selectedStore,
        attrs.companiesIds,
        startDate,
        endDate,
        selectedStoreIds,
    ]);

    const { data: tth } = useQuery({
        queryKey: ['admin-time-to-hire', companyId, apiParams],
        queryFn: async () => fetchTimeToHire(companyId, apiParams),
        enabled: !loadingAttrs,
    });
    const { data: hiresByRole } = useQuery({
        queryKey: ['admin-hires-by-role', companyId, apiParams],
        queryFn: async () => fetchHiresByRole(companyId, apiParams),
        enabled: !loadingAttrs,
    });
    const hiresByRoleMerged = useMemo(() => {
        const map = new Map<string, number>();
        for (const r of hiresByRole ?? []) {
            const name = (r as any)?.role_name ?? 'Desconocido';
            const add = Number((r as any)?.count) || 0;
            map.set(name, (map.get(name) ?? 0) + add);
        }
        return Array.from(map.entries())
            .map(([role_name, count]) => ({ role_name, count }))
            .sort((a, b) => (b.count || 0) - (a.count || 0));
    }, [hiresByRole]);

    const { data: storeList, isLoading: loadingStores, error: storeListError } = useQuery({
        queryKey: ['admin-store-list', baseCompanyId, attrs.companiesIds],
        queryFn: async () => {
            const companyIds = attrs.companiesIds ?? [];
            console.log('[AdminDashboard] Fetching stores with company_ids:', companyIds, 'length:', companyIds.length, 'baseCompanyId:', baseCompanyId);
            try {
                const result = await fetchStores(baseCompanyId, undefined, 'all', {
                    company_ids: companyIds,
                });
                console.log('[AdminDashboard] Fetched stores:', result?.length ?? 0, 'stores', result?.slice(0, 5));
                return result;
            } catch (err) {
                console.error('[AdminDashboard] Error fetching stores:', err);
                throw err;
            }
        },
        enabled: !loadingAttrs && !!attrs.companiesIds && attrs.companiesIds.length > 0,
    });
    
    if (storeListError) {
        console.error('[AdminDashboard] Store list query error:', storeListError);
    }

    const filteredStoreList = useMemo(() => {
        const allowList = attrs?.companiesIds;
        console.log('[AdminDashboard] Filtering stores. allowList:', allowList, 'storeList length:', storeList?.length ?? 0);
        if (!Array.isArray(allowList) || allowList.length === 0) {
            console.log('[AdminDashboard] No allowList, returning all stores');
            return storeList ?? [];
        }
        const filtered = (storeList ?? []).filter((s) => {
            const id =
                (s as any)?.id ??
                (s as any)?.store_id ??
                (s as any)?.business_unit_id;
            const idNum = Number(id);
            return Number.isFinite(idNum) && allowList.includes(idNum);
        });
        console.log('[AdminDashboard] Filtered stores:', filtered.length, 'stores');
        return filtered;
    }, [storeList, attrs?.companiesIds]);

    // Header select: do NOT impersonate; just set selection and let queries use scope=idcompany
    const handleSelectStoreHeader = (value: string) => {
        setSelectedStore(value);
        setActiveTab('overview');
    };

    // Stores tab select: keep impersonation behavior (only this section is allowed to impersonate)
    const handleSelectStoreImpersonate = (value: string) => {
        setSelectedStore(value);
        setActiveTab('overview');
        if (value === 'all') {
            clearImpersonation();
        } else {
            const m = value.match(/(\d+)/);
            if (m) {
                impersonate(Number(m[1]));
            }
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="flex h-16 items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <BaltraLogo className="h-8 w-8" />
                        <div>
                            <h1 className="text-xl font-bold text-foreground">
                                Baltra Admin
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Panel Central de Administración
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="min-w-[260px] justify-start text-left font-normal"
                                >
                                    {`${startDate} - ${endDate}`}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto p-0"
                                align="start"
                            >
                                <Calendar
                                    mode="range"
                                    selected={range}
                                    numberOfMonths={2}
                                    onSelect={(r) => {
                                        if (!r) return;
                                        if (r.from) {
                                            const y = r.from.getFullYear();
                                            const m = String(
                                                r.from.getMonth() + 1
                                            ).padStart(2, '0');
                                            const d = String(
                                                r.from.getDate()
                                            ).padStart(2, '0');
                                            setStartDate(`${y}-${m}-${d}`);
                                        }
                                        if (r.to) {
                                            const y = r.to.getFullYear();
                                            const m = String(
                                                r.to.getMonth() + 1
                                            ).padStart(2, '0');
                                            const d = String(
                                                r.to.getDate()
                                            ).padStart(2, '0');
                                            setEndDate(`${y}-${m}-${d}`);
                                        }
                                    }}
                                />
                            </PopoverContent>
                        </Popover>

                        <div className="flex items-center gap-2">
                            {/* Multi-select for stores */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="min-w-[260px] justify-start text-left font-normal"
                                    >
                                        {(() => {
                                            if (loadingStores)
                                                return 'Cargando...';
                                            if (selectedStoreIds.length === 0)
                                                return 'Todas las tiendas';
                                            if (selectedStoreIds.length === 1) {
                                                const id = selectedStoreIds[0];
                                                const found = (
                                                    filteredStoreList ?? []
                                                ).find(
                                                    (s: any) =>
                                                        (s?.id ??
                                                            s?.store_id ??
                                                            s?.business_unit_id) ===
                                                        id
                                                );
                                                const label =
                                                    (found as any)?.name ??
                                                    (found as any)
                                                        ?.store_name ??
                                                    `Tienda ${id}`;
                                                return label;
                                            }
                                            return `${selectedStoreIds.length} tiendas seleccionadas`;
                                        })()}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-72 p-2"
                                    align="end"
                                >
                                    <div className="flex items-center justify-between px-2 py-1">
                                        <span className="text-sm font-medium">
                                            Seleccionar tiendas
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const allIds = (
                                                    filteredStoreList ?? []
                                                )
                                                    .map(
                                                        (s: any) =>
                                                            s?.id ??
                                                            s?.store_id ??
                                                            s?.business_unit_id
                                                    )
                                                    .filter((n: any) =>
                                                        Number.isFinite(
                                                            Number(n)
                                                        )
                                                    )
                                                    .map((n: any) => Number(n));
                                                const isAllSelected =
                                                    selectedStoreIds.length >
                                                        0 &&
                                                    allIds.length > 0 &&
                                                    selectedStoreIds.length ===
                                                        allIds.length;
                                                const next = isAllSelected
                                                    ? []
                                                    : allIds;
                                                setSelectedStoreIds(next);
                                                if (next.length === 0)
                                                    setSelectedStore('all');
                                                else if (next.length === 1)
                                                    setSelectedStore(
                                                        `store-${String(next[0])}`
                                                    );
                                                else setSelectedStore('all');
                                            }}
                                        >
                                            {(() => {
                                                const allIds = (
                                                    filteredStoreList ?? []
                                                )
                                                    .map(
                                                        (s: any) =>
                                                            s?.id ??
                                                            s?.store_id ??
                                                            s?.business_unit_id
                                                    )
                                                    .filter((n: any) =>
                                                        Number.isFinite(
                                                            Number(n)
                                                        )
                                                    )
                                                    .map((n: any) => Number(n));
                                                const isAllSelected =
                                                    selectedStoreIds.length >
                                                        0 &&
                                                    allIds.length > 0 &&
                                                    selectedStoreIds.length ===
                                                        allIds.length;
                                                return isAllSelected
                                                    ? 'Deseleccionar todas'
                                                    : 'Seleccionar todas';
                                            })()}
                                        </Button>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                                        {(filteredStoreList ?? []).map(
                                            (s: any, idx: number) => {
                                                const idRaw =
                                                    s?.id ??
                                                    s?.store_id ??
                                                    s?.business_unit_id;
                                                const id = Number(idRaw);
                                                if (!Number.isFinite(id))
                                                    return null;
                                                const label =
                                                    s?.name ??
                                                    s?.store_name ??
                                                    `Tienda ${id}`;
                                                const checked =
                                                    selectedStoreIds.includes(
                                                        id
                                                    );
                                                return (
                                                    <label
                                                        key={`ms-${id}-${idx}`}
                                                        className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted cursor-pointer"
                                                    >
                                                        <Checkbox
                                                            checked={checked}
                                                            onCheckedChange={(
                                                                v
                                                            ) => {
                                                                const isChecked =
                                                                    Boolean(v);
                                                                const next =
                                                                    isChecked
                                                                        ? Array.from(
                                                                              new Set(
                                                                                  [
                                                                                      ...selectedStoreIds,
                                                                                      id,
                                                                                  ]
                                                                              )
                                                                          )
                                                                        : selectedStoreIds.filter(
                                                                              (
                                                                                  x
                                                                              ) =>
                                                                                  x !==
                                                                                  id
                                                                          );
                                                                setSelectedStoreIds(
                                                                    next
                                                                );
                                                                if (
                                                                    next.length ===
                                                                    0
                                                                )
                                                                    setSelectedStore(
                                                                        'all'
                                                                    );
                                                                else if (
                                                                    next.length ===
                                                                    1
                                                                )
                                                                    setSelectedStore(
                                                                        `store-${String(next[0])}`
                                                                    );
                                                                else
                                                                    setSelectedStore(
                                                                        'all'
                                                                    );
                                                            }}
                                                        />
                                                        <span className="text-sm">
                                                            {label}
                                                        </span>
                                                    </label>
                                                );
                                            }
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {!loadingAttrs ? (
                                <NavUser
                                    user={{
                                        avatar: '/baltra-logo.png',
                                        name: attrs.email ?? 'Baltra',
                                        email: attrs.email ?? 'm@example.com',
                                    }}
                                />
                            ) : (
                                <NavUserSkeleton />
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="p-6">
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="space-y-6"
                >
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger
                            value="overview"
                            className="flex items-center gap-2"
                        >
                            <TrendingUp className="h-4 w-4" />
                            Resumen General
                        </TabsTrigger>
                        <TabsTrigger
                            value="recruitment"
                            className="flex items-center gap-2"
                        >
                            <Users className="h-4 w-4" />
                            Reclutamiento
                        </TabsTrigger>
                        <TabsTrigger
                            value="onboarding"
                            className="flex items-center gap-2"
                        >
                            <FileCheck className="h-4 w-4" />
                            Docs & Onboarding
                        </TabsTrigger>
                        <TabsTrigger
                            value="stores"
                            className="flex items-center gap-2"
                        >
                            Centros de Trabajo
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <AdminConversionFunnel
                            selectedStore={selectedStore}
                            selectedIds={selectedStoreIds}
                            dateRange={{ startDate, endDate }}
                            attrs={attrs}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">
                                        Tiempo a Contratación
                                    </CardTitle>
                                    <CardDescription>
                                        Tiempo promedio desde evaluación hasta
                                        contratación
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div
                                        className="text-3xl font-bold"
                                        style={{ color: '#1e40af' }}
                                    >
                                        {tth
                                            ? (tth.avg_hours / 24).toFixed(1)
                                            : '-'}{' '}
                                        días
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {tth
                                            ? `${tth.samples} muestras`
                                            : 'Cargando...'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">
                                        Contratados por Rol
                                    </CardTitle>
                                    <CardDescription>
                                        Distribución de contrataciones por
                                        posición
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="max-h-48 overflow-y-auto pr-4">
                                        <div className="space-y-3">
                                            {(hiresByRoleMerged ?? []).map(
                                                (r, idx) => (
                                                    <div
                                                        key={`role-agg-${idx}-${r.role_name ?? 'unknown'}-${r.count ?? 0}`}
                                                        className="flex justify-between items-center"
                                                    >
                                                        <span className="text-sm font-medium">
                                                            {r.role_name}
                                                        </span>
                                                        <span className="text-sm font-bold">
                                                            {r.count}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                            {(!hiresByRoleMerged ||
                                                hiresByRoleMerged.length ===
                                                    0) && (
                                                <div className="text-sm text-muted-foreground">
                                                    Sin datos
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <AdminCandidateOrigins
                            selectedStore={selectedStore}
                            selectedIds={selectedStoreIds}
                            dateRange={{ startDate, endDate }}
                            attrs={attrs}
                        />
                    </TabsContent>

                    <TabsContent value="recruitment" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <AdminScreeningQuestions
                                selectedStore={selectedStore}
                                selectedIds={selectedStoreIds}
                                dateRange={{ startDate, endDate }}
                                attrs={attrs}
                            />
                            <AdminRejectionReasons
                                selectedStore={selectedStore}
                                selectedIds={selectedStoreIds}
                                dateRange={{ startDate, endDate }}
                                attrs={attrs}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="onboarding" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <AdminOnboardingStats
                                selectedStore={selectedStore}
                                selectedIds={selectedStoreIds}
                                dateRange={{ startDate, endDate }}
                                attrs={attrs}
                            />
                            <AdminDocumentStats
                                selectedStore={selectedStore}
                                selectedIds={selectedStoreIds}
                                dateRange={{ startDate, endDate }}
                                attrs={attrs}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="stores" className="space-y-6">
                        <AdminStoreNavigation
                            selectedStore={selectedStore}
                            dateRange={{ startDate, endDate }}
                            attrs={attrs}
                            onSelectStore={handleSelectStoreImpersonate}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
