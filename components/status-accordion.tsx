// components/status-accordion.tsx
'use client';

import { AccordionContent } from '@/components/ui/accordion';
import * as R from 'recharts';
import { useMemo, useState, useEffect, useRef } from 'react';

type StoreMap = Map<string, string> | Record<string, string> | undefined;

type CompanyRow = {
  id: string;
  name: string;
  label: string;
  count: number;
  real_verified_count?: number;

  // breakdowns opcionales:
  hired_ok?: number;
  rejected_ok?: number;
  interviewed_total?: number;
  missed_interview_count?: number;
  cancelled_count?: number;
  cited_total?: number;
  not_cited?: number;
  scheduled_pending?: number;
  updated_required_count?: number;
  rejected_count?: number;

  // NUEVOS para hired
  no_verified_count?: number;      // leído desde summary
  hired_verified?: number;         // derivado (count - no_verified)
  hired_not_verified?: number;     // derivado (= no_verified)

  _isNumericId?: boolean;
};

type StatusAccordionProps = {
  status: string;
      summary?: Array<{
        status_name: string;
        companies: Array<{
          id: number | string;
          count: number;
          missed_interview_count?: number;
          cancelled_count?: number;
          rejected_count?: number;
          updated_required_count?: number;
          no_verified_count?: number;
          real_verified_count?: number;
        }>;
      }>;
  storeMap: StoreMap;
  onSelectionChange?: (visibleIds: string[], visibleCount: number) => void;
};

function isNumericId(id: number | string): boolean {
  if (typeof id === 'number') return Number.isFinite(id);
  const n = Number(id);
  return Number.isFinite(n) && String(n) === String(id).trim();
}

// Paleta unificada: azul oscuro -> claro
const palette = {
  darkest: '#1e3a8a', // azul muy oscuro
  dark: '#1d4ed8',    // azul oscuro
  mid: '#60a5fa',     // azul medio
  light: '#93c5fd',   // azul claro
};
const neutralGray = '#cbd5e1';

const statusColor: Record<string, string> = {
  screening_in_progress: palette.darkest,
  scheduled_interview: palette.dark,
  interview_completed: palette.dark,
  hired: palette.darkest,
  verified: palette.mid,
  onboarding: palette.light,
  rejected: '#ef4444',
  cancelled: palette.light,
  missed_interview: palette.mid,
  expired: '#64748b',
  updated_required: neutralGray, // “Sin actualizar” puede ir gris
};

function getStoreName(storeMap: StoreMap, id: string): string | undefined {
  if (!storeMap) return undefined;
  // Map
  // @ts-expect-error runtime check
  if (typeof (storeMap as any)?.get === 'function')
    return (storeMap as Map<string, string>).get(id);
  // Record
  const obj = storeMap as Record<string, string>;
  return obj[id] ?? obj[String(id)];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const fullName = payload[0]?.payload?.name || label;
  const single = payload.length === 1;
  const total = payload.reduce(
    (s: number, p: any) => s + (Number(p.value) || 0),
    0
  );
  return (
    <div className="rounded border bg-white p-2 text-sm shadow">
      <div className="mb-1 font-medium">{fullName}</div>
      {single ? (
        (() => {
          const p = payload[0];
          const name = p?.name ?? 'Candidatos';
          return (
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded"
                style={{ background: p.color }}
              />
              <span>
                {name}: {p.value}
              </span>
            </div>
          );
        })()
      ) : (
        <div className="space-y-0.5">
          {payload.map((p: any) => (
            <div key={String(p.dataKey)} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded"
                style={{ background: p.color }}
              />
              <span>
                {p.name}: {p.value}
              </span>
            </div>
          ))}
          <div className="mt-1 border-t pt-1">
            <span className="font-medium">Total:</span> {total}
          </div>
        </div>
      )}
    </div>
  );
}

export const StatusAccordion: React.FC<StatusAccordionProps> = ({
  status,
  summary,
  storeMap,
  onSelectionChange,
}) => {
  type Mode = 'all' | 'top' | 'coverage';
  const [mode, setMode] = useState<Mode>('all');
  const [topK, setTopK] = useState<number>(8);
  const [coveragePct, setCoveragePct] = useState<number>(90);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const barColor = statusColor[status] ?? palette.dark;

  const makeLabel = (displayName: string, numeric: boolean) =>
    numeric ? String(displayName).slice(0, 4) : String(displayName);

  const safeSummary = Array.isArray(summary) ? summary : [];

  // Índice por estado
  const byState = useMemo(() => {
    const map = new Map<
      string,
      {
        companies: Array<{
          id: string;
          count: number;
          missed_interview_count: number;
          cancelled_count: number;
          rejected_count: number;
          updated_required_count: number;
          no_verified_count: number;
          real_verified_count: number;
        }>;
      }
    >();
    for (const s of safeSummary) {
      map.set(s.status_name, {
        companies: (s.companies ?? []).map((c) => ({
          id: String(c.id),
          count: Number(c.count ?? 0) || 0,
          missed_interview_count: Number((c as any).missed_interview_count ?? 0) || 0,
          cancelled_count: Number((c as any).cancelled_count ?? 0) || 0,
          rejected_count: Number((c as any).rejected_count ?? 0) || 0,
          updated_required_count: Number((c as any).updated_required_count ?? 0) || 0,
          no_verified_count: Number((c as any).no_verified_count ?? 0) || 0,
          real_verified_count: Number((c as any).real_verified_count ?? 0) || 0,
        })),
      });
    }
    return map;
  }, [safeSummary]);

  // hired por empresa
  const hiredMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of byState.get('hired')?.companies ?? []) m.set(c.id, c.count);
    return m;
  }, [byState]);

  // rechazadas en interview_completed
  const interviewRejectedMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of byState.get('interview_completed')?.companies ?? []) {
      const rejected =
        c.rejected_count && c.rejected_count > 0 ? c.rejected_count : c.count;
      m.set(c.id, rejected);
    }
    return m;
  }, [byState]);

  // entrevistados totales
  const interviewsTotalMap = useMemo(() => {
    const m = new Map<string, number>();
    const keys = new Set<string>([
      ...Array.from(interviewRejectedMap.keys()),
      ...Array.from(hiredMap.keys()),
    ]);
    for (const id of keys) {
      const rejected = Math.max(0, interviewRejectedMap.get(id) || 0);
      const hired = Math.max(0, hiredMap.get(id) || 0);
      m.set(id, rejected + hired);
    }
    return m;
  }, [interviewRejectedMap, hiredMap]);

  const scheduledOrigMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of byState.get('scheduled_interview')?.companies ?? [])
      m.set(c.id, c.count);
    return m;
  }, [byState]);

  const scheduledBreakdownMap = useMemo(() => {
    const m = new Map<string, { missed: number; cancelled: number; updated: number }>();
    for (const c of byState.get('scheduled_interview')?.companies ?? []) {
      m.set(c.id, {
        missed: c.missed_interview_count || 0,
        cancelled: c.cancelled_count || 0,
        updated: c.updated_required_count || 0,
      });
    }
    return m;
  }, [byState]);

  // Filas base
  const rawRows = useMemo<CompanyRow[]>(() => {
    const statusData = byState.get(status)?.companies ?? [];
    return statusData.map((c) => {
      const idStr = c.id;
      const numeric = isNumericId(idStr);
      const baseName = numeric ? getStoreName(storeMap, idStr) ?? idStr : idStr;
      const label = makeLabel(baseName, numeric);
      return {
        id: idStr,
        name: baseName,
        label,
        count: c.count,
        real_verified_count: c.real_verified_count,
        missed_interview_count: c.missed_interview_count,
        cancelled_count: c.cancelled_count,
        rejected_count: c.rejected_count,
        updated_required_count: c.updated_required_count,
        no_verified_count: c.no_verified_count,
        _isNumericId: numeric,
      };
    });
  }, [byState, status, storeMap]);

  // IDs río abajo por estado (para phantoms)
  const hiredIds = useMemo(
    () => new Set((byState.get('hired')?.companies ?? []).map((c) => String(c.id))),
    [byState]
  );
  const scheduledIds = useMemo(
    () => new Set((byState.get('scheduled_interview')?.companies ?? []).map((c) => String(c.id))),
    [byState]
  );
  const interviewedIds = useMemo(
    () => new Set((byState.get('interview_completed')?.companies ?? []).map((c) => String(c.id))),
    [byState]
  );

  // --- PHANTOM ROWS (solo para el gráfico) ---
  const augmentedRawRows = useMemo<CompanyRow[]>(() => {
    const have = new Set(rawRows.map((r) => String(r.id)));
    const addRow = (id: string, baseName: string): CompanyRow => ({
      id,
      name: baseName,
      label: makeLabel(baseName, isNumericId(id)),
      count: 0,
      hired_ok: 0,
      rejected_ok: 0,
      interviewed_total: 0,
      missed_interview_count: 0,
      cancelled_count: 0,
      cited_total: 0,
      not_cited: 0,
      scheduled_pending: 0,
      updated_required_count: 0,
      rejected_count: 0,
      no_verified_count: 0,
      hired_verified: 0,
      hired_not_verified: 0,
      _isNumericId: isNumericId(id),
    });

    const nameOf = (id: string) => getStoreName(storeMap, id) ?? id;

    const rows = [...rawRows];

    if (status === 'screening_in_progress') {
      const union = new Set<string>([
        ...Array.from(scheduledIds),
        ...Array.from(interviewedIds),
        ...Array.from(hiredIds),
      ]);

      for (const id of union) {
        if (have.has(id)) continue;

        const baseName = nameOf(id);
        const r = addRow(id, baseName);

        const cited = Math.max(0, scheduledOrigMap.get(id) || 0);
        const interviewed = Math.max(0, interviewsTotalMap.get(id) || 0);
        const hired = Math.max(0, hiredMap.get(id) || 0);

        const original = Math.max(cited, interviewed, hired);
        r.cited_total = cited;
        r.count = original; // original "simulado"
        r.not_cited = Math.max(0, original - cited);

        rows.push(r);
      }
    } else if (status === 'scheduled_interview') {
      const union = new Set<string>([
        ...Array.from(interviewedIds),
        ...Array.from(hiredIds),
      ]);

      for (const id of union) {
        if (have.has(id)) continue;

        const baseName = nameOf(id);
        const r = addRow(id, baseName);

        const interviewed_total = Math.max(0, interviewsTotalMap.get(id) || hiredMap.get(id) || 0);
        r.interviewed_total = interviewed_total;
        r.missed_interview_count = 0;
        r.cancelled_count = 0;
        r.updated_required_count = 0;
        r.scheduled_pending = 0;
        r.count = interviewed_total;

        rows.push(r);
      }
    } else if (status === 'interview_completed') {
      for (const id of hiredIds) {
        if (have.has(id)) continue;

        const baseName = nameOf(id);
        const r = addRow(id, baseName);

        const hired_ok = Math.max(0, hiredMap.get(id) || 0);
        r.hired_ok = hired_ok;
        r.rejected_ok = 0;
        r.count = hired_ok;

        rows.push(r);
      }
    } else if (status === 'hired') {
      // hired: no hace falta phantom; ya vienen desde byState('hired')
    }
    // onboarding: tampoco phantom; vienen directos desde summary (derivado)

    return rows.sort((a, b) => b.count - a.count);
  }, [
    rawRows,
    status,
    storeMap,
    scheduledIds,
    interviewedIds,
    hiredIds,
    scheduledOrigMap,
    interviewsTotalMap,
    hiredMap,
  ]);

  // Cascada inclusiva
  const rows = useMemo<CompanyRow[]>(() => {
    if (status === 'interview_completed') {
      return augmentedRawRows
        .map((r) => {
          const rejected = Math.max(
            0,
            interviewRejectedMap.get(r.id) ?? r.rejected_count ?? r.count ?? 0
          );
          const hired = Math.max(0, hiredMap.get(r.id) || 0);
          const total = rejected + hired;
          return { ...r, rejected_ok: rejected, hired_ok: hired, count: total };
        })
        .sort((a, b) => b.count - a.count);
    }

    if (status === 'scheduled_interview') {
      return augmentedRawRows
        .map((r) => {
          const interviewed_total = Math.max(
            0,
            interviewsTotalMap.get(r.id) || r.interviewed_total || 0
          );
          const brk = scheduledBreakdownMap.get(r.id) || {
            missed: r.missed_interview_count || 0,
            cancelled: r.cancelled_count || 0,
            updated: r.updated_required_count || 0,
          };
          const missed = Math.max(0, brk.missed);
          const cancelled = Math.max(0, brk.cancelled);
          const updated = Math.max(0, brk.updated);
          const original = Math.max(0, r.count);
          const pending = Math.max(
            0,
            original - (interviewed_total + missed + cancelled + updated)
          );
          const total =
            interviewed_total + missed + pending + cancelled + updated;
          return {
            ...r,
            interviewed_total,
            missed_interview_count: missed,
            cancelled_count: cancelled,
            updated_required_count: updated,
            scheduled_pending: pending,
            count: total,
          };
        })
        .sort((a, b) => b.count - a.count);
    }

    if (status === 'screening_in_progress') {
      return augmentedRawRows
        .map((r) => {
          const cited_total = Math.max(
            0,
            scheduledOrigMap.get(r.id) || r.cited_total || 0
          );
          const original = Math.max(0, r.count);
          const not_cited = Math.max(0, original - cited_total);
          const total = Math.max(original, cited_total);
          return { ...r, cited_total, not_cited, count: total };
        })
        .sort((a, b) => b.count - a.count);
    }

    if (status === 'hired') {
      return augmentedRawRows
        .map((r) => {
          const noVer = Math.max(0, r.no_verified_count || 0);
          const total = Math.max(0, r.count || 0);
          const verified = Math.max(0, total - noVer);
          return {
            ...r,
            hired_verified: verified,
            hired_not_verified: noVer,
            count: total,
          };
        })
        .sort((a, b) => b.count - a.count);
    }

    if (status === 'onboarding') {
      // “Ingresados”: ya vienen como verified de hired desde summary/processed
      return [...augmentedRawRows]
        .map((r) => ({ ...r, count: Math.max(0, r.count || 0) }))
        .sort((a, b) => b.count - a.count);
    }

    return [...augmentedRawRows].sort((a, b) => b.count - a.count);
  }, [
    augmentedRawRows,
    status,
    hiredMap,
    interviewRejectedMap,
    interviewsTotalMap,
    scheduledBreakdownMap,
    scheduledOrigMap,
  ]);

  // Segmentos (orden bottom -> top) y etiquetas pedidas
  const segments = useMemo(() => {
    if (status === 'interview_completed') {
      return [
        { key: 'rejected_ok' as const, label: 'Rechazadas', color: palette.mid },
        { key: 'hired_ok' as const, label: 'Contratados', color: palette.darkest },
      ];
    }

    if (status === 'scheduled_interview') {
      return [
        { key: 'interviewed_total' as const, label: 'Citas Completadas', color: palette.darkest },
        { key: 'missed_interview_count' as const, label: 'Perdidas', color: palette.dark },
        { key: 'scheduled_pending' as const, label: 'Pendientes', color: palette.mid },
        { key: 'cancelled_count' as const, label: 'Canceladas', color: palette.light },
        { key: 'updated_required_count' as const, label: 'Sin actualizar', color: neutralGray },
      ];
    }

    if (status === 'screening_in_progress') {
      return [
        { key: 'cited_total' as const, label: 'Citados', color: palette.dark },
        { key: 'not_cited' as const, label: 'No citados', color: neutralGray },
      ];
    }

    if (status === 'hired') {
      // Verificados: azul más oscuro | No verificados: gris
      return [
        { key: 'hired_verified' as const, label: 'Presentados 1er día', color: palette.darkest },
        { key: 'hired_not_verified' as const, label: 'No presentados 1er día', color: neutralGray },
      ];
    }

    // onboarding: sin segmentos -> barra simple
    return [] as const;
  }, [status]);

  // Reducciones (Top/Cobertura)
  const chartData = useMemo<CompanyRow[]>(() => {
    if (rows.length === 0) return rows;
    if (mode === 'all') return rows;

    const fold = (list: CompanyRow[]) => {
      const acc: CompanyRow = {
        id: 'otros',
        name: 'Otros',
        label: 'Otros',
        count: 0,
      };
      for (const r of list) {
        for (const k of Object.keys(r)) {
          if (typeof (r as any)[k] === 'number') {
            (acc as any)[k] = ((acc as any)[k] || 0) + (r as any)[k];
          }
        }
      }
      return acc;
    };

    if (mode === 'top') {
      const k = Math.max(1, topK | 0);
      const head = rows.slice(0, k);
      const rest = rows.slice(k);
      if (rest.length) head.push(fold(rest));
      return head;
    }

    const total = rows.reduce((s, r) => s + (r.count || 0), 0) || 1;
    const target = Math.min(100, Math.max(1, coveragePct)) / 100;
    const pick: CompanyRow[] = [];
    let accCount = 0;
    for (const r of rows) {
      if (accCount / total >= target) break;
      pick.push(r);
      accCount += r.count || 0;
    }
    const rest = rows.slice(pick.length);
    if (rest.length) pick.push(fold(rest));
    return pick;
  }, [rows, mode, topK, coveragePct]);

  const filteredChartData = useMemo(
    () => chartData.filter((d) => !hidden.has(String(d.id))),
    [chartData, hidden]
  );

  const lastSigRef = useRef<string>('');
  useEffect(() => {
    if (!onSelectionChange) return;
    const visibleIds = filteredChartData.map((d) => String(d.id));
    const visibleCount = filteredChartData.reduce(
      (sum, d) => sum + (d.count || 0),
      0
    );
    const sig = `${status}|${visibleCount}|${visibleIds.join(',')}`;
    if (sig === lastSigRef.current) return;
    lastSigRef.current = sig;
    onSelectionChange(visibleIds, visibleCount);
  }, [filteredChartData, onSelectionChange, status]);

  if (!filteredChartData.length) return <AccordionContent>Sin datos</AccordionContent>;
  const usesStack = segments.length > 0;

  return (
    <AccordionContent>
      {/* Toolbar */}
      <div className="mb-3 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border">
            {(['all', 'top', 'coverage'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 text-sm ${
                  mode === m ? 'bg-black text-white' : 'bg-white text-black'
                } ${m !== 'coverage' ? 'border-r' : ''}`}
              >
                {m === 'all' ? 'Todos' : m === 'top' ? 'Top N' : 'Cobertura'}
              </button>
            ))}
          </div>

          {mode === 'top' && (
            <label className="flex items-center gap-2 text-sm">
              N:
              <input
                type="number"
                min={1}
                className="h-8 w-16 rounded border px-2"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value || '1', 10) || 1)}
              />
            </label>
          )}

          {mode === 'coverage' && (
            <label className="flex items-center gap-2 text-sm">
              Cobertura %:
              <input
                type="number"
                min={1}
                max={100}
                className="h-8 w-20 rounded border px-2"
                value={coveragePct}
                onChange={(e) =>
                  setCoveragePct(
                    Math.min(100, Math.max(1, parseInt(e.target.value || '90', 10) || 90))
                  )
                }
              />
            </label>
          )}
        </div>

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-2">
          {rows.map((d) => {
            const key = String(d.id);
            const checked = !hidden.has(key);
            return (
              <label
                key={key}
                className="flex items-center gap-1 text-xs border rounded px-2 py-1"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setHidden((prev) => {
                      const n = new Set(prev);
                      if (n.has(key)) n.delete(key);
                      else n.add(key);
                      return n;
                    })
                  }
                />
                <span className="truncate max-w-[120px]">{d.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[260px] w-full">
        <R.ResponsiveContainer width="100%" height="100%">
          <R.BarChart data={filteredChartData}>
            <R.CartesianGrid vertical={false} />
            <R.XAxis dataKey="label" />
            <R.YAxis allowDecimals={false} />
            <R.Tooltip content={<CustomTooltip />} />
            {usesStack ? (
              // El orden aquí define el apilado bottom -> top y por tanto el orden de colores
              segments.map((seg, i) => (
                <R.Bar
                  key={String(seg.key)}
                  dataKey={seg.key as string}
                  name={seg.label}
                  stackId="a"
                  radius={i === 0 ? [4, 4, 0, 0] : 0}
                  fill={seg.color}
                />
              ))
            ) : (
              <R.Bar dataKey="count" name="Candidatos" radius={4} fill={barColor} />
            )}
          </R.BarChart>
        </R.ResponsiveContainer>
      </div>
    </AccordionContent>
  );
};

export default StatusAccordion;
