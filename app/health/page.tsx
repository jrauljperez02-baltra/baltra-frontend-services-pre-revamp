'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Space_Grotesk, Fraunces } from 'next/font/google';
import { BACKEND_BASE_URL, CLOUDWATCH_REGION } from '@/config/env';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });
const fraunces = Fraunces({ subsets: ['latin'] });

type HealthSnapshot = {
    ok?: boolean;
    status?: string;
    alerts?: string[];
    degraded_reasons?: string[];
    snapshot_age_seconds?: number | null;
    checks?: {
        database?: { ok?: boolean };
        conversations?: Record<string, number>;
        messages?: Record<string, number>;
        reminders?: Record<string, number>;
        pending_user_messages?: Record<string, number>;
        http_metrics?: Record<string, number | null>;
        insights?: Record<
            string,
            {
                count?: number;
                window_seconds?: number;
                log_group?: string;
                rows?: Array<Record<string, string>>;
            }
        >;
        insights_last_run_at?: string | null;
    };
};

type InsightsDynamicResponse = {
    ok: boolean;
    window_seconds: number;
    limit: number;
    pattern: string;
    cache_hit?: boolean;
    generated_at?: number;
    time_range?: { start_time: number; end_time: number };
    results: NonNullable<HealthSnapshot['checks']>['insights'];
};

const cardBase =
    'rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.18)] backdrop-blur';

const badgeClass = (tone: 'ok' | 'warn' | 'err') => {
    if (tone === 'ok') return 'bg-emerald-400/15 text-emerald-200 border-emerald-400/30';
    if (tone === 'warn') return 'bg-amber-400/15 text-amber-200 border-amber-400/30';
    return 'bg-rose-400/15 text-rose-200 border-rose-400/30';
};

function formatValue(value: number | string | null | undefined) {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') return value.toLocaleString('en-US');
    return value;
}

function encodeCloudWatchFragment(value: string) {
    return encodeURIComponent(value).replace(/%/g, '$');
}

function buildCloudWatchLogStreamUrl(params: {
    region: string;
    logGroup: string;
    logStream: string;
}) {
    const group = encodeCloudWatchFragment(params.logGroup);
    const stream = encodeCloudWatchFragment(params.logStream);
    return `https://${params.region}.console.aws.amazon.com/cloudwatch/home?region=${params.region}#logsV2:log-groups/log-group/${group}/log-events/${stream}`;
}

function buildCloudWatchLogGroupUrl(params: { region: string; logGroup: string }) {
    const group = encodeCloudWatchFragment(params.logGroup);
    return `https://${params.region}.console.aws.amazon.com/cloudwatch/home?region=${params.region}#logsV2:log-groups/log-group/${group}`;
}

export default function HealthPage() {
    const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
    const [errorThreshold, setErrorThreshold] = useState(1);
    const [insightsNameFilter, setInsightsNameFilter] = useState('');
    const [insightsMinCount, setInsightsMinCount] = useState(0);
    const [insightsMinWindow, setInsightsMinWindow] = useState(60);
    const [insightsMaxWindow, setInsightsMaxWindow] = useState(3600);
    const [insightsFromDate, setInsightsFromDate] = useState('');
    const [insightsToDate, setInsightsToDate] = useState('');
    const [insightsPageSize, setInsightsPageSize] = useState(10);
    const [insightsPageByName, setInsightsPageByName] = useState<
        Record<string, number>
    >({});
    const [insightsQueryLimit, setInsightsQueryLimit] = useState(200);
    const [insightsQueryPattern, setInsightsQueryPattern] = useState(
        'ERROR|Exception|Traceback'
    );
    const [insightsSelectedName, setInsightsSelectedName] = useState<string>('all');
    const [insightsDynamic, setInsightsDynamic] =
        useState<InsightsDynamicResponse | null>(null);
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [insightsError, setInsightsError] = useState<string | null>(null);

    const fetchSnapshot = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => controller.abort(), 15000);
            const response = await fetch(
                `${BACKEND_BASE_URL.replace(/\/$/, '')}/health`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                }
            );
            window.clearTimeout(timeoutId);
            if (!response.ok) {
                const text = await response.text();
                throw new Error(
                    `Health request failed (${response.status}): ${text}`
                );
            }
            const data = (await response.json()) as HealthSnapshot;
            setSnapshot(data);
            setLastFetchedAt(new Date().toISOString());
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Unknown error';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchInsights = useCallback(async () => {
        setInsightsLoading(true);
        setInsightsError(null);
        try {
            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => controller.abort(), 20000);
            const minWindow = Math.max(60, Number(insightsMinWindow || 0));
            const maxWindow = Math.max(minWindow, Number(insightsMaxWindow || 0));
            const params = new URLSearchParams();
            params.set('limit', String(insightsQueryLimit));
            params.set('pattern', insightsQueryPattern);
            params.set('name_contains', insightsNameFilter.trim());
            params.set('min_count', String(Math.max(0, insightsMinCount)));
            params.set('window_min_seconds', String(minWindow));
            params.set('window_max_seconds', String(maxWindow));
            if (insightsFromDate) {
                const parsed = Date.parse(insightsFromDate);
                if (!Number.isNaN(parsed)) {
                    params.set('from_epoch_ms', String(parsed));
                }
            }
            if (insightsToDate) {
                const parsed = Date.parse(insightsToDate);
                if (!Number.isNaN(parsed)) {
                    params.set('to_epoch_ms', String(parsed));
                }
            }
            const response = await fetch(
                `${BACKEND_BASE_URL.replace(/\/$/, '')}/health/insights?${params.toString()}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                }
            );
            window.clearTimeout(timeoutId);
            if (!response.ok) {
                const text = await response.text();
                throw new Error(
                    `Insights request failed (${response.status}): ${text}`
                );
            }
            const data = (await response.json()) as InsightsDynamicResponse;
            setInsightsDynamic(data);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Unknown error';
            setInsightsError(message);
        } finally {
            setInsightsLoading(false);
        }
    }, [
        insightsQueryLimit,
        insightsQueryPattern,
        insightsNameFilter,
        insightsMinCount,
        insightsMinWindow,
        insightsMaxWindow,
        insightsFromDate,
        insightsToDate,
    ]);

    useEffect(() => {
        fetchSnapshot();
        const intervalId = window.setInterval(fetchSnapshot, 60_000);
        return () => window.clearInterval(intervalId);
    }, [fetchSnapshot]);

    const statusTone = useMemo(() => {
        if (!snapshot) return 'warn';
        if (snapshot.ok && snapshot.status === 'ok') return 'ok';
        if (snapshot.ok && snapshot.status === 'degraded') return 'warn';
        return 'err';
    }, [snapshot]);

    const statusLabel = useMemo(() => {
        if (!snapshot) return 'Loading';
        if (!snapshot.ok) return 'Error';
        return snapshot.status ?? 'Unknown';
    }, [snapshot]);

    const errorCounts = useMemo(() => {
        const metrics = snapshot?.checks?.http_metrics ?? {};
        const count10m = Number(metrics.error_count_10m ?? 0);
        const count5m = Number(metrics.error_count_5m ?? 0);
        return { count10m, count5m };
    }, [snapshot]);

    const insightsList = useMemo(() => {
        const insights = insightsDynamic?.results ?? snapshot?.checks?.insights ?? {};
        const entries = Object.entries(insights);
        return entries.filter(([name, value]) => {
            if (insightsSelectedName !== 'all' && name !== insightsSelectedName) {
                return false;
            }
            const normalized = insightsNameFilter.trim().toLowerCase();
            const matchesName = normalized
                ? name.toLowerCase().includes(normalized)
                : true;
            const count = Number(value.count ?? 0);
            const windowSeconds = Number(value.window_seconds ?? 0);
            return (
                matchesName &&
                count >= insightsMinCount &&
                windowSeconds >= insightsMinWindow &&
                windowSeconds <= insightsMaxWindow
            );
        });
    }, [
        snapshot,
        insightsDynamic,
        insightsSelectedName,
        insightsNameFilter,
        insightsMinCount,
        insightsMinWindow,
        insightsMaxWindow,
    ]);

    const availableInsightNames = useMemo(() => {
        const insights = insightsDynamic?.results ?? snapshot?.checks?.insights ?? {};
        return Object.keys(insights).sort((a, b) => a.localeCompare(b));
    }, [snapshot, insightsDynamic]);

    const setInsightsPage = useCallback((name: string, page: number) => {
        setInsightsPageByName((prev) => ({ ...prev, [name]: Math.max(0, page) }));
    }, []);

    return (
        <div
            className={`${spaceGrotesk.className} min-h-screen px-6 py-12 text-slate-100`}
            style={{
                background:
                    'radial-gradient(circle at 20% 20%, rgba(34,197,94,0.15), transparent 40%), radial-gradient(circle at 80% 15%, rgba(245,158,11,0.18), transparent 45%), radial-gradient(circle at 50% 85%, rgba(14,116,144,0.25), transparent 55%), #0b111a',
            }}
        >
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
                <header className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80">
                                SOLID Health Monitor
                            </p>
                            <h1
                                className={`${fraunces.className} text-4xl font-semibold text-slate-50 md:text-5xl`}
                            >
                                Estado operacional del backend
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-200/80">
                                Snapshot en vivo del flujo SOLID, errores HTTP e
                                Insights. Refresco automatico cada 60 segundos.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                className="rounded-full border border-slate-200/20 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-emerald-200/60 hover:bg-emerald-200/10"
                                onClick={fetchSnapshot}
                                disabled={loading}
                            >
                                {loading ? 'Actualizando...' : 'Actualizar'}
                            </button>
                            <span
                                className={`rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-widest ${badgeClass(
                                    statusTone as 'ok' | 'warn' | 'err'
                                )}`}
                            >
                                {statusLabel}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-300/80">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            Snapshot age:{' '}
                            {formatValue(snapshot?.snapshot_age_seconds)}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            Ultimo fetch:{' '}
                            {lastFetchedAt
                                ? new Date(lastFetchedAt).toLocaleString()
                                : '—'}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            Insights run:{' '}
                            {snapshot?.checks?.insights_last_run_at
                                ? new Date(
                                      snapshot.checks.insights_last_run_at
                                  ).toLocaleString()
                                : '—'}
                        </span>
                    </div>
                    {error ? (
                        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">
                            {error}
                        </div>
                    ) : null}
                </header>

                <section className="grid gap-6 md:grid-cols-2">
                    <div className={cardBase}>
                        <h2 className="text-lg font-semibold text-slate-50">
                            Alertas activas
                        </h2>
                        <p className="mt-1 text-xs text-slate-300/70">
                            Condiciones que disparan alertas en el sistema.
                        </p>
                        <div className="mt-4 flex flex-wrap items-end gap-3">
                            <div className="flex flex-col gap-1 text-xs text-slate-300/70">
                                Umbral errores (10m)
                                <input
                                    type="number"
                                    min={0}
                                    value={errorThreshold}
                                    onChange={(event) =>
                                        setErrorThreshold(
                                            Math.max(0, Number(event.target.value))
                                        )
                                    }
                                    className="w-24 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-slate-100"
                                />
                            </div>
                            <div className="text-xs text-slate-400/70">
                                Errores 10m: {formatValue(errorCounts.count10m)} ·
                                Errores 5m: {formatValue(errorCounts.count5m)}
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {snapshot?.alerts?.length ? (
                                snapshot.alerts
                                    .filter((alert) => {
                                        if (alert !== 'http_errors') return true;
                                        return errorCounts.count10m >= errorThreshold;
                                    })
                                    .map((alert) => (
                                    <span
                                        key={alert}
                                        className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs uppercase tracking-wider text-amber-100"
                                    >
                                        {alert}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-slate-300/70">
                                    No hay alertas activas.
                                </span>
                            )}
                        </div>
                        <div className="mt-6 text-xs text-slate-400/70">
                            Degraded reasons:{' '}
                            {snapshot?.degraded_reasons?.length
                                ? snapshot.degraded_reasons.join(', ')
                                : '—'}
                        </div>
                    </div>

                    <div className={cardBase}>
                        <h2 className="text-lg font-semibold text-slate-50">
                            Errores & latencia HTTP
                        </h2>
                        <p className="mt-1 text-xs text-slate-300/70">
                            Captura local por middleware HTTP.
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            {Object.entries(
                                snapshot?.checks?.http_metrics ?? {}
                            ).map(([key, value]) => (
                                <div
                                    key={key}
                                    className="rounded-xl border border-white/5 bg-white/5 p-3"
                                >
                                    <div className="text-xs uppercase tracking-widest text-slate-400/70">
                                        {key.replace(/_/g, ' ')}
                                    </div>
                                    <div className="mt-2 text-xl font-semibold text-slate-50">
                                        {formatValue(value ?? null)}
                                    </div>
                                </div>
                            ))}
                            {!snapshot?.checks?.http_metrics ? (
                                <p className="text-sm text-slate-300/70">
                                    Sin datos de metricas HTTP.
                                </p>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-3">
                    <div className={cardBase}>
                        <h3 className="text-base font-semibold text-slate-50">
                            Conversaciones
                        </h3>
                        <div className="mt-4 space-y-3 text-sm">
                            {Object.entries(
                                snapshot?.checks?.conversations ?? {}
                            ).map(([key, value]) => (
                                <div
                                    key={key}
                                    className="flex items-center justify-between border-b border-white/5 pb-2"
                                >
                                    <span className="text-slate-300/80">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-slate-50">
                                        {formatValue(value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={cardBase}>
                        <h3 className="text-base font-semibold text-slate-50">
                            Mensajes
                        </h3>
                        <div className="mt-4 space-y-3 text-sm">
                            {Object.entries(
                                snapshot?.checks?.messages ?? {}
                            ).map(([key, value]) => (
                                <div
                                    key={key}
                                    className="flex items-center justify-between border-b border-white/5 pb-2"
                                >
                                    <span className="text-slate-300/80">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-slate-50">
                                        {formatValue(value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={cardBase}>
                        <h3 className="text-base font-semibold text-slate-50">
                            Reminders & pendientes
                        </h3>
                        <div className="mt-4 space-y-3 text-sm">
                            {Object.entries(
                                snapshot?.checks?.reminders ?? {}
                            ).map(([key, value]) => (
                                <div
                                    key={key}
                                    className="flex items-center justify-between border-b border-white/5 pb-2"
                                >
                                    <span className="text-slate-300/80">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-slate-50">
                                        {formatValue(value)}
                                    </span>
                                </div>
                            ))}
                            {Object.entries(
                                snapshot?.checks?.pending_user_messages ?? {}
                            ).map(([key, value]) => (
                                <div
                                    key={key}
                                    className="flex items-center justify-between border-b border-white/5 pb-2"
                                >
                                    <span className="text-slate-300/80">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-slate-50">
                                        {formatValue(value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-1">
                    <div className={cardBase}>
                        <h3 className="text-base font-semibold text-slate-50">
                            CloudWatch Insights
                        </h3>
                        <p className="mt-1 text-xs text-slate-300/70">
                            Snapshot cacheado cada 10 minutos; filtros consultan Insights en vivo (cache 30s).
                        </p>
                        <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300/70 md:grid-cols-2">
                            <label className="flex flex-col gap-2">
                                Query (seleccionar)
                                <select
                                    value={insightsSelectedName}
                                    onChange={(event) =>
                                        setInsightsSelectedName(event.target.value)
                                    }
                                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100"
                                >
                                    <option value="all">Todas</option>
                                    {availableInsightNames.map((name) => (
                                        <option key={name} value={name}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-2">
                                Query limit
                                <input
                                    type="number"
                                    min={1}
                                    max={200}
                                    value={insightsQueryLimit}
                                    onChange={(event) =>
                                        setInsightsQueryLimit(
                                            Math.max(
                                                1,
                                                Math.min(
                                                    200,
                                                    Number(event.target.value)
                                                )
                                            )
                                        )
                                    }
                                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100"
                                />
                            </label>
                            <label className="flex flex-col gap-2 md:col-span-2">
                                Pattern
                                <input
                                    type="text"
                                    value={insightsQueryPattern}
                                    onChange={(event) =>
                                        setInsightsQueryPattern(event.target.value)
                                    }
                                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100"
                                />
                            </label>
                            <label className="flex flex-col gap-2">
                                Nombre contiene
                                <input
                                    type="text"
                                    value={insightsNameFilter}
                                    onChange={(event) =>
                                        setInsightsNameFilter(event.target.value)
                                    }
                                    placeholder="errors_10m"
                                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100"
                                />
                            </label>
                            <label className="flex flex-col gap-2">
                                Minimo conteo
                                <input
                                    type="number"
                                    min={0}
                                    value={insightsMinCount}
                                    onChange={(event) =>
                                        setInsightsMinCount(
                                            Math.max(0, Number(event.target.value))
                                        )
                                    }
                                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100"
                                />
                            </label>
                            <label className="flex flex-col gap-2">
                                Window minimo (s)
                                <input
                                    type="number"
                                    min={60}
                                    value={insightsMinWindow}
                                    onChange={(event) =>
                                        setInsightsMinWindow(
                                            Math.max(60, Number(event.target.value))
                                        )
                                    }
                                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100"
                                />
                            </label>
                            <label className="flex flex-col gap-2">
                                Window maximo (s)
                                <input
                                    type="number"
                                    min={60}
                                    value={insightsMaxWindow}
                                    onChange={(event) =>
                                        setInsightsMaxWindow(
                                            Math.max(60, Number(event.target.value))
                                        )
                                    }
                                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100"
                                />
                            </label>
                            <label className="flex flex-col gap-2">
                                Fecha desde
                                <input
                                    type="datetime-local"
                                    value={insightsFromDate}
                                    onChange={(event) =>
                                        setInsightsFromDate(event.target.value)
                                    }
                                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100"
                                />
                            </label>
                            <label className="flex flex-col gap-2">
                                Fecha hasta
                                <input
                                    type="datetime-local"
                                    value={insightsToDate}
                                    onChange={(event) =>
                                        setInsightsToDate(event.target.value)
                                    }
                                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100"
                                />
                            </label>
                            <label className="flex flex-col gap-2">
                                Rows por pagina
                                <select
                                    value={insightsPageSize}
                                    onChange={(event) =>
                                        setInsightsPageSize(
                                            Math.max(1, Number(event.target.value))
                                        )
                                    }
                                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </label>
                            <div className="flex items-end gap-2 md:col-span-2">
                                <button
                                    type="button"
                                    onClick={fetchInsights}
                                    className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 hover:border-emerald-200/50 hover:bg-emerald-200/10 disabled:opacity-50"
                                    disabled={insightsLoading}
                                >
                                    {insightsLoading
                                        ? 'Consultando...'
                                        : 'Aplicar filtros (Insights)'}
                                </button>
                                <span className="text-xs text-slate-400/70">
                                    {insightsDynamic
                                        ? `cache_hit=${String(
                                              insightsDynamic.cache_hit ?? false
                                          )}`
                                        : ''}
                                </span>
                            </div>
                        </div>
                        {insightsError ? (
                            <div className="mt-3 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">
                                {insightsError}
                            </div>
                        ) : null}
                        <div className="mt-4 space-y-4 text-sm">
                            {insightsList.length ? (
                                insightsList.map(([name, value]) => (
                                        <div
                                            key={name}
                                            className="rounded-xl border border-white/5 bg-white/5 p-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-slate-50">
                                                    {name}
                                                </span>
                                                <span className="text-xs text-slate-300/70">
                                                    window{' '}
                                                    {formatValue(
                                                        value.window_seconds
                                                    )}{' '}
                                                    s
                                                </span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-300/80">
                                                {value.log_group ? (
                                                    <a
                                                        href={buildCloudWatchLogGroupUrl(
                                                            {
                                                                region: CLOUDWATCH_REGION,
                                                                logGroup: value.log_group,
                                                            }
                                                        )}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:border-emerald-200/50 hover:bg-emerald-200/10"
                                                    >
                                                        Abrir Log Group (CloudWatch)
                                                    </a>
                                                ) : null}
                                            </div>
                                            <div className="mt-3 text-2xl font-semibold text-slate-50">
                                                {formatValue(value.count)}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-400/70">
                                                {value.log_group || '—'}
                                            </div>
                                            {value.rows?.length ? (
                                                <div className="mt-4 space-y-3 text-xs text-slate-200/90">
                                                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-slate-300/80">
                                                        <span>
                                                            Total rows: {formatValue(value.rows.length)}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setInsightsPage(
                                                                        name,
                                                                        (insightsPageByName[
                                                                            name
                                                                        ] ?? 0) - 1
                                                                    )
                                                                }
                                                                disabled={
                                                                    (insightsPageByName[
                                                                        name
                                                                    ] ?? 0) <= 0
                                                                }
                                                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 disabled:opacity-40"
                                                            >
                                                                Prev
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setInsightsPage(
                                                                        name,
                                                                        (insightsPageByName[
                                                                            name
                                                                        ] ?? 0) + 1
                                                                    )
                                                                }
                                                                disabled={
                                                                    (insightsPageByName[
                                                                        name
                                                                    ] ?? 0) >=
                                                                    Math.max(
                                                                        0,
                                                                        Math.ceil(
                                                                            value.rows.length /
                                                                                insightsPageSize
                                                                        ) - 1
                                                                    )
                                                                }
                                                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 disabled:opacity-40"
                                                            >
                                                                Next
                                                            </button>
                                                            <span className="ml-1 text-slate-400/70">
                                                                Page{' '}
                                                                {(insightsPageByName[
                                                                    name
                                                                ] ?? 0) + 1}
                                                                /
                                                                {Math.max(
                                                                    1,
                                                                    Math.ceil(
                                                                        value.rows.length /
                                                                            insightsPageSize
                                                                    )
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {value.rows
                                                        .slice(
                                                            (insightsPageByName[
                                                                name
                                                            ] ?? 0) * insightsPageSize,
                                                            ((insightsPageByName[
                                                                name
                                                            ] ?? 0) + 1) *
                                                                insightsPageSize
                                                        )
                                                        .map((row, idx) => (
                                                        <div
                                                            key={`${name}-${idx}`}
                                                            className="rounded-lg border border-white/10 bg-black/30 p-3"
                                                        >
                                                            <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wider text-emerald-200/70">
                                                                <span>
                                                                    {row['@timestamp'] ??
                                                                        row.timestamp ??
                                                                        '—'}
                                                                </span>
                                                                <span className="text-slate-400/70">
                                                                    {row['@logStream'] ??
                                                                        row.logStream ??
                                                                        '—'}
                                                                </span>
                                                            </div>
                                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-300/80">
                                                                {value.log_group &&
                                                                (row['@logStream'] ||
                                                                    row.logStream) ? (
                                                                    <a
                                                                        href={buildCloudWatchLogStreamUrl(
                                                                            {
                                                                                region: CLOUDWATCH_REGION,
                                                                                logGroup:
                                                                                    value.log_group,
                                                                                logStream:
                                                                                    row['@logStream'] ||
                                                                                    row.logStream ||
                                                                                    '',
                                                                            }
                                                                        )}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:border-emerald-200/50 hover:bg-emerald-200/10"
                                                                    >
                                                                        Ver en CloudWatch
                                                                    </a>
                                                                ) : null}
                                                                <span className="text-slate-400/70">
                                                                    {row['@ptr']
                                                                        ? 'ptr disponible'
                                                                        : ''}
                                                                </span>
                                                            </div>
                                                            <div className="mt-2 text-sm text-slate-100">
                                                                {row['@message'] ??
                                                                    row.message ??
                                                                    JSON.stringify(
                                                                        row
                                                                    )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="mt-3 text-xs text-slate-400/70">
                                                    Sin errores recientes.
                                                </div>
                                            )}
                                        </div>
                                    )
                                )
                            ) : (
                                <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-slate-300/70">
                                    Sin resultados de Insights.
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
