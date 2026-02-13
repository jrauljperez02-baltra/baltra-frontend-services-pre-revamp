'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCompanyID } from '@/context/CompanyContext';
import { fetchFunnel, fetchStores, type FunnelPoint, type FunnelResponse } from '@/lib/admin-api';
import { Accordion, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { StatusAccordion } from './status-accordion';
import type { UserAttributes } from '@/lib/user-attributes';

interface AdminConversionFunnelProps {
  selectedIds?: number[];
  selectedStore: string;
  dateRange: { startDate: string; endDate: string };
  attrs: UserAttributes;
}

function parseSelectedCompanyId(selected: string, fallbackCompanyId: number): number {
  if (!selected || selected === 'all') return fallbackCompanyId;
  const m = selected.match(/(\d+)/);
  return m ? Number(m[1]) : fallbackCompanyId;
}

const FORCE_PYRAMID = true;
const PYRAMID_BASE_WIDTH = 100;
const PYRAMID_STEP = 12;
const PYRAMID_MIN_WIDTH = 20;

export function AdminConversionFunnel({
  selectedStore,
  selectedIds,
  dateRange,
  attrs,
}: AdminConversionFunnelProps) {
  const BASE_STATE = 'screening_in_progress' as const;
  const CORE_ORDER = [
    'screening_in_progress',
    'scheduled_interview',
    'interview_completed',
    'hired',
    'onboarding',
  ] as const;

  const baseCompanyId = useCompanyID();
  const companyId = useMemo(
    () => parseSelectedCompanyId(selectedStore, baseCompanyId),
    [selectedStore, baseCompanyId]
  );

  // siempre manda company_ids (selectedIds | all | [companyId])
  const apiParams = useMemo(() => {
    const dateParams = { start_date: dateRange.startDate, end_date: dateRange.endDate };
    const ids =
      selectedIds?.length
        ? selectedIds
        : selectedStore === 'all'
        ? (attrs.companiesIds ?? [])
        : [companyId];
    const params = { ...dateParams, company_ids: ids as (number | string)[] };
    console.log('[AdminConversionFunnel] API params:', {
      selectedStore,
      selectedIdsLength: selectedIds?.length ?? 0,
      companiesIdsLength: attrs.companiesIds?.length ?? 0,
      finalIdsLength: ids.length,
      finalIds: ids.slice(0, 10), // Log first 10 for debugging
      dateRange,
    });
    return params;
  }, [selectedIds, selectedStore, dateRange, attrs.companiesIds, companyId]);

  const storesParams = useMemo(
    () => ({
      start_date: apiParams.start_date as string,
      end_date: apiParams.end_date as string,
      company_ids: apiParams.company_ids as (number | string)[],
      scope: selectedStore === 'all' ? 'all' : 'own',
    }),
    [apiParams.start_date, apiParams.end_date, apiParams.company_ids, selectedStore]
  );

  // funnel
  const { data: apiFunnel, isLoading, isError, error } = useQuery({
    queryKey: ['admin-funnel', companyId, apiParams],
    queryFn: async () => {
      console.log('[AdminConversionFunnel] Fetching funnel for companyId:', companyId, 'with params:', apiParams);
      try {
        const result = await fetchFunnel(companyId, apiParams);
        console.log('[AdminConversionFunnel] Funnel data received:', {
          dataLength: result?.data?.length ?? 0,
          data: result?.data,
          meta: result?.meta,
        });
        return result;
      } catch (err) {
        console.error('[AdminConversionFunnel] Error fetching funnel:', err);
        throw err;
      }
    },
    enabled: !!companyId,
  });
  
  if (isError) {
    console.error('[AdminConversionFunnel] Query error:', error);
  }

  // stores para nombrar companies
  const { data: stores } = useQuery({
    queryKey: ['stores', companyId, storesParams],
    queryFn: () => fetchStores(companyId, undefined, storesParams.scope, storesParams),
    enabled: !!companyId,
  });

  const storeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of stores ?? []) {
      if (s?.business_unit_id != null && s?.name) map.set(String(s.business_unit_id), s.name);
    }
    return map;
  }, [stores]);

  // Procesamiento con ACUMULADOS piramidales, preservando IDs string
  const processed = useMemo(() => {
    const resp = apiFunnel as FunnelResponse | undefined;
    const items: FunnelPoint[] = resp?.data ?? [];

    const friendly: Record<string, string> = {
      screening_in_progress: 'Evaluados',
      scheduled_interview: 'Citados',
      interview_completed: 'Entrevistados',
      hired: 'Contratados',
      onboarding: 'Ingresados',
      rejected: 'Rechazados',
      cancelled: 'Cancelados',
      missed_interview: 'Entrevista perdida',
      expired: 'Expirado',
    };

    const order = [
      'screening_in_progress',
      'scheduled_interview',
      'interview_completed',
      'hired',
      'onboarding',
      'rejected',
      'cancelled',
      'missed_interview',
      'expired',
    ] as const;

    const CORE = new Set(CORE_ORDER);

    const colors: Record<string, string> = {
      screening_in_progress: '#1e3a8a', // darkest
      scheduled_interview:  '#1d4ed8', // dark
      interview_completed:   '#1d4ed8', // dark
      hired:                 '#1e3a8a', // darkest
      onboarding:            '#93c5fd', // light
      rejected:              '#ef4444',
      cancelled:             '#93c5fd', // light
      missed_interview:      '#60a5fa', // mid
      expired:               '#64748b',
    };

    const idx: Record<string, number> = Object.fromEntries(order.map((s, i) => [s, i]));
    const originalByState: Record<string, any[]> = {};

    // Normalización de datos crudos
    const sorted = [...items]
      .map((r: any) => {
        const normalizedCompanies = Array.isArray(r.companies)
          ? r.companies.map((c: any) => ({
              id: String(c?.id),
              count: Number(c?.count ?? 0) || 0,
              missed_interview_count: Number(c?.missed_interview_count ?? 0) || 0,
              cancelled_count: Number(c?.cancelled_count ?? 0) || 0,
              rejected_count: Number(c?.rejected_count ?? 0) || 0,
              updated_required_count: Number(c?.updated_required_count ?? 0) || 0,
              no_verified_count: Number(c?.no_verified_count ?? 0) || 0, // NUEVO
            }))
          : [];

        originalByState[String(r.state)] = normalizedCompanies;

        return {
          ...r,
          state: String(r.state),
          count: Number(r.count ?? 0) || 0,
          companies: normalizedCompanies.map((c: any) => ({
            id: String(c.id),
            count: Number(c.count) || 0,
          })),
        };
      })
      .sort((a, b) => (idx[a.state] ?? 999) - (idx[b.state] ?? 999));

    type Co = { id: string; count: number };

    const mergeCompanies = (lists: (Co[] | undefined)[]) => {
      const acc = new Map<string, number>();
      for (const list of lists) for (const it of list ?? []) {
        const key = String(it.id);
        acc.set(key, (acc.get(key) ?? 0) + (Number(it.count) || 0));
      }
      return Array.from(acc, ([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count);
    };

    const hiredOriginalList = (originalByState['hired'] ?? []) as Array<{
      id: string; count: number; no_verified_count?: number;
    }>;

    let realVerified: Array<{ id: string; count: number }> = [];
    let realVerifiedTotal = 0;

    // Eleva los ingresados al total de contratados sin duplicar la fila de onboarding
    {
      const hiredRow = sorted.find(r => r.state === 'hired');
      const onboardingRow = sorted.find(r => r.state === 'onboarding');
      if (hiredRow && onboardingRow) {
        const onbCounts = new Map<string, number>(
          (onboardingRow.companies ?? []).map((c: any) => [String(c.id), Number(c.count) || 0])
        );

        const augmented: Array<Record<string, any>> = [];
        const seen = new Set<string>();

        for (const item of hiredOriginalList) {
          const id = String((item as any).id);
          const baseCount = Number((item as any).count) || 0;
          const add = onbCounts.get(id) || 0;
          augmented.push({ ...item, id, count: baseCount + add });
          seen.add(id);
        }

        for (const [id, add] of onbCounts) {
          if (seen.has(id)) continue;
          augmented.push({ id, count: add, no_verified_count: 0 });
        }

        const total = augmented.reduce((sum, item) => sum + (Number(item.count) || 0), 0);

        originalByState['hired'] = augmented;
        hiredRow.count = total;
        hiredRow.companies = augmented.map((item) => ({
          id: String(item.id),
          count: Number(item.count) || 0,
        }));

        realVerified = augmented
          .map((item) => ({
            id: String(item?.id),
            count: Math.max(
              0,
              (Number(item?.count) || 0) - (Number((item as any)?.no_verified_count) || 0)
            ),
          }))
          .filter((item) => (item.count || 0) > 0);
        realVerifiedTotal = realVerified.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
        originalByState['onboarding'] = realVerified.map((item) => ({
          id: item.id,
          count: item.count,
        }));
      }
    }

    // Reemplaza la fila de onboarding con los verificados reales para mostrar
    {
      const onboardingRow = sorted.find(r => r.state === 'onboarding');
      if (onboardingRow) {
        onboardingRow.count = realVerifiedTotal;
        onboardingRow.companies = realVerified.map((item) => ({
          id: String(item.id),
          count: Number(item.count) || 0,
        }));
      }
    }

    const verifiedTotals = realVerified;

    const coreSorted = sorted.filter((r) => CORE.has(r.state));
    const extraSorted = sorted.filter((r) => !CORE.has(r.state));

    // Acumulados SOLO del core.
    // Nota importante: NO propagamos "onboarding" hacia arriba porque ya lo incluimos sumándolo en "hired".
    // De este modo, al sumar de abajo hacia arriba desde "hired", los valores de onboarding SÍ se incluyen (vía hired)
    // sin contarlos dos veces (evitando sumar nuevamente la fila de onboarding).
    const NO_BACK_PROPAGATE = new Set<string>(['onboarding']);

    const coreCounts = coreSorted.map((r) => r.count);
    const accCountsCore: number[] = new Array(coreCounts.length).fill(0);
    const accCompaniesCore: Co[][] = new Array(coreCounts.length).fill(null as any);

    for (let i = coreCounts.length - 1; i >= 0; i--) {
      let futureSum = 0;
      if (i + 1 < coreCounts.length) {
        for (let j = i + 1; j < coreCounts.length; j++) {
          if (!NO_BACK_PROPAGATE.has(coreSorted[j].state)) {
            futureSum += coreSorted[j].count;
          }
        }
      }

      accCountsCore[i] = coreSorted[i].count + futureSum;

      const listsForMerge = coreSorted
        .slice(i)
        .filter(r => !NO_BACK_PROPAGATE.has(r.state) || r === coreSorted[i])
        .map(r => r.companies as Co[]);
      accCompaniesCore[i] = mergeCompanies(listsForMerge);
    }

    const baseTotal = accCountsCore[0] || 1;

    const withAccCore = coreSorted.map((r, i) => ({
      ...r,
      count: accCountsCore[i],
      percent: Math.round((accCountsCore[i] / baseTotal) * 1000) / 10,
      companies_accumulated: accCompaniesCore[i],
      label: friendly[r.state] ?? r.state,
      color: colors[r.state] ?? '#94a3b8',
    }));

    const withAccExtras = extraSorted.map((r) => ({
      ...r,
      count: r.count,
      percent: 0,
      companies_accumulated: r.companies as Co[],
      label: friendly[r.state] ?? r.state,
      color: colors[r.state] ?? '#94a3b8',
    }));

    const withAcc = [
      ...order
        .map((st) => withAccCore.find((x) => x.state === st) ?? withAccExtras.find((x) => x.state === st))
        .filter(Boolean) as typeof withAccCore,
    ];

    const core = withAcc.filter((i) => CORE.has(i.state));

    const verifiedTotal = verifiedTotals.reduce((sum, item) => sum + (Number(item.count) || 0), 0);

    return {
      items: withAcc,
      core,
      total: baseTotal,
      originalByState,
      verifiedTotals,
      verifiedTotal,
      realVerified,
      realVerifiedTotal,
      real_verified: realVerified,
      real_verified_total: realVerifiedTotal,
    };
  }, [apiFunnel]);

  // summary para los acordeones (incluye onboarding como original derivado)
  const summaryForAccordion = useMemo(() => {
    const realVerifiedMap = new Map<string, number>(
      ((processed as any)?.real_verified ?? []).map((c: any) => [String(c?.id), Number(c?.count) || 0])
    );

    const realVerifiedList = ((processed as any)?.real_verified ?? []).map((c: any) => ({
      id: String(c?.id),
      count: Number(c?.count ?? 0) || 0,
    }));

    return processed.core.map((row: any) => {
      const st = row.state as string;

      if (st === 'onboarding') {
        return {
          status_name: st,
          companies: realVerifiedList.map((c) => ({
            id: c.id,
            count: c.count,
            missed_interview_count: 0,
            cancelled_count: 0,
            rejected_count: 0,
            updated_required_count: 0,
            no_verified_count: 0,
            real_verified_count: c.count,
          })),
        };
      }

      // Estados con desglose ORIGINAL por empresa
      if (st === 'scheduled_interview' || st === 'interview_completed' || st === 'hired') {
        const orig = (processed as any).originalByState?.[st] ?? [];
        return {
          status_name: st,
          companies: orig.map((c: any) => ({
            id: c.id,
            count: Number(c.count ?? 0) || 0,
            missed_interview_count: Number(c.missed_interview_count ?? 0) || 0,
            cancelled_count: Number(c.cancelled_count ?? 0) || 0,
            rejected_count: Number(c.rejected_count ?? 0) || 0,
            updated_required_count: Number(c.updated_required_count ?? 0) || 0,
            no_verified_count: Number(c.no_verified_count ?? 0) || 0,
            real_verified_count:
              st === 'hired' ? (realVerifiedMap.get(String(c.id)) ?? 0) : 0,
          })),
        };
      }

      // Resto usa acumulados (solo id/count)
      return {
        status_name: st,
        companies: (row.companies_accumulated ?? []).map((c: any) => ({
          id: c.id,
          count: Number(c.count ?? 0) || 0,
        })),
      };
    });
  }, [processed]);

  // mapas de conteo ORIGINAL por estado -> empresa -> count
  const stateCompanyMap = useMemo(() => {
    const m = new Map<string, Map<string, number>>();
    for (const s of summaryForAccordion) {
      const inner = new Map<string, number>();
      for (const c of s.companies ?? []) inner.set(String(c.id), Number(c.count) || 0);
      m.set(s.status_name, inner);
    }
    return m;
  }, [summaryForAccordion]);

  // Evaluados originales por empresa
  const baseOriginalMap = useMemo(
    () => stateCompanyMap.get(BASE_STATE) ?? new Map<string, number>(),
    [stateCompanyMap]
  );

  const [selectionTotals, setSelectionTotals] = useState<
    Record<string, { ids: string[]; count: number }>
  >({});

  // IDs seleccionadas en Evaluados
  const screeningSelectedIds = useMemo(() => {
    const ids = selectionTotals[BASE_STATE]?.ids ?? [];
    return ids.length ? new Set(ids.map(String)) : null;
  }, [selectionTotals]);

  // Denominador = suma de Evaluados originales para IDs seleccionadas o total
  const baseDenominator = useMemo(() => {
    let sum = 0;
    if (screeningSelectedIds) {
      for (const [id, cnt] of baseOriginalMap) if (screeningSelectedIds.has(id)) sum += cnt;
    } else {
      for (const [, cnt] of baseOriginalMap) sum += cnt;
    }
    return Math.max(1, sum);
  }, [screeningSelectedIds, baseOriginalMap]);

  // helper: suma acumulada bottom-up para un estado core
  const cumulativeVisibleForState = useMemo(() => {
    // precalcular lista de mapas por estado en orden core
    const mapsInOrder = CORE_ORDER.map((s) => stateCompanyMap.get(s) ?? new Map<string, number>());
    const idxMap = Object.fromEntries(CORE_ORDER.map((s, i) => [s, i]));
    const NO_SUM_SET = new Set<string>(['onboarding']); // no se suma hacia arriba

    return (state: string) => {
      if (!CORE_ORDER.includes(state as any)) return 0;

      const start = idxMap[state];
      let total = 0;

      const iterStates = CORE_ORDER.slice(start);

      const addForId = (id: string) => {
        let accPerId = 0;
        for (const st of iterStates) {
          if (NO_SUM_SET.has(st)) {
            // onboarding no se suma hacia arriba; solo cuenta cuando state === 'onboarding'
            if (state === 'onboarding') accPerId += mapsInOrder[idxMap[st]].get(id) || 0;
          } else {
            accPerId += mapsInOrder[idxMap[st]].get(id) || 0;
          }
        }
        return accPerId;
      };

      if (screeningSelectedIds) {
        for (const id of screeningSelectedIds) total += addForId(String(id));
      } else {
        const companies = new Set<string>();
        for (const st of iterStates) {
          for (const key of mapsInOrder[idxMap[st]].keys()) companies.add(key);
        }
        for (const id of companies) total += addForId(id);
      }

      // para Evaluados, mostrar SIEMPRE su total original filtrado
      if (state === BASE_STATE) return baseDenominator;
      return total;
    };
  }, [stateCompanyMap, screeningSelectedIds, baseDenominator]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cascada de Conversión de Candidatos</CardTitle>
            <CardDescription>Seguimiento del proceso de contratación completo</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && <div>Cargando datos…</div>}
        {isError && <div className="text-red-600">No se pudo cargar el funnel.</div>}

        <div className="space-y-6">
          {(() => {
            const core = processed.core;
            const orderIndex = Object.fromEntries(CORE_ORDER.map((k, i) => [k, i]));
            const sortedCore = [...core]
              .filter(r => CORE_ORDER.includes(r.state as any))
              .sort((a, b) => (orderIndex[a.state] ?? 999) - (orderIndex[b.state] ?? 999));

            return (
              <Accordion type="single" collapsible className="space-y-2">
                {sortedCore.map((row: any, idx: number) => {
                  const { state, label, color } = row;

                  const visibleCount = cumulativeVisibleForState(state);
                  const percentVisible =
                    state === BASE_STATE ? 100 : Number(((visibleCount / baseDenominator) * 100).toFixed(1));

                  const widthPct = FORCE_PYRAMID
                    ? Math.max(PYRAMID_MIN_WIDTH, PYRAMID_BASE_WIDTH - idx * PYRAMID_STEP)
                    : 100;

                  return (
                    <AccordionItem key={state} value={state}>
                      <AccordionTrigger className="p-0 bg-transparent hover:no-underline">
                        <div
                          className="h-16 mx-auto rounded flex items-center justify-center text-white"
                          style={{ backgroundColor: color ?? '#94a3b8', width: `${widthPct}%` }}
                        >
                          <div className="text-center">
                            <div className="text-lg font-bold">{label ?? state}</div>
                            <div className="text-sm">
                              {Number(visibleCount).toLocaleString()} ({percentVisible.toFixed(1)}%)
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <StatusAccordion
                        status={state}
                        summary={summaryForAccordion}
                        storeMap={storeMap}
                        onSelectionChange={(visibleIds, visibleCountChild) => {
                          // Solo usamos IDs de Evaluados para filtrar denominador y numeradores
                          setSelectionTotals((prev) => ({
                            ...prev,
                            [state]: { ids: visibleIds, count: visibleCountChild },
                          }));
                        }}
                      />
                    </AccordionItem>
                  );
                })}
              </Accordion>
            );
          })()}

          <div className="text-xs text-muted-foreground">
            Total: {processed.total.toLocaleString()} eventos
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
