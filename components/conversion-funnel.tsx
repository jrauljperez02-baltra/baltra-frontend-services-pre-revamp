'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompanyID } from '@/context/CompanyContext';
import { useCandidatesStatsData } from '@/querys/candidates';
import { useCompanyData } from '@/querys/company';
import { ArrowUpRight } from 'lucide-react';
import { useMemo } from 'react';

export function ConversionFunnel({
    dateRange,
}: {
    dateRange?: { startDate?: string; endDate?: string };
} = {}) {
    const companyId = useCompanyID();
    const { data: stats, isLoading } = useCandidatesStatsData(companyId, dateRange);
    const { data: companyData } = useCompanyData(companyId);

    const funnelData = useMemo(() => {
        if (!stats) return null;

        const totalEvaluated = stats.total_evaluated ?? 0;
        const citados = stats.interview_cited ?? 0;
        const entrevistados = stats.entrevistados ?? 0;
        const hired = stats.hired ?? 0;
        const ingresados = stats.ingresados ?? 0;

        // Calculate percentages
        const citadosPercentage =
            totalEvaluated > 0
                ? ((citados / totalEvaluated) * 100).toFixed(1) + '%'
                : '0%';
        const entrevistadosPercentage =
            totalEvaluated > 0
                ? ((entrevistados / totalEvaluated) * 100).toFixed(1) + '%'
                : '0%';
        const contratadosPercentage =
            totalEvaluated > 0
                ? ((hired / totalEvaluated) * 100).toFixed(1) + '%'
                : '0%';
        const ingresadosPercentage =
            totalEvaluated > 0
                ? ((ingresados / totalEvaluated) * 100).toFixed(1) + '%'
                : '0%';

        return {
            evaluation: {
                count: totalEvaluated,
                percentage: '100%',
                label: 'Evaluados',
            },
            citados: {
                count: citados,
                percentage: citadosPercentage,
                label: 'Citados',
            },
            entrevistados: {
                count: entrevistados,
                percentage: entrevistadosPercentage,
                label: 'Entrevistados',
            },
            hired: {
                count: hired,
                percentage: contratadosPercentage,
                label: 'Contratados',
            },
            ingresados: {
                count: ingresados,
                percentage: ingresadosPercentage,
                label: 'Ingresados',
            },
        };
    }, [stats, companyData]);

    if (companyId === 2) {
        return <ConversionFunnelForCompany2 dateRange={dateRange} />;
    }

    if (companyId === 179) {
        return <ConversionFunnelForCompany179 dateRange={dateRange} />;
    }

    if (isLoading || !funnelData) {
        return (
            <Card className="overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-lg sm:text-xl">
                            Conversión de Candidatos
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            className="self-start sm:self-auto"
                        >
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Exportar</span>
                            <span className="sm:hidden">Exportar</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <div
                        className="w-full flex items-center justify-center"
                        style={{ height: 'clamp(340px, 45vh, 520px)' }}
                    >
                        <div className="animate-pulse text-muted-foreground">
                            Cargando datos de la conversión de candidatos...
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-2 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-lg sm:text-xl">
                        Conversión de Candidatos
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-1">
                <div className="w-full">
                    <div
                        className="w-full max-w-5xl mx-auto"
                        style={{
                            height: 'clamp(340px, 45vh, 500px)',
                        }}
                    >
                        <style jsx>{`
                            .funnel-section {
                                transition: all 0.3s ease;
                                cursor: pointer;
                            }
                            .funnel-section:hover {
                                transform: scale(1.02);
                                filter: brightness(1.1);
                            }
                            .funnel-text {
                                font-family:
                                    'Inter',
                                    -apple-system,
                                    BlinkMacSystemFont,
                                    sans-serif;
                                transition: all 0.3s ease;
                            }
                            .stage-name {
                                font-weight: 500;
                            }
                            .stage-number {
                                font-weight: 700;
                            }
                            .stage-percentage {
                                font-weight: 400;
                                opacity: 0.8;
                            }
                            .connector {
                                transition: all 0.3s ease;
                            }
                            @keyframes fadeInUp {
                                from {
                                    opacity: 0;
                                    transform: translateY(20px);
                                }
                                to {
                                    opacity: 1;
                                    transform: translateY(0);
                                }
                            }
                            .funnel-container {
                                animation: fadeInUp 0.8s ease-out;
                            }

                            /* Mobile-specific text sizing */
                            @media (max-width: 640px) {
                                .stage-name {
                                    font-size: 8.8px;
                                }
                                .stage-number {
                                    font-size: 9.6px;
                                }
                                .stage-percentage {
                                    font-size: 8px;
                                }
                            }

                            /* Tablet and desktop text sizing */
                            @media (min-width: 641px) {
                                .stage-name {
                                    font-size: 11.2px;
                                }
                                .stage-number {
                                    font-size: 12.8px;
                                }
                                .stage-percentage {
                                    font-size: 10.4px;
                                }
                            }
                        `}</style>

                        <div className="funnel-container h-full flex items-center justify-center">
                            <svg
                                viewBox="0 0 400 240"
                                className="w-full h-auto max-h-full drop-shadow-lg"
                                role="img"
                                aria-labelledby="funnel-title"
                                preserveAspectRatio="xMidYMid meet"
                            >
                                <title id="funnel-title">
                                    Conversión de Candidatos
                                </title>
                                <defs>
                                    {/* Updated gradients with a more cohesive color scheme */}
                                    <linearGradient
                                        id="evaluationGradient"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop offset="0%" stopColor="#005693" />
                                        <stop
                                            offset="100%"
                                            stopColor="#005693"
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="citadosGradient"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop offset="0%" stopColor="#006EBD" />
                                        <stop
                                            offset="100%"
                                            stopColor="#006EBD"
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="entrevistadosGradient"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop offset="0%" stopColor="#068EEF" />
                                        <stop
                                            offset="100%"
                                            stopColor="#068EEF"
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="hiredGradient"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop offset="0%" stopColor="#5AB3F2" />
                                        <stop
                                            offset="100%"
                                            stopColor="#5AB3F2"
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="ingresadosGradient"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop offset="0%" stopColor="#A8D2F0" />
                                        <stop
                                            offset="100%"
                                            stopColor="#A8D2F0"
                                        />
                                    </linearGradient>

                                    {/* Drop shadow filter */}
                                    <filter
                                        id="dropShadow"
                                        x="-20%"
                                        y="-20%"
                                        width="140%"
                                        height="140%"
                                    >
                                        <feDropShadow
                                            dx="0"
                                            dy="2"
                                            stdDeviation="3"
                                            floodColor="#000000"
                                            floodOpacity="0.1"
                                        />
                                    </filter>
                                </defs>

                                {/* Evaluation Stage */}
                                <g
                                    className="funnel-section"
                                    data-stage="evaluation"
                                >
                                    <polygon
                                        points="70,15 330,15 320,55 80,55"
                                        fill="url(#evaluationGradient)"
                                        filter="url(#dropShadow)"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x="200"
                                        y="29"
                                        textAnchor="middle"
                                        className="funnel-text stage-name"
                                        fill="white"
                                    >
                                        {funnelData.evaluation.label}
                                    </text>
                                    <text
                                        x="200"
                                        y="41"
                                        textAnchor="middle"
                                        className="funnel-text stage-number"
                                        fill="white"
                                    >
                                        {funnelData.evaluation.count.toLocaleString()}
                                    </text>
                                    <text
                                        x="200"
                                        y="49"
                                        textAnchor="middle"
                                        className="funnel-text stage-percentage"
                                        fill="rgba(255,255,255,0.8)"
                                    >
                                        candidatos{' '}
                                        {funnelData.evaluation.percentage}
                                    </text>
                                </g>

                                {/* Citados Stage */}
                                <g
                                    className="funnel-section"
                                    data-stage="citados"
                                >
                                    <polygon
                                        points="80,55 320,55 310,95 90,95"
                                        fill="url(#citadosGradient)"
                                        filter="url(#dropShadow)"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x="200"
                                        y="69"
                                        textAnchor="middle"
                                        className="funnel-text stage-name"
                                        fill="white"
                                    >
                                        {funnelData.citados.label}
                                    </text>
                                    <text
                                        x="200"
                                        y="81"
                                        textAnchor="middle"
                                        className="funnel-text stage-number"
                                        fill="white"
                                    >
                                        {funnelData.citados.count.toLocaleString()}
                                    </text>
                                    <text
                                        x="200"
                                        y="89"
                                        textAnchor="middle"
                                        className="funnel-text stage-percentage"
                                        fill="rgba(255,255,255,0.8)"
                                    >
                                        candidatos{' '}
                                        {funnelData.citados.percentage}
                                    </text>
                                </g>

                                {/* Entrevistados Stage */}
                                <g
                                    className="funnel-section"
                                    data-stage="entrevistados"
                                >
                                    <polygon
                                        points="90,95 310,95 300,135 100,135"
                                        fill="url(#entrevistadosGradient)"
                                        filter="url(#dropShadow)"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x="200"
                                        y="109"
                                        textAnchor="middle"
                                        className="funnel-text stage-name"
                                        fill="white"
                                    >
                                        {funnelData.entrevistados.label}
                                    </text>
                                    <text
                                        x="200"
                                        y="121"
                                        textAnchor="middle"
                                        className="funnel-text stage-number"
                                        fill="white"
                                    >
                                        {funnelData.entrevistados.count.toLocaleString()}
                                    </text>
                                    <text
                                        x="200"
                                        y="129"
                                        textAnchor="middle"
                                        className="funnel-text stage-percentage"
                                        fill="rgba(255,255,255,0.8)"
                                    >
                                        candidatos{' '}
                                        {funnelData.entrevistados.percentage}
                                    </text>
                                </g>

                                {/* Hired Stage */}
                                <g
                                    className="funnel-section"
                                    data-stage="hired"
                                >
                                    <polygon
                                        points="100,135 300,135 290,175 110,175"
                                        fill="url(#hiredGradient)"
                                        filter="url(#dropShadow)"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x="200"
                                        y="149"
                                        textAnchor="middle"
                                        className="funnel-text stage-name"
                                        fill="white"
                                    >
                                        {funnelData.hired.label}
                                    </text>
                                    <text
                                        x="200"
                                        y="161"
                                        textAnchor="middle"
                                        className="funnel-text stage-number"
                                        fill="white"
                                    >
                                        {funnelData.hired.count.toLocaleString()}
                                    </text>
                                    <text
                                        x="200"
                                        y="169"
                                        textAnchor="middle"
                                        className="funnel-text stage-percentage"
                                        fill="rgba(255,255,255,0.8)"
                                    >
                                        candidatos {funnelData.hired.percentage}
                                    </text>
                                </g>

                                {/* Ingresados Stage - Available for all companies */}
                                {'ingresados' in funnelData && (
                                    <g
                                        className="funnel-section"
                                        data-stage="ingresados"
                                    >
                                        <polygon
                                            points="110,175 290,175 280,215 120,215"
                                            fill="url(#ingresadosGradient)"
                                            filter="url(#dropShadow)"
                                            stroke="rgba(255,255,255,0.2)"
                                            strokeWidth="1"
                                        />
                                        <text
                                            x="200"
                                            y="189"
                                            textAnchor="middle"
                                            className="funnel-text stage-name"
                                            fill="white"
                                        >
                                            {funnelData.ingresados.label}
                                        </text>
                                        <text
                                            x="200"
                                            y="201"
                                            textAnchor="middle"
                                            className="funnel-text stage-number"
                                            fill="white"
                                        >
                                            {funnelData.ingresados.count.toLocaleString()}
                                        </text>
                                        <text
                                            x="200"
                                            y="209"
                                            textAnchor="middle"
                                            className="funnel-text stage-percentage"
                                            fill="rgba(255,255,255,0.8)"
                                        >
                                            candidatos{' '}
                                            {funnelData.ingresados.percentage}
                                        </text>
                                    </g>
                                )}
                            </svg>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function ConversionFunnelForCompany2({
    dateRange,
}: {
    dateRange?: { startDate?: string; endDate?: string };
} = {}) {
    const companyId = useCompanyID();
    const { data: stats, isLoading } = useCandidatesStatsData(companyId, dateRange);

    const funnelData = useMemo(() => {
        if (!stats) return null;

        const totalEvaluated = stats.total_evaluated ?? 0;
        const citados = stats.interview_cited ?? 0;
        const entrevistados = stats.entrevistados ?? 0;
        const hired = stats.hired ?? 0;
        const ingresados = stats.ingresados ?? 0;

        // Calculate percentages
        const citadosPercentage =
            totalEvaluated > 0
                ? ((citados / totalEvaluated) * 100).toFixed(1) + '%'
                : '0%';
        const entrevistadosPercentage =
            totalEvaluated > 0
                ? ((entrevistados / totalEvaluated) * 100).toFixed(1) + '%'
                : '0%';
        const contratadosPercentage =
            totalEvaluated > 0
                ? ((hired / totalEvaluated) * 100).toFixed(1) + '%'
                : '0%';
        const ingresadosPercentage =
            totalEvaluated > 0
                ? ((ingresados / totalEvaluated) * 100).toFixed(1) + '%'
                : '0%';

        return {
            evaluation: {
                count: totalEvaluated,
                percentage: '100%',
                label: 'Evaluados',
            },
            citados: {
                count: citados,
                percentage: citadosPercentage,
                label: 'Citados',
            },
            entrevistados: {
                count: entrevistados,
                percentage: entrevistadosPercentage,
                label: 'Entrevistados',
            },
            hired: {
                count: hired,
                percentage: contratadosPercentage,
                label: 'Contratados',
            },
            ingresados: {
                count: ingresados,
                percentage: ingresadosPercentage,
                label: 'Ingresados',
            },
        };
    }, [stats]);

    if (isLoading || !funnelData) {
        return (
            <Card className="overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-lg sm:text-xl">
                            Conversión de Candidatos
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            className="self-start sm:self-auto"
                        >
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Exportar</span>
                            <span className="sm:hidden">Exportar</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <div
                        className="w-full flex items-center justify-center"
                        style={{ height: 'clamp(340px, 45vh, 520px)' }}
                    >
                        <div className="animate-pulse text-muted-foreground">
                            Cargando datos de la conversión de candidatos...
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-lg sm:text-xl">
                        Conversión de Candidatos
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                <div className="w-full">
                    <div
                        className="w-full max-w-5xl mx-auto"
                        style={{ aspectRatio: '500 / 270' }}
                    >
                        <style jsx>{`
                            .funnel-section {
                                transition: all 0.3s ease;
                                cursor: pointer;
                            }
                            .funnel-section:hover {
                                transform: scale(1.02);
                                filter: brightness(1.1);
                            }
                            .funnel-text {
                                font-family:
                                    'Inter',
                                    -apple-system,
                                    BlinkMacSystemFont,
                                    sans-serif;
                                transition: all 0.3s ease;
                            }
                            .stage-name {
                                font-weight: 500;
                            }
                            .stage-number {
                                font-weight: 700;
                            }
                            .stage-percentage {
                                font-weight: 400;
                                opacity: 0.8;
                            }
                            .connector {
                                transition: all 0.3s ease;
                            }
                            @keyframes fadeInUp {
                                from {
                                    opacity: 0;
                                    transform: translateY(20px);
                                }
                                to {
                                    opacity: 1;
                                    transform: translateY(0);
                                }
                            }
                            .funnel-container {
                                animation: fadeInUp 0.8s ease-out;
                            }

                            /* Mobile-specific text sizing */
                            @media (max-width: 640px) {
                                .stage-name {
                                    font-size: 8.8px;
                                }
                                .stage-number {
                                    font-size: 9.6px;
                                }
                                .stage-percentage {
                                    font-size: 8px;
                                }
                            }

                            /* Tablet and desktop text sizing */
                            @media (min-width: 641px) {
                                .stage-name {
                                    font-size: 11.2px;
                                }
                                .stage-number {
                                    font-size: 12.8px;
                                }
                                .stage-percentage {
                                    font-size: 10.4px;
                                }
                            }
                        `}</style>
                        <div className="funnel-container h-full flex items-center justify-center">
                            <svg
                                viewBox="0 20 500 320"
                                className="w-full h-full drop-shadow-lg"
                                preserveAspectRatio="xMidYMid meet"
                            >
                                <defs>
                                    {/* Updated gradients with a more cohesive color scheme */}
                                    <linearGradient
                                        id="leadsGradient"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop offset="0%" stopColor="#004270" />
                                        <stop
                                            offset="100%"
                                            stopColor="#004270"
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="screeningGradient"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop offset="0%" stopColor="#005693" />
                                        <stop
                                            offset="100%"
                                            stopColor="#005693"
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="interviewGradient"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop offset="0%" stopColor="#006EBD" />
                                        <stop
                                            offset="100%"
                                            stopColor="#006EBD"
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="hiredGradient"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop offset="0%" stopColor="#068EEF" />
                                        <stop
                                            offset="100%"
                                            stopColor="#068EEF"
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="retentionGradient"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop offset="0%" stopColor="#5AB3F2" />
                                        <stop
                                            offset="100%"
                                            stopColor="#5AB3F2"
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="ingresadosGradient"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop offset="0%" stopColor="#A8D2F0" />
                                        <stop
                                            offset="100%"
                                            stopColor="#A8D2F0"
                                        />
                                    </linearGradient>

                                    {/* Drop shadow filter */}
                                    <filter
                                        id="dropShadow"
                                        x="-20%"
                                        y="-20%"
                                        width="140%"
                                        height="140%"
                                    >
                                        <feDropShadow
                                            dx="0"
                                            dy="2"
                                            stdDeviation="3"
                                            floodColor="#000000"
                                            floodOpacity="0.1"
                                        />
                                    </filter>
                                </defs>

                                {/* Funnel sections with responsive text */}
                                {/* Leads Generation */}
                                <g
                                    className="funnel-section"
                                    data-stage="leads"
                                >
                                    <polygon
                                        points="60,30 440,30 420,80 80,80"
                                        fill="url(#leadsGradient)"
                                        filter="url(#dropShadow)"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x="250"
                                        y="48"
                                        textAnchor="middle"
                                        className="funnel-text stage-name"
                                        fill="white"
                                    >
                                        Alcanzados
                                    </text>
                                    <text
                                        x="250"
                                        y="62"
                                        textAnchor="middle"
                                        className="funnel-text stage-number"
                                        fill="white"
                                    >
                                        1,248
                                    </text>
                                    <text
                                        x="250"
                                        y="74"
                                        textAnchor="middle"
                                        className="funnel-text stage-percentage"
                                        fill="rgba(255,255,255,0.8)"
                                    >
                                        candidatos (100%)
                                    </text>
                                </g>

                                {/* Screening */}
                                <g
                                    className="funnel-section"
                                    data-stage="screening"
                                >
                                    <polygon
                                        points="80,80 420,80 400,130 100,130"
                                        fill="url(#screeningGradient)"
                                        filter="url(#dropShadow)"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x="250"
                                        y="98"
                                        textAnchor="middle"
                                        className="funnel-text stage-name"
                                        fill="white"
                                    >
                                        Evaluados
                                    </text>
                                    <text
                                        x="250"
                                        y="112"
                                        textAnchor="middle"
                                        className="funnel-text stage-number"
                                        fill="white"
                                    >
                                        842
                                    </text>
                                    <text
                                        x="250"
                                        y="124"
                                        textAnchor="middle"
                                        className="funnel-text stage-percentage"
                                        fill="rgba(255,255,255,0.8)"
                                    >
                                        candidatos (67.5%)
                                    </text>
                                </g>

                                {/* Interview */}
                                <g
                                    className="funnel-section"
                                    data-stage="interview"
                                >
                                    <polygon
                                        points="100,130 400,130 380,180 120,180"
                                        fill="url(#interviewGradient)"
                                        filter="url(#dropShadow)"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x="250"
                                        y="148"
                                        textAnchor="middle"
                                        className="funnel-text stage-name"
                                        fill="white"
                                    >
                                        Citados
                                    </text>
                                    <text
                                        x="250"
                                        y="162"
                                        textAnchor="middle"
                                        className="funnel-text stage-number"
                                        fill="white"
                                    >
                                        324
                                    </text>
                                    <text
                                        x="250"
                                        y="174"
                                        textAnchor="middle"
                                        className="funnel-text stage-percentage"
                                        fill="rgba(255,255,255,0.8)"
                                    >
                                        candidatos (26.0%)
                                    </text>
                                </g>

                                {/* Hired */}
                                <g
                                    className="funnel-section"
                                    data-stage="hired"
                                >
                                    <polygon
                                        points="120,180 380,180 360,230 140,230"
                                        fill="url(#hiredGradient)"
                                        filter="url(#dropShadow)"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x="250"
                                        y="198"
                                        textAnchor="middle"
                                        className="funnel-text stage-name"
                                        fill="white"
                                    >
                                        Entrevistados
                                    </text>
                                    <text
                                        x="250"
                                        y="212"
                                        textAnchor="middle"
                                        className="funnel-text stage-number"
                                        fill="white"
                                    >
                                        128
                                    </text>
                                    <text
                                        x="250"
                                        y="224"
                                        textAnchor="middle"
                                        className="funnel-text stage-percentage"
                                        fill="rgba(255,255,255,0.8)"
                                    >
                                        candidatos (10.3%)
                                    </text>
                                </g>

                                {/* Contratados */}
                                <g
                                    className="funnel-section"
                                    data-stage="hired"
                                >
                                    <polygon
                                        points="140,230 360,230 340,280 160,280"
                                        fill="url(#retentionGradient)"
                                        filter="url(#dropShadow)"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x="250"
                                        y="248"
                                        textAnchor="middle"
                                        className="funnel-text stage-name"
                                        fill="white"
                                    >
                                        {funnelData.hired.label}
                                    </text>
                                    <text
                                        x="250"
                                        y="262"
                                        textAnchor="middle"
                                        className="funnel-text stage-number"
                                        fill="white"
                                    >
                                        {funnelData.hired.count.toLocaleString()}
                                    </text>
                                    <text
                                        x="250"
                                        y="274"
                                        textAnchor="middle"
                                        className="funnel-text stage-percentage"
                                        fill="rgba(255,255,255,0.8)"
                                    >
                                        candidatos {funnelData.hired.percentage}
                                    </text>
                                </g>

                                {/* Ingresados */}
                                <g
                                    className="funnel-section"
                                    data-stage="ingresados"
                                >
                                    <polygon
                                        points="160,280 340,280 320,330 180,330"
                                        fill="url(#ingresadosGradient)"
                                        filter="url(#dropShadow)"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x="250"
                                        y="298"
                                        textAnchor="middle"
                                        className="funnel-text stage-name"
                                        fill="white"
                                    >
                                        {funnelData.ingresados.label}
                                    </text>
                                    <text
                                        x="250"
                                        y="312"
                                        textAnchor="middle"
                                        className="funnel-text stage-number"
                                        fill="white"
                                    >
                                        {funnelData.ingresados.count.toLocaleString()}
                                    </text>
                                    <text
                                        x="250"
                                        y="324"
                                        textAnchor="middle"
                                        className="funnel-text stage-percentage"
                                        fill="rgba(255,255,255,0.8)"
                                    >
                                        candidatos {funnelData.ingresados.percentage}
                                    </text>
                                </g>

                                {/* Smooth connectors */}
                                <g className="connector">
                                    <path
                                        d="M 245 82 Q 250 87 255 82 Q 250 92 245 87 Z"
                                        fill="#64748b"
                                        opacity="0.6"
                                    />
                                </g>
                                <g className="connector">
                                    <path
                                        d="M 246 132 Q 250 137 254 132 Q 250 142 246 137 Z"
                                        fill="#64748b"
                                        opacity="0.6"
                                    />
                                </g>
                                <g className="connector">
                                    <path
                                        d="M 247 182 Q 250 187 253 182 Q 250 192 247 187 Z"
                                        fill="#64748b"
                                        opacity="0.6"
                                    />
                                </g>
                                <g className="connector">
                                    <path
                                        d="M 248 232 Q 250 237 252 232 Q 250 242 248 237 Z"
                                        fill="#64748b"
                                        opacity="0.6"
                                    />
                                </g>
                                <g className="connector">
                                    <path
                                        d="M 249 282 Q 250 287 251 282 Q 250 292 249 287 Z"
                                        fill="#64748b"
                                        opacity="0.6"
                                    />
                                </g>
                            </svg>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


export function ConversionFunnelForCompany179({
    dateRange,
}: {
    dateRange?: { startDate?: string; endDate?: string };
} = {}) {
    const companyId = useCompanyID();
    const { data: stats, isLoading } = useCandidatesStatsData(companyId, dateRange);

    const funnelData = useMemo(() => {
        if (!stats) return null;

        const totalEvaluated = stats.total_evaluated ?? 0;

        const citados = stats.interview_cited ?? 0; // Citados 2 (entrevista presencial)
        const entrevistados = stats.entrevistados ?? 0; // Entrevistados 2
        const hired = stats.hired ?? 0;
        const ingresados = stats.ingresados ?? 0;

        // NUEVOS CONTADORES (de backend: get_candidates_statistics)
        const phoneInterviewCited = stats.phone_interview_cited ?? 0; // Citados 1
        // Entrevistados 1: usa phone_interviews_completed del backend
        // (candidatos que completaron la entrevista telefónica: pasaron O fallaron)
        const postPhoneScheduledInterview =
            stats.phone_interviews_completed ?? 0; // Entrevistados 1

        // Porcentajes
        const percentageOrZero = (value: number) =>
            totalEvaluated > 0
                ? ((value / totalEvaluated) * 100).toFixed(1) + '%'
                : '0%';

        const citados1Percentage = percentageOrZero(phoneInterviewCited);
        const entrevistados1Percentage = percentageOrZero(
            postPhoneScheduledInterview
        );
        const citados2Percentage = percentageOrZero(citados);
        const entrevistados2Percentage = percentageOrZero(entrevistados);
        const contratadosPercentage = percentageOrZero(hired);
        const ingresadosPercentage = percentageOrZero(ingresados);

        return {
            evaluation: {
                count: totalEvaluated,
                percentage: '100%',
                label: 'Evaluados',
            },
            citados1: {
                count: phoneInterviewCited,
                percentage: citados1Percentage,
                label: 'Citados E1',
            },
            entrevistados1: {
                count: postPhoneScheduledInterview,
                percentage: entrevistados1Percentage,
                label: 'Entrevistados E1',
            },
            citados2: {
                count: citados,
                percentage: citados2Percentage,
                label: 'Citados E2',
            },
            entrevistados2: {
                count: entrevistados,
                percentage: entrevistados2Percentage,
                label: 'Entrevistados E2',
            },
            hired: {
                count: hired,
                percentage: contratadosPercentage,
                label: 'Contratados',
            },
            ingresados: {
                count: ingresados,
                percentage: ingresadosPercentage,
                label: 'Ingresados',
            },
        };
    }, [stats]);

    if (isLoading || !funnelData) {
        return (
            <Card className="overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-lg sm:text-xl">
                            Conversión de Candidatos
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            className="self-start sm:self-auto"
                        >
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Exportar</span>
                            <span className="sm:hidden">Exportar</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <div
                        className="w-full flex items-center justify-center"
                        style={{ height: 'clamp(340px, 45vh, 520px)' }}
                    >
                        <div className="animate-pulse text-muted-foreground">
                            Cargando datos de la conversión de candidatos...
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-2 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-lg sm:text-xl">
                        Conversión de Candidatos
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-1">
                <div className="w-full">
                    <div
                        className="w-full max-w-5xl mx-auto"
                        style={{
                            height: 'clamp(400px, 50vh, 600px)',
                        }}
                    >
                        <style jsx>{`
                            .funnel-section {
                                transition: all 0.3s ease;
                                cursor: pointer;
                            }
                            .funnel-section:hover {
                                transform: scale(1.02);
                                filter: brightness(1.1);
                            }
                            .funnel-text {
                                font-family: 'Inter', -apple-system,
                                    BlinkMacSystemFont, sans-serif;
                                transition: all 0.3s ease;
                            }
                            .stage-name {
                                font-weight: 500;
                            }
                            .stage-number {
                                font-weight: 700;
                            }
                            .stage-percentage {
                                font-weight: 400;
                                opacity: 0.8;
                            }
                            .connector {
                                transition: all 0.3s ease;
                            }
                            @keyframes fadeInUp {
                                from {
                                    opacity: 0;
                                    transform: translateY(20px);
                                }
                                to {
                                    opacity: 1;
                                    transform: translateY(0);
                                }
                            }
                            .funnel-container {
                                animation: fadeInUp 0.8s ease-out;
                            }

                            /* Mobile-specific text sizing */
                            @media (max-width: 640px) {
                                .stage-name {
                                    font-size: 8.8px;
                                }
                                .stage-number {
                                    font-size: 9.6px;
                                }
                                .stage-percentage {
                                    font-size: 8px;
                                }
                            }

                            /* Tablet and desktop text sizing */
                            @media (min-width: 641px) {
                                .stage-name {
                                    font-size: 11.2px;
                                }
                                .stage-number {
                                    font-size: 12.8px;
                                }
                                .stage-percentage {
                                    font-size: 10.4px;
                                }
                            }
                        `}</style>

                        <div className="funnel-container h-full flex items-center justify-center">
                            <svg
                                viewBox="0 0 400 260"
                                className="w-full h-auto max-h-full drop-shadow-lg"
                                role="img"
                                aria-labelledby="funnel-title"
                                preserveAspectRatio="xMidYMid meet"
                            >
                                <title id="funnel-title">
                                    Conversión de Candidatos
                                </title>
                                <defs>
                                    <linearGradient
                                        id="evaluationGradient179"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop offset="0%" stopColor="#005693" />
                                        <stop
                                            offset="100%"
                                            stopColor="#005693"
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="citados1Gradient179"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop offset="0%" stopColor="#0078C8" />
                                        <stop
                                            offset="100%"
                                            stopColor="#0078C8"
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="entrevistados1Gradient179"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop offset="0%" stopColor="#006EBD" />
                                        <stop
                                            offset="100%"
                                            stopColor="#006EBD"
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="citados2Gradient179"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop offset="0%" stopColor="#068EEF" />
                                        <stop
                                            offset="100%"
                                            stopColor="#068EEF"
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="entrevistados2Gradient179"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#5AB3F2"
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#5AB3F2"
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="hiredGradient179"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#A8D2F0"
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#A8D2F0"
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="ingresadosGradient179"
                                        x1="0%"
                                        y1="0%"
                                        x2="0%"
                                        y2="100%"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#D1E6F7"
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#D1E6F7"
                                        />
                                    </linearGradient>

                                    <filter
                                        id="dropShadow179"
                                        x="-20%"
                                        y="-20%"
                                        width="140%"
                                        height="140%"
                                    >
                                        <feDropShadow
                                            dx="0"
                                            dy="2"
                                            stdDeviation="3"
                                            floodColor="#000000"
                                            floodOpacity="0.1"
                                        />
                                    </filter>
                                </defs>

                                {/* Evaluados */}
                                <g
                                    className="funnel-section"
                                    data-stage="evaluation"
                                >
                                    <polygon
                                        points="70,15 330,15 320,48 80,48"
                                        fill="url(#evaluationGradient179)"
                                        filter="url(#dropShadow179)"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x="200"
                                        y="27"
                                        textAnchor="middle"
                                        className="funnel-text stage-name"
                                        fill="white"
                                    >
                                        {funnelData.evaluation.label}
                                    </text>
                                    <text
                                        x="200"
                                        y="37"
                                        textAnchor="middle"
                                        className="funnel-text stage-number"
                                        fill="white"
                                    >
                                        {funnelData.evaluation.count.toLocaleString()}
                                    </text>
                                    <text
                                        x="200"
                                        y="44"
                                        textAnchor="middle"
                                        className="funnel-text stage-percentage"
                                        fill="rgba(255,255,255,0.8)"
                                    >
                                        candidatos{' '}
                                        {funnelData.evaluation.percentage}
                                    </text>
                                </g>

                                {/* Citados 1 */}
                                <g
                                    className="funnel-section"
                                    data-stage="citados1"
                                >
                                    <polygon
                                        points="80,48 320,48 310,81 90,81"
                                        fill="url(#citados1Gradient179)"
                                        filter="url(#dropShadow179)"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x="200"
                                        y="60"
                                        textAnchor="middle"
                                        className="funnel-text stage-name"
                                        fill="white"
                                    >
                                        {funnelData.citados1.label}
                                    </text>
                                    <text
                                        x="200"
                                        y="70"
                                        textAnchor="middle"
                                        className="funnel-text stage-number"
                                        fill="white"
                                    >
                                        {funnelData.citados1.count.toLocaleString()}
                                    </text>
                                    <text
                                        x="200"
                                        y="77"
                                        textAnchor="middle"
                                        className="funnel-text stage-percentage"
                                        fill="rgba(255,255,255,0.8)"
                                    >
                                        candidatos {funnelData.citados1.percentage}
                                    </text>
                                </g>

                                {/* Entrevistados 1 */}
                                <g
                                    className="funnel-section"
                                    data-stage="entrevistados1"
                                >
                                    <polygon
                                        points="90,81 310,81 300,114 100,114"
                                        fill="url(#entrevistados1Gradient179)"
                                        filter="url(#dropShadow179)"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x="200"
                                        y="93"
                                        textAnchor="middle"
                                        className="funnel-text stage-name"
                                        fill="white"
                                    >
                                        {funnelData.entrevistados1.label}
                                    </text>
                                    <text
                                        x="200"
                                        y="103"
                                        textAnchor="middle"
                                        className="funnel-text stage-number"
                                        fill="white"
                                    >
                                        {funnelData.entrevistados1.count.toLocaleString()}
                                    </text>
                                    <text
                                        x="200"
                                        y="110"
                                        textAnchor="middle"
                                        className="funnel-text stage-percentage"
                                        fill="rgba(255,255,255,0.8)"
                                    >
                                        candidatos{' '}
                                        {funnelData.entrevistados1.percentage}
                                    </text>
                                </g>

                                {/* Citados 2 */}
                                <g
                                    className="funnel-section"
                                    data-stage="citados2"
                                >
                                    <polygon
                                        points="100,114 300,114 290,147 110,147"
                                        fill="url(#citados2Gradient179)"
                                        filter="url(#dropShadow179)"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x="200"
                                        y="126"
                                        textAnchor="middle"
                                        className="funnel-text stage-name"
                                        fill="white"
                                    >
                                        {funnelData.citados2.label}
                                    </text>
                                    <text
                                        x="200"
                                        y="136"
                                        textAnchor="middle"
                                        className="funnel-text stage-number"
                                        fill="white"
                                    >
                                        {funnelData.citados2.count.toLocaleString()}
                                    </text>
                                    <text
                                        x="200"
                                        y="143"
                                        textAnchor="middle"
                                        className="funnel-text stage-percentage"
                                        fill="rgba(255,255,255,0.8)"
                                    >
                                        candidatos {funnelData.citados2.percentage}
                                    </text>
                                </g>

                                {/* Entrevistados 2 */}
                                <g
                                    className="funnel-section"
                                    data-stage="entrevistados2"
                                >
                                    <polygon
                                        points="110,147 290,147 280,180 120,180"
                                        fill="url(#entrevistados2Gradient179)"
                                        filter="url(#dropShadow179)"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x="200"
                                        y="159"
                                        textAnchor="middle"
                                        className="funnel-text stage-name"
                                        fill="white"
                                    >
                                        {funnelData.entrevistados2.label}
                                    </text>
                                    <text
                                        x="200"
                                        y="169"
                                        textAnchor="middle"
                                        className="funnel-text stage-number"
                                        fill="white"
                                    >
                                        {funnelData.entrevistados2.count.toLocaleString()}
                                    </text>
                                    <text
                                        x="200"
                                        y="176"
                                        textAnchor="middle"
                                        className="funnel-text stage-percentage"
                                        fill="rgba(255,255,255,0.8)"
                                    >
                                        candidatos{' '}
                                        {funnelData.entrevistados2.percentage}
                                    </text>
                                </g>

                                {/* Contratados */}
                                <g
                                    className="funnel-section"
                                    data-stage="hired"
                                >
                                    <polygon
                                        points="120,180 280,180 270,213 130,213"
                                        fill="url(#hiredGradient179)"
                                        filter="url(#dropShadow179)"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x="200"
                                        y="192"
                                        textAnchor="middle"
                                        className="funnel-text stage-name"
                                        fill="white"
                                    >
                                        {funnelData.hired.label}
                                    </text>
                                    <text
                                        x="200"
                                        y="202"
                                        textAnchor="middle"
                                        className="funnel-text stage-number"
                                        fill="white"
                                    >
                                        {funnelData.hired.count.toLocaleString()}
                                    </text>
                                    <text
                                        x="200"
                                        y="209"
                                        textAnchor="middle"
                                        className="funnel-text stage-percentage"
                                        fill="rgba(255,255,255,0.8)"
                                    >
                                        candidatos {funnelData.hired.percentage}
                                    </text>
                                </g>

                                {/* Ingresados */}
                                {'ingresados' in funnelData && (
                                    <g
                                        className="funnel-section"
                                        data-stage="ingresados"
                                    >
                                        <polygon
                                            points="130,213 270,213 260,246 140,246"
                                            fill="url(#ingresadosGradient179)"
                                            filter="url(#dropShadow179)"
                                            stroke="rgba(255,255,255,0.2)"
                                            strokeWidth="1"
                                        />
                                        <text
                                            x="200"
                                            y="225"
                                            textAnchor="middle"
                                            className="funnel-text stage-name"
                                            fill="white"
                                        >
                                            {funnelData.ingresados.label}
                                        </text>
                                        <text
                                            x="200"
                                            y="235"
                                            textAnchor="middle"
                                            className="funnel-text stage-number"
                                            fill="white"
                                        >
                                            {funnelData.ingresados.count.toLocaleString()}
                                        </text>
                                        <text
                                            x="200"
                                            y="242"
                                            textAnchor="middle"
                                            className="funnel-text stage-percentage"
                                            fill="rgba(255,255,255,0.8)"
                                        >
                                            candidatos{' '}
                                            {funnelData.ingresados.percentage}
                                        </text>
                                    </g>
                                )}
                            </svg>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
