'use client';

import { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Calendar as CalendarIcon,
    Users,
    MessageSquare,
    BarChart3,
    TrendingUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useCompanyID } from '@/context/CompanyContext';
// Removed Popover for search dropdown to avoid focus issues
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { type DateRange } from 'react-day-picker';
import {
    getOnboardingOverview,
    getOnboardingResponsesSingle,
    getOnboardingChecklistPage,
    getOnboardingResponsesGrouped,
    searchOnboardingCandidates,
    getOnboardingCompanyKPIs,
    getOnboardingCompanyStatsChecklist,
    getOnboardingCompanyStatsPulse,
    type OnboardingAnswerItem,
    type OnboardingOverviewData,
    type OnboardingPaginated,
    type OnboardingGroupedResult,
    type OnboardingCandidateLite,
    type OnboardingKPIs,
} from '@/lib/api';

type ChartItem = { question: string; percentage: number; label: string };
// Inicia vacío; se poblará con datos reales del candidato
const defaultChecklistData: ChartItem[] = [];

// Estructura dinámica para pulso: promedio por semana
type PulseWeek = { week: string; score: number; responses: number };
const defaultPulseData: PulseWeek[] = [];


const HorizontalBarChart = ({
    data,
    color,
}: {
    data: ChartItem[];
    color: string;
}) => {
    return (
        <div className="space-y-4">
            {data.map((item, index) => (
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
                            {item.percentage}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className="h-3 rounded-full transition-all duration-500 ease-out"
                            style={{
                                width: `${item.percentage}%`,
                                backgroundColor: color,
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

const BubbleChart = ({ data }: { data: PulseWeek[] }) => {
    const maxValue = 5;
    const minValue = 1;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-muted-foreground text-right">
                    Pulso
                </div>
                <div className="flex-1 flex items-center gap-2">
                    {data.map((week, weekIndex) => {
                        const value = week.score;
                        const size =
                            ((value - minValue) / (maxValue - minValue)) * 30 +
                            10;

                        return (
                            <div
                                key={weekIndex}
                                className="flex flex-col items-center gap-1"
                                style={{ minWidth: '60px' }}
                            >
                                <div
                                    className="rounded-full flex items-center justify-center text-white text-xs font-medium"
                                    style={{
                                        backgroundColor: '#3b82f6',
                                        width: `${size}px`,
                                        height: `${size}px`,
                                    }}
                                >
                                    {value.toFixed(1)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-center gap-8 mt-6 pt-4 border-t">
                {data.map((week, index) => (
                    <div key={index} className="text-center">
                        <div className="text-sm font-medium">{week.week}</div>
                        <div className="text-xs text-muted-foreground">
                            {week.responses} respuestas
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PulseLineChart = ({
    data,
    color = '#3b82f6',
}: {
    data: PulseWeek[];
    color?: string;
}) => {
    // SVG dimensions
    const width = 600;
    const height = 180;
    const margin = { top: 16, right: 16, bottom: 36, left: 32 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const minY = 1;
    const maxY = 5;
    const n = Math.max(1, data.length);
    const stepX = n > 1 ? plotW / (n - 1) : 0;

    const yFor = (v: number) => {
        const clamped = Math.max(minY, Math.min(maxY, v));
        const t = (clamped - minY) / (maxY - minY);
        return margin.top + (1 - t) * plotH;
    };
    const xFor = (i: number) => margin.left + i * stepX;

    const points = data.map((d, i) => `${xFor(i)},${yFor(d.score)}`).join(' ');
    const gridVals = [1, 2, 3, 4, 5];

    return (
        <div className="w-full overflow-x-auto">
            <svg
                width="100%"
                viewBox={`0 0 ${width} ${height}`}
                className="max-w-full"
            >
                {/* Grid lines */}
                {gridVals.map((v) => {
                    const y = yFor(v);
                    return (
                        <g key={v}>
                            <line
                                x1={margin.left}
                                y1={y}
                                x2={width - margin.right}
                                y2={y}
                                stroke="#e5e7eb"
                                strokeDasharray="4 4"
                            />
                            <text
                                x={margin.left - 8}
                                y={y + 4}
                                textAnchor="end"
                                className="fill-muted-foreground text-[10px]"
                            >
                                {v}
                            </text>
                        </g>
                    );
                })}
                {/* Polyline */}
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    points={points}
                />
                {/* Points */}
                {data.map((d, i) => (
                    <g key={i}>
                        <circle
                            cx={xFor(i)}
                            cy={yFor(d.score)}
                            r={3}
                            fill={color}
                        />
                    </g>
                ))}
                {/* X labels */}
                {data.map((d, i) => (
                    <text
                        key={`x-${i}`}
                        x={xFor(i)}
                        y={height - 8}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[10px]"
                    >
                        {d.week}
                    </text>
                ))}
            </svg>
        </div>
    );
};

const PulseMultiLineChart = ({
    series,
}: {
    series: { label: string; data: PulseWeek[]; color?: string }[];
}) => {
    const width = 720;
    const height = 220;
    const margin = { top: 16, right: 16, bottom: 40, left: 36 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const minY = 1;
    const maxY = 5;
    const palette = [
        '#3b82f6',
        '#10b981',
        '#f97316',
        '#ef4444',
        '#8b5cf6',
        '#14b8a6',
        '#eab308',
        '#06b6d4',
    ];

    // Collect all week labels
    const weekSet = new Set<string>();
    series.forEach((s) => s.data.forEach((d) => weekSet.add(d.week)));
    const weeks = Array.from(weekSet).sort();
    const n = Math.max(1, weeks.length);
    const stepX = n > 1 ? plotW / (n - 1) : 0;
    const weekIndex = new Map(weeks.map((w, i) => [w, i]));

    const yFor = (v: number) => {
        const clamped = Math.max(minY, Math.min(maxY, v));
        const t = (clamped - minY) / (maxY - minY);
        return margin.top + (1 - t) * plotH;
    };
    const xFor = (i: number) => margin.left + i * stepX;

    const gridVals = [1, 2, 3, 4, 5];

    return (
        <div className="w-full overflow-x-auto">
            <svg
                width="100%"
                viewBox={`0 0 ${width} ${height}`}
                className="max-w-full"
            >
                {/* Grid */}
                {gridVals.map((v) => {
                    const y = yFor(v);
                    return (
                        <g key={v}>
                            <line
                                x1={margin.left}
                                y1={y}
                                x2={width - margin.right}
                                y2={y}
                                stroke="#e5e7eb"
                                strokeDasharray="4 4"
                            />
                            <text
                                x={margin.left - 8}
                                y={y + 4}
                                textAnchor="end"
                                className="fill-muted-foreground text-[10px]"
                            >
                                {v}
                            </text>
                        </g>
                    );
                })}

                {/* Series */}
                {series.map((s, si) => {
                    const color = s.color || palette[si % palette.length];
                    const pts = s.data
                        .filter((d) => weekIndex.has(d.week))
                        .sort(
                            (a, b) =>
                                weekIndex.get(a.week)! - weekIndex.get(b.week)!
                        )
                        .map(
                            (d) =>
                                `${xFor(weekIndex.get(d.week)!)} ,${yFor(d.score)}`
                        )
                        .join(' ');
                    return (
                        <g key={si}>
                            <polyline
                                fill="none"
                                stroke={color}
                                strokeWidth={2}
                                points={pts}
                            />
                            {s.data.map((d, i) => {
                                const idx = weekIndex.get(d.week);
                                if (idx === undefined) return null;
                                return (
                                    <circle
                                        key={i}
                                        cx={xFor(idx)}
                                        cy={yFor(d.score)}
                                        r={3}
                                        fill={color}
                                    />
                                );
                            })}
                        </g>
                    );
                })}

                {/* X labels */}
                {weeks.map((w, i) => (
                    <text
                        key={`x-${i}`}
                        x={xFor(i)}
                        y={height - 8}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[10px]"
                    >
                        {w}
                    </text>
                ))}
            </svg>
        </div>
    );
};

export default function OnboardingDashboard() {
    const companyId = useCompanyID();
    const [selectedCandidateId, setSelectedCandidateId] = useState<
        number | null
    >(null);
    const [selectedCandidate, setSelectedCandidate] =
        useState<OnboardingCandidateLite | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState<'name' | 'rfc' | 'curp'>(
        'name'
    );
    const [searchResults, setSearchResults] = useState<
        OnboardingCandidateLite[]
    >([]);
    const [candidateLoading, setCandidateLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [overview, setOverview] = useState<OnboardingOverviewData | null>(
        null
    );
    const [pulse, setPulse] =
        useState<OnboardingPaginated<OnboardingAnswerItem> | null>(null);
    const [checklist1, setChecklist1] =
        useState<OnboardingPaginated<OnboardingAnswerItem> | null>(null);
    const [checklist2, setChecklist2] =
        useState<OnboardingPaginated<OnboardingAnswerItem> | null>(null);
    const [checklist1Chart, setChecklist1Chart] =
        useState<ChartItem[]>(defaultChecklistData);
    const [checklist2Chart, setChecklist2Chart] =
        useState<ChartItem[]>(defaultChecklistData);
    const [pulseChart, setPulseChart] = useState<PulseWeek[]>(defaultPulseData);
    const [grouped, setGrouped] = useState<OnboardingGroupedResult | null>(
        null
    );
    const [resultsOpen, setResultsOpen] = useState(false);
    const [globalKPIs, setGlobalKPIs] = useState<OnboardingKPIs | null>(null);
    const [selectedRange, setSelectedRange] = useState<DateRange>(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { from: start, to: end };
    });
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [candidateModalOpen, setCandidateModalOpen] = useState(false);
    const [globalChecklist1Chart, setGlobalChecklist1Chart] = useState<
        ChartItem[]
    >([]);
    const [globalChecklist2Chart, setGlobalChecklist2Chart] = useState<
        ChartItem[]
    >([]);
    const [globalPulseChart, setGlobalPulseChart] = useState<PulseWeek[]>([]);
    const [globalPulseByQuestion, setGlobalPulseByQuestion] = useState<
        {
            question: string;
            series: PulseWeek[];
        }[]
    >([]);

    // pagination state
    const [pulsePage, setPulsePage] = useState(1);
    const [pulsePerPage, setPulsePerPage] = useState(10);
    const [c1Page, setC1Page] = useState(1);
    const [c1PerPage, setC1PerPage] = useState(10);
    const [c2Page, setC2Page] = useState(1);
    const [c2PerPage, setC2PerPage] = useState(10);
    // Always fetch and show grouped responses inside modal

    const fetchOnboardingData = async (candidateId?: number) => {
        setError(null);
        setOverview(null);
        setPulse(null);
        setChecklist1(null);
        setChecklist2(null);

        const parsed =
            typeof candidateId === 'number'
                ? candidateId
                : (selectedCandidateId ?? null);
        if (!parsed) return;
        if (!companyId) {
            setError('No se encontró companyId en el contexto');
            return;
        }
        setCandidateLoading(true);
        try {
            const groupedPromise = getOnboardingResponsesGrouped(
                companyId,
                parsed,
                25
            );
            const [ov, p, c1, c2, grp] = await Promise.all([
                getOnboardingOverview(companyId, parsed, 25),
                getOnboardingResponsesSingle(
                    companyId,
                    parsed,
                    'pulse',
                    pulsePage,
                    pulsePerPage
                ),
                getOnboardingChecklistPage(
                    companyId,
                    parsed,
                    1,
                    c1Page,
                    c1PerPage
                ),
                getOnboardingChecklistPage(
                    companyId,
                    parsed,
                    2,
                    c2Page,
                    c2PerPage
                ),
                groupedPromise,
            ]);
            setOverview(ov);
            setPulse(p);
            setChecklist1(c1);
            setChecklist2(c2);
            setGrouped(grp);

            // Derivados para gráficos
            const normalize = (s?: string) =>
                (s || '')
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .trim()
                    .toLowerCase();
            const isCommentQuestion = (q?: string) =>
                normalize(q) === 'deja un comentario';
            const toPct = (yes: number, total: number) =>
                total > 0 ? Math.round((yes / total) * 100) : 0;
            const normalizeYes = (ans: string) =>
                ans.trim().toLowerCase().replaceAll('í', 'i') === 'si';

            const buildChecklistChart = (
                arr: OnboardingAnswerItem[]
            ): ChartItem[] => {
                const byQ = new Map<string, { yes: number; total: number }>();
                arr.forEach((it) => {
                    if (isCommentQuestion(it.question)) return;
                    const k = it.question;
                    const agg = byQ.get(k) || { yes: 0, total: 0 };
                    agg.total += 1;
                    if (normalizeYes(it.answer)) agg.yes += 1;
                    byQ.set(k, agg);
                });
                let labelIndex = 1;
                return Array.from(byQ.entries()).map(
                    ([question, { yes, total }]) => ({
                        question,
                        percentage: toPct(yes, total),
                        label: `Q${labelIndex++}`,
                    })
                );
            };

            setChecklist1Chart(buildChecklistChart(c1.items));
            setChecklist2Chart(buildChecklistChart(c2.items));

            // Pulse: agrupar por semana (YYYY-WW) y promediar
            const toWeekKey = (iso: string) => {
                const d = new Date(iso);
                const onejan = new Date(d.getFullYear(), 0, 1);
                const days = Math.floor(
                    (d.getTime() - onejan.getTime()) / 86400000
                );
                const week = Math.ceil((d.getDay() + 1 + days) / 7);
                return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
            };
            const byWeek = new Map<string, { sum: number; n: number }>();
            p.items.forEach((it) => {
                const val = Number(it.answer);
                if (!Number.isFinite(val)) return;
                const k = toWeekKey(it.created_at);
                const agg = byWeek.get(k) || { sum: 0, n: 0 };
                agg.sum += val;
                agg.n += 1;
                byWeek.set(k, agg);
            });
            const weeks = Array.from(byWeek.entries())
                .sort(([a], [b]) => (a < b ? -1 : 1))
                .slice(-4)
                .map(([wk, { sum, n }], idx) => ({
                    week: `Semana ${idx + 1}`,
                    score: n > 0 ? sum / n : 0,
                    responses: n,
                }));
            setPulseChart(weeks);
        } catch (e: any) {
            setError(e?.message || 'Error al cargar onboarding');
        } finally {
            setCandidateLoading(false);
        }
    };

    const handleSelectCandidate = (c: OnboardingCandidateLite) => {
        setSelectedCandidateId(c.candidate_id);
        setSelectedCandidate(c);
        // reset pagination on new selection
        setPulsePage(1);
        setC1Page(1);
        setC2Page(1);
        setCandidateModalOpen(true);
    };

    // Global (company) stats when no candidate is selected
    const [globalLoading, setGlobalLoading] = useState(false);
    const fetchGlobalStats = async () => {
        if (!companyId) return;
        setGlobalLoading(true);
        setError(null);
        try {
            const start = selectedRange?.from || new Date();
            const end = selectedRange?.to || selectedRange?.from || new Date();
            const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
            const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
            const [kpis, c1Stats, c2Stats, pulseStats] = await Promise.all([
                getOnboardingCompanyKPIs(
                    companyId,
                    undefined,
                    startStr,
                    endStr
                ),
                getOnboardingCompanyStatsChecklist(
                    companyId,
                    1,
                    undefined,
                    startStr,
                    endStr
                ),
                getOnboardingCompanyStatsChecklist(
                    companyId,
                    2,
                    undefined,
                    startStr,
                    endStr
                ),
                getOnboardingCompanyStatsPulse(
                    companyId,
                    undefined,
                    startStr,
                    endStr,
                    { byQuestion: true }
                ),
            ]);
            setGlobalKPIs(kpis);
            // Map checklist stats to chart items (global)
            const normalize = (s?: string) =>
                (s || '')
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .trim()
                    .toLowerCase();
            const isCommentQuestion = (q?: string) =>
                normalize(q) === 'deja un comentario';
            const mapChecklist = (
                arr: { question: string; percentage: number }[]
            ): ChartItem[] =>
                arr
                    .filter((it) => !isCommentQuestion(it.question))
                    .map((it, idx) => ({
                        question: it.question,
                        percentage: Math.round(it.percentage),
                        label: `Q${idx + 1}`,
                    }));
            setGlobalChecklist1Chart(mapChecklist(c1Stats as any));
            setGlobalChecklist2Chart(mapChecklist(c2Stats as any));
            // Map pulse stats (global)
            const normalizePulse = (raw: any): PulseWeek[] => {
                // by_question=true: raw is [{ question, series: [{week, avg, responses}, ...] }, ...]
                if (Array.isArray(raw) && raw.length > 0 && raw[0]?.series) {
                    const agg = new Map<string, { sum: number; n: number }>();
                    const byQuestion = (raw as any[]).map((q) => ({
                        question: q.question as string,
                        series: (q.series || []).map((w: any, idx: number) => ({
                            week: w.week || `Semana ${idx + 1}`,
                            score: Number(w.avg) || 0,
                            responses: Number(w.responses) || 0,
                        })),
                    }));
                    setGlobalPulseByQuestion(byQuestion);
                    raw.forEach((q: any) => {
                        (q.series || []).forEach((w: any) => {
                            const wk = w.week || '';
                            const r = Number(w.responses) || 0;
                            const a = Number(w.avg) || 0;
                            const entry = agg.get(wk) || { sum: 0, n: 0 };
                            entry.sum += a * r;
                            entry.n += r;
                            agg.set(wk, entry);
                        });
                    });
                    return Array.from(agg.entries())
                        .sort(([a], [b]) => (a < b ? -1 : 1))
                        .map(([wk, { sum, n }]) => ({
                            week: wk || '',
                            score: n ? sum / n : 0,
                            responses: n,
                        }));
                }
                // simple array case
                if (Array.isArray(raw)) {
                    return raw.map((w: any, idx: number) => ({
                        week: w.week || `Semana ${idx + 1}`,
                        score: Number(w.avg) || 0,
                        responses: Number(w.responses) || 0,
                    }));
                }
                // grouped object fallback
                const series = raw?.series || raw?.groups || raw?.data || {};
                const agg = new Map<string, { sum: number; n: number }>();
                Object.values(series).forEach((arr: any) => {
                    if (!Array.isArray(arr)) return;
                    arr.forEach((w: any) => {
                        const wk = w.week || '';
                        const r = Number(w.responses) || 0;
                        const a = Number(w.avg) || 0;
                        const entry = agg.get(wk) || { sum: 0, n: 0 };
                        entry.sum += a * r;
                        entry.n += r;
                        agg.set(wk, entry);
                    });
                });
                return Array.from(agg.entries())
                    .sort(([a], [b]) => (a < b ? -1 : 1))
                    .map(([wk, { sum, n }]) => ({
                        week: wk || '',
                        score: n ? sum / n : 0,
                        responses: n,
                    }));
            };
            const pulseWeeks = normalizePulse(pulseStats);
            setGlobalPulseChart(pulseWeeks);
        } catch (e: any) {
            setError(e?.message || 'Error al cargar estadísticas globales');
        } finally {
            setGlobalLoading(false);
        }
    };

    // Fetch candidate data only when modal is open (and on pagination changes within modal)
    useEffect(() => {
        if (!candidateModalOpen || !selectedCandidateId) return;
        fetchOnboardingData(selectedCandidateId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        candidateModalOpen,
        selectedCandidateId,
        pulsePage,
        pulsePerPage,
        c1Page,
        c1PerPage,
        c2Page,
        c2PerPage,
    ]);

    // Fetch global stats on mount and when month changes
    useEffect(() => {
        fetchGlobalStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId, selectedRange]);

    // initial search (5 names by default)
    useEffect(() => {
        let ignore = false;
        async function initial() {
            try {
                const res = await searchOnboardingCandidates(
                    companyId,
                    '',
                    'name',
                    5
                );
                if (!ignore) {
                    setSearchResults(res);
                    setResultsOpen(res.length > 0);
                }
            } catch (e) {
                // ignore initial errors
            }
        }
        initial();
        return () => {
            ignore = true;
        };
    }, [companyId]);

    // debounced search when user types
    useEffect(() => {
        const term = searchTerm.trim();
        const t = setTimeout(async () => {
            try {
                const res = await searchOnboardingCandidates(
                    companyId,
                    term,
                    searchType,
                    10
                );
                setSearchResults(res);
                setResultsOpen(res.length > 0);
            } catch (e: any) {
                setError(e?.message || 'Error al buscar candidatos');
            }
        }, 500);
        return () => clearTimeout(t);
    }, [searchTerm, searchType, companyId]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                                    <MessageSquare className="w-3 h-3 text-white" />
                                </div>
                                <h1 className="text-xl font-semibold">
                                    Seguimiento de Onboarding
                                </h1>
                            </div>
                            <p className="text-sm text-gray-600">
                                Monitorea el progreso de integración de nuevos
                                empleados mediante encuestas de WhatsApp
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Popover
                                open={datePickerOpen}
                                onOpenChange={setDatePickerOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="justify-start gap-2 w-64"
                                    >
                                        <CalendarIcon className="h-4 w-4" />
                                        {selectedRange?.from &&
                                        selectedRange?.to
                                            ? `${selectedRange.from.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} – ${selectedRange.to.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                            : selectedRange?.from
                                              ? selectedRange.from.toLocaleDateString(
                                                    'es-MX',
                                                    {
                                                        month: 'long',
                                                        year: 'numeric',
                                                    }
                                                )
                                              : 'Selecciona fecha'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0" align="end">
                                    <Calendar
                                        mode="range"
                                        selected={selectedRange}
                                        onSelect={(
                                            range: DateRange | undefined
                                        ) => {
                                            if (range?.from) {
                                                // If only one date selected, keep popover open to allow picking end
                                                setSelectedRange(range);
                                                if (range.to)
                                                    setDatePickerOpen(false);
                                            }
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Conexión API Onboarding */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <CardTitle>Buscar Candidatos</CardTitle>
                                    <CardDescription>
                                        Escribe para buscar por nombre
                                        (prefijo), o cambia a RFC/CURP
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Global KPIs moved to Metrics Cards section below */}
                            <div className="flex items-center gap-2 flex-wrap relative">
                                <div className="relative">
                                    <Input
                                        placeholder="Buscar por prefijo (nombre, RFC, CURP)"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setResultsOpen(true);
                                        }}
                                        onFocus={() => setResultsOpen(true)}
                                        onBlur={() =>
                                            setTimeout(
                                                () => setResultsOpen(false),
                                                150
                                            )
                                        }
                                        className="w-64"
                                    />
                                    {resultsOpen &&
                                        searchResults.length > 0 && (
                                            <div className="absolute z-50 mt-1 w-64 max-h-64 overflow-auto rounded-md border bg-white shadow-md">
                                                {searchResults.map((c) => (
                                                    <button
                                                        key={c.candidate_id}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b last:border-b-0"
                                                        onMouseDown={(e) =>
                                                            e.preventDefault()
                                                        }
                                                        onClick={() => {
                                                            handleSelectCandidate(
                                                                c
                                                            );
                                                            setResultsOpen(
                                                                false
                                                            );
                                                        }}
                                                    >
                                                        <div className="font-medium truncate">
                                                            {c.name}
                                                        </div>
                                                        <div className="text-muted-foreground truncate">
                                                            {c.role_name} —{' '}
                                                            {c.phone} — ID{' '}
                                                            {c.candidate_id}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                </div>
                                <Select
                                    value={searchType}
                                    onValueChange={(v) => {
                                        setSearchType(v as any);
                                        setResultsOpen(true);
                                    }}
                                >
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name">
                                            Nombre
                                        </SelectItem>
                                        <SelectItem value="rfc">RFC</SelectItem>
                                        <SelectItem value="curp">
                                            CURP
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {error && (
                                <div className="text-sm text-red-600">
                                    {error}
                                </div>
                            )}
                            {/* Solo buscador. La data del candidato vive en el modal. */}
                        </CardContent>
                    </Card>
                    {/* Candidate Modal */}
                    <Dialog
                        open={candidateModalOpen}
                        onOpenChange={setCandidateModalOpen}
                    >
                        <DialogContent className="max-w-6xl p-0">
                            <DialogHeader className="px-6 pt-6">
                                <DialogTitle>
                                    Detalles de Onboarding del Candidato
                                </DialogTitle>
                                <DialogDescription>
                                    {selectedCandidate ? (
                                        <span>
                                            {selectedCandidate.name} ·{' '}
                                            {selectedCandidate.role_name} ·{' '}
                                            {selectedCandidate.phone} · ID{' '}
                                            {selectedCandidate.candidate_id}
                                        </span>
                                    ) : (
                                        <span>Selecciona un candidato</span>
                                    )}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="px-6">
                                <Tabs defaultValue="grouped">
                                    <TabsList>
                                        <TabsTrigger value="grouped">
                                            Agrupadas
                                        </TabsTrigger>
                                        <TabsTrigger value="pulse">
                                            Pulse
                                        </TabsTrigger>
                                        <TabsTrigger value="checklist1">
                                            Checklist 1
                                        </TabsTrigger>
                                        <TabsTrigger value="checklist2">
                                            Checklist 2
                                        </TabsTrigger>
                                    </TabsList>
                                    <div className="mt-3 max-h-[70vh] overflow-y-auto pr-2 pb-6 space-y-4">
                                        <TabsContent value="grouped">
                                            {candidateLoading || !grouped ? (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    {Array.from({
                                                        length: 3,
                                                    }).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className="border rounded p-3 space-y-2"
                                                        >
                                                            <Skeleton className="h-4 w-32" />
                                                            <Skeleton className="h-3 w-24" />
                                                            <div className="space-y-2">
                                                                {Array.from({
                                                                    length: 4,
                                                                }).map(
                                                                    (__, j) => (
                                                                        <Skeleton
                                                                            key={
                                                                                j
                                                                            }
                                                                            className="h-10 w-full"
                                                                        />
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="border rounded-md p-4 space-y-2">
                                                    <div className="text-sm font-medium">
                                                        Respuestas agrupadas
                                                        (limitadas)
                                                    </div>
                                                    {grouped.meta && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Límite por sección:{' '}
                                                            {
                                                                grouped.meta
                                                                    .limit_per_section
                                                            }{' '}
                                                            — Totales: C1{' '}
                                                            {grouped.meta.totals
                                                                ?.checklist_1 ??
                                                                0}
                                                            , C2{' '}
                                                            {grouped.meta.totals
                                                                ?.checklist_2 ??
                                                                0}
                                                            , Pulse{' '}
                                                            {grouped.meta.totals
                                                                ?.pulse ?? 0}
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        {(
                                                            [
                                                                'checklist_1',
                                                                'checklist_2',
                                                                'pulse',
                                                            ] as const
                                                        ).map((key) => (
                                                            <div
                                                                key={key}
                                                                className="border rounded p-3"
                                                            >
                                                                <div className="font-medium mb-2">
                                                                    {key ===
                                                                    'pulse'
                                                                        ? 'Pulse'
                                                                        : key
                                                                              .replace(
                                                                                  '_',
                                                                                  ' '
                                                                              )
                                                                              .toUpperCase()}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground mb-2">
                                                                    {grouped
                                                                        .groups[
                                                                        key
                                                                    ]?.length ??
                                                                        0}{' '}
                                                                    elementos
                                                                </div>
                                                                <div className="text-xs space-y-1 max-h-40 overflow-auto">
                                                                    {(
                                                                        grouped
                                                                            .groups[
                                                                            key
                                                                        ] || []
                                                                    ).map(
                                                                        (
                                                                            it
                                                                        ) => (
                                                                            <div
                                                                                key={`${key}-${it.id}`}
                                                                                className="border rounded p-2"
                                                                            >
                                                                                <div className="font-medium">
                                                                                    {new Date(
                                                                                        it.created_at
                                                                                    ).toLocaleString()}
                                                                                </div>
                                                                                <div className="text-muted-foreground">
                                                                                    {
                                                                                        it.question
                                                                                    }
                                                                                </div>
                                                                                <div>
                                                                                    Respuesta:{' '}
                                                                                    {
                                                                                        it.answer
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="pulse">
                                            {candidateLoading || !pulse ? (
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-24" />
                                                    <div className="space-y-2">
                                                        {Array.from({
                                                            length: 6,
                                                        }).map((_, i) => (
                                                            <Skeleton
                                                                key={i}
                                                                className="h-10 w-full"
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="text-sm font-medium">
                                                        Pulse
                                                    </div>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>
                                                                    Fecha
                                                                </TableHead>
                                                                <TableHead>
                                                                    Pregunta
                                                                </TableHead>
                                                                <TableHead>
                                                                    Respuesta
                                                                </TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {pulse.items
                                                                .length ===
                                                                0 && (
                                                                <TableRow>
                                                                    <TableCell
                                                                        colSpan={
                                                                            3
                                                                        }
                                                                        className="text-muted-foreground"
                                                                    >
                                                                        Sin
                                                                        registros
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                            {pulse.items.map(
                                                                (it) => (
                                                                    <TableRow
                                                                        key={
                                                                            it.id
                                                                        }
                                                                    >
                                                                        <TableCell>
                                                                            {new Date(
                                                                                it.created_at
                                                                            ).toLocaleString()}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {
                                                                                it.question
                                                                            }
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {
                                                                                it.answer
                                                                            }
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                    <div className="flex items-center justify-between gap-2 pt-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground">
                                                                Por página
                                                            </span>
                                                            <Select
                                                                value={String(
                                                                    pulsePerPage
                                                                )}
                                                                onValueChange={(
                                                                    v
                                                                ) => {
                                                                    setPulsePerPage(
                                                                        Number(
                                                                            v
                                                                        )
                                                                    );
                                                                    setPulsePage(
                                                                        1
                                                                    );
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-8 w-[80px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="10">
                                                                        10
                                                                    </SelectItem>
                                                                    <SelectItem value="25">
                                                                        25
                                                                    </SelectItem>
                                                                    <SelectItem value="50">
                                                                        50
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={
                                                                    pulse.page <=
                                                                    1
                                                                }
                                                                onClick={() =>
                                                                    setPulsePage(
                                                                        (p) =>
                                                                            Math.max(
                                                                                1,
                                                                                p -
                                                                                    1
                                                                            )
                                                                    )
                                                                }
                                                            >
                                                                Anterior
                                                            </Button>
                                                            <div className="text-xs text-muted-foreground">
                                                                Página{' '}
                                                                {pulse.page} de{' '}
                                                                {Math.max(
                                                                    1,
                                                                    Math.ceil(
                                                                        pulse.total /
                                                                            pulse.per_page
                                                                    )
                                                                )}
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={
                                                                    pulse.page >=
                                                                    Math.ceil(
                                                                        pulse.total /
                                                                            pulse.per_page
                                                                    )
                                                                }
                                                                onClick={() =>
                                                                    setPulsePage(
                                                                        (p) =>
                                                                            p +
                                                                            1
                                                                    )
                                                                }
                                                            >
                                                                Siguiente
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="checklist1">
                                            {candidateLoading || !checklist1 ? (
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-28" />
                                                    {Array.from({
                                                        length: 6,
                                                    }).map((_, i) => (
                                                        <Skeleton
                                                            key={i}
                                                            className="h-10 w-full"
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="text-sm font-medium">
                                                        Checklist 1
                                                    </div>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>
                                                                    Fecha
                                                                </TableHead>
                                                                <TableHead>
                                                                    Pregunta
                                                                </TableHead>
                                                                <TableHead>
                                                                    Respuesta
                                                                </TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {checklist1.items
                                                                .length ===
                                                                0 && (
                                                                <TableRow>
                                                                    <TableCell
                                                                        colSpan={
                                                                            3
                                                                        }
                                                                        className="text-muted-foreground"
                                                                    >
                                                                        Sin
                                                                        registros
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                            {checklist1.items.map(
                                                                (it) => (
                                                                    <TableRow
                                                                        key={
                                                                            it.id
                                                                        }
                                                                    >
                                                                        <TableCell>
                                                                            {new Date(
                                                                                it.created_at
                                                                            ).toLocaleString()}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {
                                                                                it.question
                                                                            }
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {
                                                                                it.answer
                                                                            }
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                    <div className="flex items-center justify-between gap-2 pt-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground">
                                                                Por página
                                                            </span>
                                                            <Select
                                                                value={String(
                                                                    c1PerPage
                                                                )}
                                                                onValueChange={(
                                                                    v
                                                                ) => {
                                                                    setC1PerPage(
                                                                        Number(
                                                                            v
                                                                        )
                                                                    );
                                                                    setC1Page(
                                                                        1
                                                                    );
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-8 w-[80px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="10">
                                                                        10
                                                                    </SelectItem>
                                                                    <SelectItem value="25">
                                                                        25
                                                                    </SelectItem>
                                                                    <SelectItem value="50">
                                                                        50
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={
                                                                    checklist1.page <=
                                                                    1
                                                                }
                                                                onClick={() =>
                                                                    setC1Page(
                                                                        (p) =>
                                                                            Math.max(
                                                                                1,
                                                                                p -
                                                                                    1
                                                                            )
                                                                    )
                                                                }
                                                            >
                                                                Anterior
                                                            </Button>
                                                            <div className="text-xs text-muted-foreground">
                                                                Página{' '}
                                                                {
                                                                    checklist1.page
                                                                }{' '}
                                                                de{' '}
                                                                {Math.max(
                                                                    1,
                                                                    Math.ceil(
                                                                        checklist1.total /
                                                                            checklist1.per_page
                                                                    )
                                                                )}
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={
                                                                    checklist1.page >=
                                                                    Math.ceil(
                                                                        checklist1.total /
                                                                            checklist1.per_page
                                                                    )
                                                                }
                                                                onClick={() =>
                                                                    setC1Page(
                                                                        (p) =>
                                                                            p +
                                                                            1
                                                                    )
                                                                }
                                                            >
                                                                Siguiente
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="checklist2">
                                            {candidateLoading || !checklist2 ? (
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-28" />
                                                    {Array.from({
                                                        length: 6,
                                                    }).map((_, i) => (
                                                        <Skeleton
                                                            key={i}
                                                            className="h-10 w-full"
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="text-sm font-medium">
                                                        Checklist 2
                                                    </div>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>
                                                                    Fecha
                                                                </TableHead>
                                                                <TableHead>
                                                                    Pregunta
                                                                </TableHead>
                                                                <TableHead>
                                                                    Respuesta
                                                                </TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {checklist2.items
                                                                .length ===
                                                                0 && (
                                                                <TableRow>
                                                                    <TableCell
                                                                        colSpan={
                                                                            3
                                                                        }
                                                                        className="text-muted-foreground"
                                                                    >
                                                                        Sin
                                                                        registros
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                            {checklist2.items.map(
                                                                (it) => (
                                                                    <TableRow
                                                                        key={
                                                                            it.id
                                                                        }
                                                                    >
                                                                        <TableCell>
                                                                            {new Date(
                                                                                it.created_at
                                                                            ).toLocaleString()}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {
                                                                                it.question
                                                                            }
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {
                                                                                it.answer
                                                                            }
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                    <div className="flex items-center justify-between gap-2 pt-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground">
                                                                Por página
                                                            </span>
                                                            <Select
                                                                value={String(
                                                                    c2PerPage
                                                                )}
                                                                onValueChange={(
                                                                    v
                                                                ) => {
                                                                    setC2PerPage(
                                                                        Number(
                                                                            v
                                                                        )
                                                                    );
                                                                    setC2Page(
                                                                        1
                                                                    );
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-8 w-[80px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="10">
                                                                        10
                                                                    </SelectItem>
                                                                    <SelectItem value="25">
                                                                        25
                                                                    </SelectItem>
                                                                    <SelectItem value="50">
                                                                        50
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={
                                                                    checklist2.page <=
                                                                    1
                                                                }
                                                                onClick={() =>
                                                                    setC2Page(
                                                                        (p) =>
                                                                            Math.max(
                                                                                1,
                                                                                p -
                                                                                    1
                                                                            )
                                                                    )
                                                                }
                                                            >
                                                                Anterior
                                                            </Button>
                                                            <div className="text-xs text-muted-foreground">
                                                                Página{' '}
                                                                {
                                                                    checklist2.page
                                                                }{' '}
                                                                de{' '}
                                                                {Math.max(
                                                                    1,
                                                                    Math.ceil(
                                                                        checklist2.total /
                                                                            checklist2.per_page
                                                                    )
                                                                )}
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={
                                                                    checklist2.page >=
                                                                    Math.ceil(
                                                                        checklist2.total /
                                                                            checklist2.per_page
                                                                    )
                                                                }
                                                                onClick={() =>
                                                                    setC2Page(
                                                                        (p) =>
                                                                            p +
                                                                            1
                                                                    )
                                                                }
                                                            >
                                                                Siguiente
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>
                        </DialogContent>
                    </Dialog>
                    {/* Metrics Cards (global por mes seleccionado) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Empleados en Onboarding
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {globalLoading ? (
                                    <>
                                        <Skeleton className="h-7 w-16" />
                                        <Skeleton className="h-3 w-24 mt-2" />
                                    </>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">
                                            {globalKPIs?.employees_in_onboarding ??
                                                0}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {selectedRange?.from &&
                                            selectedRange?.to
                                                ? `${selectedRange.from.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} – ${selectedRange.to.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                                : selectedRange?.from?.toLocaleDateString(
                                                      'es-MX',
                                                      {
                                                          month: 'long',
                                                          year: 'numeric',
                                                      }
                                                  )}
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Checklist 1 Completado
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {globalLoading ? (
                                    <>
                                        <Skeleton className="h-7 w-16" />
                                        <Skeleton className="h-3 w-24 mt-2" />
                                    </>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">
                                            {globalKPIs?.checklist_1_completed ??
                                                0}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {selectedRange?.from &&
                                            selectedRange?.to
                                                ? `${selectedRange.from.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} – ${selectedRange.to.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                                : selectedRange?.from?.toLocaleDateString(
                                                      'es-MX',
                                                      {
                                                          month: 'long',
                                                          year: 'numeric',
                                                      }
                                                  )}
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Checklist 2 Completado
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {globalLoading ? (
                                    <>
                                        <Skeleton className="h-7 w-16" />
                                        <Skeleton className="h-3 w-24 mt-2" />
                                    </>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">
                                            {globalKPIs?.checklist_2_completed ??
                                                0}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {selectedRange?.from &&
                                            selectedRange?.to
                                                ? `${selectedRange.from.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} – ${selectedRange.to.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                                : selectedRange?.from?.toLocaleDateString(
                                                      'es-MX',
                                                      {
                                                          month: 'long',
                                                          year: 'numeric',
                                                      }
                                                  )}
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Satisfacción Promedio
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {globalLoading ? (
                                    <>
                                        <Skeleton className="h-7 w-16" />
                                        <Skeleton className="h-3 w-24 mt-2" />
                                    </>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">
                                            {Number(
                                                globalKPIs?.avg_satisfaction ??
                                                    0
                                            ).toFixed(1)}
                                            /5.0
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {selectedRange?.from &&
                                            selectedRange?.to
                                                ? `${selectedRange.from.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} – ${selectedRange.to.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                                : selectedRange?.from?.toLocaleDateString(
                                                      'es-MX',
                                                      {
                                                          month: 'long',
                                                          year: 'numeric',
                                                      }
                                                  )}
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Checklist 1 (global) */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" />
                                    Checklist 1 - Resultados
                                </CardTitle>
                                <CardDescription>
                                    Porcentaje de respuestas &quot;Sí&quot; por pregunta
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {globalLoading ? (
                                    <Skeleton className="h-40 w-full" />
                                ) : (
                                    <HorizontalBarChart
                                        data={globalChecklist1Chart}
                                        color="#3b82f6"
                                    />
                                )}
                            </CardContent>
                        </Card>

                        {/* Checklist 2 (global) */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" />
                                    Checklist 2 - Resultados
                                </CardTitle>
                                <CardDescription>
                                    Porcentaje de respuestas &quot;Sí&quot; por pregunta
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {globalLoading ? (
                                    <Skeleton className="h-40 w-full" />
                                ) : (
                                    <HorizontalBarChart
                                        data={globalChecklist2Chart}
                                        color="#f97316"
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pulse Survey Bubble Chart (global por pregunta) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Encuesta de Pulso
                            </CardTitle>
                            <CardDescription>
                                Promedio semanal por pregunta (escala 1-5)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {globalLoading ? (
                                <Skeleton className="h-48 w-full" />
                            ) : globalPulseByQuestion.length === 0 ? (
                                <div className="text-sm text-muted-foreground">
                                    Sin datos de pulso en el rango seleccionado
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-3">
                                        {globalPulseByQuestion.map((q, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-2 text-xs"
                                            >
                                                <span
                                                    className="inline-block h-2.5 w-2.5 rounded-full"
                                                    style={{
                                                        backgroundColor: [
                                                            '#3b82f6',
                                                            '#10b981',
                                                            '#f97316',
                                                            '#ef4444',
                                                            '#8b5cf6',
                                                            '#14b8a6',
                                                            '#eab308',
                                                            '#06b6d4',
                                                        ][idx % 8],
                                                    }}
                                                />
                                                <span className="text-muted-foreground">
                                                    {q.question}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <PulseMultiLineChart
                                        series={globalPulseByQuestion.map(
                                            (q, idx) => ({
                                                label: q.question,
                                                data: q.series,
                                                color: [
                                                    '#3b82f6',
                                                    '#10b981',
                                                    '#f97316',
                                                    '#ef4444',
                                                    '#8b5cf6',
                                                    '#14b8a6',
                                                    '#eab308',
                                                    '#06b6d4',
                                                ][idx % 8],
                                            })
                                        )}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
