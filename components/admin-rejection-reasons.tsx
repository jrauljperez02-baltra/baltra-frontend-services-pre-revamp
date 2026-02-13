'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useCompanyID } from '@/context/CompanyContext';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRejections } from '@/lib/admin-api';
import type { UserAttributes } from '@/lib/user-attributes';

interface AdminRejectionReasonsProps {
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

// ---- helpers ----
const REASON_ES: Record<string, string> = {
  abscense: 'Inasistencia',
  absence: 'Inasistencia',
  abscense_first_day: 'Inasistencia primer día',
  poor_performance: 'Bajo desempeño',
  poor_experience: 'Poca experiencia',
  offer_declined: 'Rechazó la oferta',
  location_availability: 'Disponibilidad por ubicación',
  minimal_requirements: 'No cumple requisitos mínimos',
  cv_inconsistencies: 'Inconsistencias en CV',
  technical_test_failure: 'Falló prueba técnica',
  salary_expectations: 'Expectativas salariales',
  other: 'Otro',
  nivel_educacion: 'Nivel de educación',
};

type RawItem = { reason: string; count?: number; percent?: number; percentage?: number };

function translateReason(reason: string): string {
  const key = String(reason || '').trim().toLowerCase();
  if (REASON_ES[key]) return REASON_ES[key];
  // si viene con underscores, lo formateamos
  if (key.includes('_')) {
    return key
      .split('_')
      .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ');
  }
  return reason; // ya viene en español o texto libre
}

function normalize(
  payload: any
): { items: Array<{ reason: string; count: number; percentage: number }>; total: number } {
  const data: RawItem[] = Array.isArray(payload) ? payload : payload?.data ?? [];
  const totalFromMeta: number | undefined = Array.isArray(payload) ? undefined : payload?.meta?.total;

  // si no hay total en meta, lo calculamos
  const computedTotal =
    typeof totalFromMeta === 'number'
      ? totalFromMeta
      : data.reduce((s, it) => s + (it.count ?? 0), 0);

  const items = data.map(it => {
    const count = it.count ?? 0;
    const pct =
      it.percentage ??
      it.percent ??
      (computedTotal > 0 ? (count / computedTotal) * 100 : 0);
    return {
      reason: translateReason(it.reason),
      count,
      percentage: Number(pct.toFixed(2)),
    };
  });

  return { items, total: computedTotal };
}

export function AdminRejectionReasons({
  selectedStore,
  selectedIds,
  dateRange,
  attrs,
}: AdminRejectionReasonsProps) {
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

  const { data: chatRaw, isLoading: loadingChat } = useQuery({
    queryKey: ['admin-rejections', companyId, 'chat', apiParams],
    queryFn: async () => fetchRejections(companyId, 'chat', apiParams),
    enabled: !!attrs,
  });

  const { data: manualRaw, isLoading: loadingManual } = useQuery({
    queryKey: ['admin-rejections', companyId, 'manual', apiParams],
    queryFn: async () => fetchRejections(companyId, 'manual', apiParams),
    enabled: !!attrs,
  });

  const { items: chatRejections, total: totalChatRejections } = useMemo(
    () => normalize(chatRaw ?? []),
    [chatRaw]
  );

  const { items: manualRejections, total: totalManualRejections } = useMemo(
    () => normalize(manualRaw ?? []),
    [manualRaw]
  );

  const totalRejections = totalChatRejections + totalManualRejections;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Motivos de rechazo</CardTitle>
        <CardDescription>Candidatos rechazados por motivo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chat Rejections Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1e40af' }} />
            <h4 className="font-semibold" style={{ color: '#1e40af' }}>
              Rechazo por bot (chat)
            </h4>
          </div>

          <div className="space-y-3 ml-5">
            {((loadingChat ? [] : chatRejections) as typeof chatRejections).map((item, index) => (
              <div key={item.reason ?? `chat-${index}-${item.count}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.reason}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{item.count}</span>
                    <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="ml-6">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ backgroundColor: '#1e40af', width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Rejections Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
            <h4 className="font-semibold" style={{ color: '#1e40af' }}>
              Rechazo equipo
            </h4>
          </div>

          <div className="space-y-3 ml-5">
            {((loadingManual ? [] : manualRejections) as typeof manualRejections).map(
              (item, index) => (
                <div key={item.reason ?? `manual-${index}-${item.count}`} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.reason}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{item.count}</span>
                      <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                    </div>
                  </div>
                  <div className="ml-6">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ backgroundColor: '#3b82f6', width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Total Summary */}
        <div className="pt-4 border-t">
          <div className="text-sm text-center">
            <span className="font-medium">Total rechazos: {totalRejections}</span>
            <span className="ml-2" style={{ color: '#1e40af' }}>
              ({totalChatRejections} en chat)
            </span>
            <span className="ml-2" style={{ color: '#1e40af' }}>
              ({totalManualRejections} manual)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
