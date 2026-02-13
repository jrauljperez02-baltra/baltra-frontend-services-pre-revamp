'use client';

import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PendingInterviewsAlert } from '@/components/pending-interviews-alert';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCompanyID } from '@/context/CompanyContext';
import type { MessageTemplate } from '@/lib/api';
import { useMapMessageTemplates } from '@/querys/message_template';
import { useScreeningStats } from '@/querys/screening-stats';
import {
    ArrowUpRight,
    Building,
    Calendar,
    Facebook,
    MapPin,
    PlusCircle,
    Radio,
    Target,
    UserCheck,
    UserX,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { DashboardTracker } from '@/components/dashboard-tracker';
import { getRejectionReasonLabel } from '@/lib/rejection-reasons';

// Función helper para formatear el texto de las preguntas y mostrar más contexto
const formatQuestionText = (text: string) => {
    // Si el texto parece ser una pregunta completa, la mostramos tal como está
    if (text.includes('¿') || text.includes('?') || text.length < 50) {
        return text;
    }

    // Si es un texto muy largo, intentamos mostrar las primeras palabras importantes
    const sentences = text.split(/[.!?]/);
    if (sentences.length > 1 && sentences[0].length > 10) {
        return sentences[0].trim() + (text.includes('?') ? '?' : '...');
    }

    return text;
};

const truncateText = (text: string, maxLength = 30) => {
    const formatted = formatQuestionText(text);
    if (formatted.length <= maxLength) return formatted;
    return `${formatted.substring(0, maxLength)}...`;
};

// Función para obtener la pregunta real desde los templates usando keyword/ID
const getQuestionFromTemplate = (
    questionKey: string,
    messageTemplates: Record<string, MessageTemplate> | undefined
) => {
    if (!messageTemplates) return questionKey;

    // Buscar en los templates el que coincida con el questionKey
    const template = Object.values(messageTemplates).find((template) => {
        // Puede coincidir por ID, keyword, o contenido parcial
        return (
            template.id.toString() === questionKey ||
            template.keyword === questionKey ||
            template.text?.includes(questionKey) ||
            questionKey.includes(template.keyword)
        );
    });

    // Si encontramos el template, devolver el texto real
    if (template?.text) {
        return template.text;
    }

    // Si no encontramos template, devolver el questionKey original
    return questionKey;
};

export default function LeadsPage() {
    const companyId = useCompanyID();

    // Configurar fechas por defecto
    const today = new Date();
    const eightDaysAgo = new Date(today);
    eightDaysAgo.setDate(today.getDate() - 8);

    const [startDate, setStartDate] = useState(
        eightDaysAgo.toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const { data: screeningStats, isLoading } = useScreeningStats(
        companyId,
        startDate,
        endDate
    );

    // Debug logging
    console.log('🔍 Debug - screeningStats:', screeningStats);
    console.log(
        '🔍 Debug - rejected_candidates:',
        screeningStats?.rejected_candidates
    );
    if (screeningStats?.rejected_candidates) {
        console.log(
            '🔍 Debug - screening_rejections:',
            screeningStats.rejected_candidates.screening_rejections
        );
        console.log(
            '🔍 Debug - manual_rejections:',
            screeningStats.rejected_candidates.manual_rejections
        );
        console.log(
            '🔍 Debug - rejected_candidates type:',
            typeof screeningStats.rejected_candidates
        );
        console.log(
            '🔍 Debug - rejected_candidates keys:',
            Object.keys(screeningStats.rejected_candidates)
        );
    }

    const { data: messageTemplates } = useMapMessageTemplates(companyId);

    // Handle both old and new format for rejected_candidates
    let processedRejectedCandidates = screeningStats?.rejected_candidates;
    if (
        screeningStats?.rejected_candidates &&
        !('screening_rejections' in screeningStats.rejected_candidates) &&
        !('manual_rejections' in screeningStats.rejected_candidates)
    ) {
        // Old format - convert to new format
        console.log('🔄 Converting old format to new format');
        processedRejectedCandidates = {
            screening_rejections: screeningStats.rejected_candidates as Record<
                string,
                number
            >,
            manual_rejections: {},
        };
    }

    // Procesar datos de churn_data para obtener estadísticas de leads
    const totalLeads =
        screeningStats?.multi_user_data?.total_screening_candidates || 0;
    const rejectedTotal =
        (Object.values(
            processedRejectedCandidates?.screening_rejections || {}
        ).reduce((sum: number, count: number) => sum + count, 0) as number) +
        (Object.values(
            processedRejectedCandidates?.manual_rejections || {}
        ).reduce((sum: number, count: number) => sum + count, 0) as number);
    const reachedViaAd =
        screeningStats?.ad_reach_data?.candidates_reached_via_ad || 0;
    const notReachedViaAd =
        screeningStats?.ad_reach_data?.candidates_not_reached_via_ad || 0;

    return (
        <>
            <DashboardTracker pageName="Leads" />
            <TooltipProvider>
                <div className="flex flex-col min-h-screen">
                    <div className="px-4 md:px-8 pt-6">
                        <PendingInterviewsAlert />
                    </div>
                    <PageHeader
                        title="Generación de Candidatos"
                        description="Monitorea y gestiona candidatos entrantes de múltiples canales"
                    />

                    <div className="p-6 space-y-6">
                        {/* Selector de fechas */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Rango de Fechas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="start-date">
                                            Fecha de Inicio
                                        </Label>
                                        <Input
                                            id="start-date"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) =>
                                                setStartDate(e.target.value)
                                            }
                                            max={endDate}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end-date">
                                            Fecha de Fin
                                        </Label>
                                        <Input
                                            id="end-date"
                                            type="date"
                                            value={endDate}
                                            onChange={(e) =>
                                                setEndDate(e.target.value)
                                            }
                                            min={startDate}
                                            max={
                                                today
                                                    .toISOString()
                                                    .split('T')[0]
                                            }
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                            <StatCard
                                title="Total Candidatos Generados"
                                value={
                                    isLoading
                                        ? 'Cargando...'
                                        : totalLeads.toString()
                                }
                                trend={{
                                    value: '-',
                                    label: 'del mes pasado',
                                    positive: true,
                                }}
                                icon={<Users className="h-4 w-4" />}
                            />
                            <StatCard
                                title="Alcanzados via Ads"
                                value={
                                    isLoading
                                        ? 'Cargando...'
                                        : reachedViaAd.toString()
                                }
                                trend={{
                                    value: '-',
                                    label: 'del mes pasado',
                                    positive: true,
                                }}
                                icon={<Target className="h-4 w-4" />}
                            />
                            <StatCard
                                title="No Alcanzados via Ads"
                                value={
                                    isLoading
                                        ? 'Cargando...'
                                        : notReachedViaAd.toString()
                                }
                                trend={{
                                    value: '-',
                                    label: 'del mes pasado',
                                    positive: true,
                                }}
                                icon={<Radio className="h-4 w-4" />}
                            />
                            <StatCard
                                title="Candidatos Filtrados"
                                value={
                                    isLoading
                                        ? 'Cargando...'
                                        : (
                                              screeningStats?.multi_user_data
                                                  ?.multi_user_message_candidates ||
                                              0
                                          ).toString()
                                }
                                trend={{
                                    value: '-',
                                    label: 'del mes pasado',
                                    positive: true,
                                }}
                                icon={<UserCheck className="h-4 w-4" />}
                            />
                            <StatCard
                                title="Candidatos Rechazados"
                                value={
                                    isLoading
                                        ? 'Cargando...'
                                        : rejectedTotal.toString()
                                }
                                trend={{
                                    value: '-',
                                    label: 'del mes pasado',
                                    positive: false,
                                }}
                                icon={<UserX className="h-4 w-4" />}
                            />
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Motivos de Abandono en el Chat
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="w-full">
                                    <div className="space-y-4">
                                        <div className="text-sm text-muted-foreground text-center">
                                            Candidatos que abandonaron el
                                            proceso por pregunta (Últimos 8
                                            días)
                                        </div>

                                        <div className="space-y-4">
                                            {screeningStats?.churn_data &&
                                                Object.entries(
                                                    screeningStats.churn_data
                                                )
                                                    .sort(
                                                        (a, b) =>
                                                            (b[1] as number) -
                                                            (a[1] as number)
                                                    )
                                                    .map(
                                                        (
                                                            [question, count],
                                                            index
                                                        ) => {
                                                            // Convertir la keyword/ID a la pregunta real
                                                            const realQuestion =
                                                                getQuestionFromTemplate(
                                                                    question,
                                                                    messageTemplates
                                                                );

                                                            const totalChurn =
                                                                Object.values(
                                                                    screeningStats.churn_data
                                                                ).reduce(
                                                                    (
                                                                        sum: number,
                                                                        val: number
                                                                    ) =>
                                                                        sum +
                                                                        val,
                                                                    0
                                                                ) as number;
                                                            const percentage =
                                                                totalChurn > 0
                                                                    ? ((count as number) /
                                                                          totalChurn) *
                                                                      100
                                                                    : 0;
                                                            const colors = [
                                                                'bg-baltra-600',
                                                                'bg-baltra-500',
                                                                'bg-baltra-400',
                                                                'bg-baltra-300',
                                                                'bg-baltra-200',
                                                            ];
                                                            const iconColors = [
                                                                'text-baltra-600',
                                                                'text-baltra-600',
                                                                'text-baltra-600',
                                                                'text-baltra-600',
                                                                'text-baltra-600',
                                                            ];

                                                            return (
                                                                <div
                                                                    key={
                                                                        question
                                                                    }
                                                                    className="grid grid-cols-12 gap-4 items-center"
                                                                >
                                                                    <div className="col-span-4 flex items-center gap-3">
                                                                        <UserX
                                                                            className={`h-5 w-5 ${iconColors[index % iconColors.length]}`}
                                                                        />
                                                                        <Tooltip>
                                                                            <TooltipTrigger
                                                                                asChild
                                                                            >
                                                                                <span className="font-medium text-sm cursor-help hover:text-blue-600 transition-colors">
                                                                                    {index +
                                                                                        1}

                                                                                    .{' '}
                                                                                    {truncateText(
                                                                                        realQuestion
                                                                                    )}
                                                                                </span>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent
                                                                                side="right"
                                                                                className="max-w-md p-3"
                                                                            >
                                                                                <div className="space-y-2">
                                                                                    <p className="text-sm font-medium text-foreground">
                                                                                        Pregunta
                                                                                        completa:
                                                                                    </p>
                                                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                                                        {formatQuestionText(
                                                                                            realQuestion
                                                                                        )}
                                                                                    </p>
                                                                                    {question !==
                                                                                        realQuestion && (
                                                                                        <div className="text-xs text-muted-foreground">
                                                                                            <span className="font-medium">
                                                                                                Keyword:
                                                                                            </span>{' '}
                                                                                            {
                                                                                                question
                                                                                            }
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="text-xs text-muted-foreground pt-1 border-t">
                                                                                        {
                                                                                            count as number
                                                                                        }{' '}
                                                                                        candidatos
                                                                                        abandonaron
                                                                                        en
                                                                                        esta
                                                                                        pregunta
                                                                                    </div>
                                                                                </div>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </div>
                                                                    <div className="col-span-6">
                                                                        <div className="bg-gray-200 rounded-full h-6">
                                                                            <div
                                                                                className={`${colors[index % colors.length]} h-6 rounded-full`}
                                                                                style={{
                                                                                    width: `${percentage}%`,
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-span-2 text-right flex items-center justify-end gap-2">
                                                                        <span className="font-bold text-lg">
                                                                            {
                                                                                count as number
                                                                            }
                                                                        </span>
                                                                        <span className="text-sm text-muted-foreground">
                                                                            (
                                                                            {(
                                                                                ((count as number) /
                                                                                    (Object.values(
                                                                                        screeningStats.churn_data
                                                                                    ).reduce(
                                                                                        (
                                                                                            sum: number,
                                                                                            val: number
                                                                                        ) =>
                                                                                            sum +
                                                                                            val,
                                                                                        0
                                                                                    ) as number)) *
                                                                                100
                                                                            ).toFixed(
                                                                                1
                                                                            )}
                                                                            %)
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                        </div>

                                        <div className="text-center text-sm text-muted-foreground pt-4">
                                            Total abandonos:{' '}
                                            {
                                                Object.values(
                                                    screeningStats?.churn_data ||
                                                        {}
                                                ).reduce(
                                                    (
                                                        sum: number,
                                                        count: number
                                                    ) => sum + count,
                                                    0
                                                ) as number
                                            }
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Motivos de Rechazo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="w-full">
                                    <div className="space-y-6">
                                        <div className="text-sm text-muted-foreground text-center">
                                            Candidatos rechazados por motivo
                                            (Últimos 8 días)
                                        </div>

                                        {/* Debug section - remove this once working */}
                                        {process.env.NODE_ENV ===
                                            'dev' && (
                                            <div className="bg-gray-100 p-4 rounded-lg text-xs">
                                                <div>Debug Info:</div>
                                                <div>
                                                    screeningStats present:{' '}
                                                    {screeningStats
                                                        ? 'Yes'
                                                        : 'No'}
                                                </div>
                                                <div>
                                                    rejected_candidates present:{' '}
                                                    {screeningStats?.rejected_candidates
                                                        ? 'Yes'
                                                        : 'No'}
                                                </div>
                                                <div>
                                                    screening_rejections
                                                    present:{' '}
                                                    {screeningStats
                                                        ?.rejected_candidates
                                                        ?.screening_rejections
                                                        ? 'Yes'
                                                        : 'No'}
                                                </div>
                                                <div>
                                                    manual_rejections present:{' '}
                                                    {screeningStats
                                                        ?.rejected_candidates
                                                        ?.manual_rejections
                                                        ? 'Yes'
                                                        : 'No'}
                                                </div>
                                                {screeningStats
                                                    ?.rejected_candidates
                                                    ?.screening_rejections && (
                                                    <div>
                                                        screening_rejections
                                                        keys:{' '}
                                                        {JSON.stringify(
                                                            Object.keys(
                                                                screeningStats
                                                                    .rejected_candidates
                                                                    .screening_rejections
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                                {screeningStats
                                                    ?.rejected_candidates
                                                    ?.manual_rejections && (
                                                    <div>
                                                        manual_rejections keys:{' '}
                                                        {JSON.stringify(
                                                            Object.keys(
                                                                screeningStats
                                                                    .rejected_candidates
                                                                    .manual_rejections
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Show message if no rejection data at all */}
                                        {!processedRejectedCandidates?.screening_rejections &&
                                            !processedRejectedCandidates?.manual_rejections && (
                                                <div className="text-center text-muted-foreground py-8">
                                                    <div className="text-lg mb-2">
                                                        📊
                                                    </div>
                                                    <div>
                                                        No hay datos de rechazos
                                                        disponibles para este
                                                        período
                                                    </div>
                                                </div>
                                            )}

                                        {/* Rechazo en Chat Section */}
                                        {processedRejectedCandidates?.screening_rejections && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 pb-2 border-b border-baltra-200">
                                                    <div className="w-3 h-3 bg-baltra-500 rounded-full"></div>
                                                    <h3 className="text-sm font-semibold text-baltra-700">
                                                        Rechazo en Chat
                                                    </h3>
                                                </div>
                                                <div className="space-y-3">
                                                    {Object.keys(
                                                        processedRejectedCandidates.screening_rejections
                                                    ).length > 0 ? (
                                                        Object.entries(
                                                            processedRejectedCandidates.screening_rejections
                                                        )
                                                            .sort(
                                                                (a, b) =>
                                                                    (b[1] as number) -
                                                                    (a[1] as number)
                                                            )
                                                            .map(
                                                                (
                                                                    [
                                                                        reason,
                                                                        count,
                                                                    ],
                                                                    index
                                                                ) => {
                                                                    const totalScreeningRejected =
                                                                        Object.values(
                                                                            processedRejectedCandidates.screening_rejections
                                                                        ).reduce(
                                                                            (
                                                                                sum: number,
                                                                                val: number
                                                                            ) =>
                                                                                sum +
                                                                                val,
                                                                            0
                                                                        ) as number;
                                                                    const percentage =
                                                                        totalScreeningRejected >
                                                                        0
                                                                            ? ((count as number) /
                                                                                  totalScreeningRejected) *
                                                                              100
                                                                            : 0;

                                                                    return (
                                                                        <div
                                                                            key={`screening-${reason}`}
                                                                            className="grid grid-cols-12 gap-4 items-center"
                                                                        >
                                                                            <div className="col-span-4 flex items-center gap-3">
                                                                                <UserX className="h-4 w-4 text-blue-500" />
                                                                                <Tooltip>
                                                                                    <TooltipTrigger
                                                                                        asChild
                                                                                    >
                                                                                        <span className="font-medium text-sm cursor-help hover:text-blue-600 transition-colors">
                                                                                            {truncateText(
                                                                                                reason
                                                                                            )}
                                                                                        </span>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent
                                                                                        side="right"
                                                                                        className="max-w-md p-3"
                                                                                    >
                                                                                        <div className="space-y-2">
                                                                                            <p className="text-sm font-medium text-foreground">
                                                                                                Pregunta
                                                                                                de
                                                                                                rechazo:
                                                                                            </p>
                                                                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                                                                {formatQuestionText(
                                                                                                    reason
                                                                                                )}
                                                                                            </p>
                                                                                            <div className="text-xs text-muted-foreground pt-1 border-t">
                                                                                                {
                                                                                                    count as number
                                                                                                }{' '}
                                                                                                candidatos
                                                                                                rechazados
                                                                                                en
                                                                                                esta
                                                                                                pregunta
                                                                                            </div>
                                                                                        </div>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </div>
                                                                            <div className="col-span-6">
                                                                                <div className="bg-baltra-100 rounded-full h-5">
                                                                                    <div
                                                                                        className="bg-baltra-500 h-5 rounded-full"
                                                                                        style={{
                                                                                            width: `${percentage}%`,
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-span-2 text-right flex items-center justify-end gap-2">
                                                                                <span className="font-bold text-base">
                                                                                    {
                                                                                        count as number
                                                                                    }
                                                                                </span>
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    (
                                                                                    {percentage.toFixed(
                                                                                        1
                                                                                    )}
                                                                                    %)
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                            )
                                                    ) : (
                                                        <div className="text-center text-sm text-muted-foreground py-4">
                                                            No hay rechazos en
                                                            chat en este período
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Rechazo Manual Section */}
                                        {processedRejectedCandidates?.manual_rejections && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 pb-2 border-b border-baltra-200">
                                                    <div className="w-3 h-3 bg-baltra-500 rounded-full"></div>
                                                    <h3 className="text-sm font-semibold text-baltra-700">
                                                        Rechazo Manual
                                                    </h3>
                                                </div>
                                                <div className="space-y-3">
                                                    {Object.keys(
                                                        processedRejectedCandidates.manual_rejections
                                                    ).length > 0 ? (
                                                        Object.entries(
                                                            processedRejectedCandidates.manual_rejections
                                                        )
                                                            .sort(
                                                                (a, b) =>
                                                                    (b[1] as number) -
                                                                    (a[1] as number)
                                                            )
                                                            .map(
                                                                (
                                                                    [
                                                                        reason,
                                                                        count,
                                                                    ],
                                                                    index
                                                                ) => {
                                                                    const totalManualRejected =
                                                                        Object.values(
                                                                            processedRejectedCandidates.manual_rejections
                                                                        ).reduce(
                                                                            (
                                                                                sum: number,
                                                                                val: number
                                                                            ) =>
                                                                                sum +
                                                                                val,
                                                                            0
                                                                        ) as number;
                                                                    const percentage =
                                                                        totalManualRejected >
                                                                        0
                                                                            ? ((count as number) /
                                                                                  totalManualRejected) *
                                                                              100
                                                                            : 0;

                                                                    return (
                                                                        <div
                                                                            key={`manual-${reason}`}
                                                                            className="grid grid-cols-12 gap-4 items-center"
                                                                        >
                                                                            <div className="col-span-4 flex items-center gap-3">
                                                                                <UserX className="h-4 w-4 text-baltra-500" />
                                                                                <Tooltip>
                                                                                    <TooltipTrigger
                                                                                        asChild
                                                                                    >
                                                                                        <span className="font-medium text-sm cursor-help hover:text-baltra-600 transition-colors">
                                                                                            {truncateText(
                                                                                                getRejectionReasonLabel(
                                                                                                    reason,
                                                                                                    companyId
                                                                                                )
                                                                                            )}
                                                                                        </span>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent
                                                                                        side="right"
                                                                                        className="max-w-md p-3"
                                                                                    >
                                                                                        <div className="space-y-2">
                                                                                            <p className="text-sm font-medium text-foreground">
                                                                                                Motivo
                                                                                                de
                                                                                                rechazo
                                                                                                manual:
                                                                                            </p>
                                                                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                                                                {getRejectionReasonLabel(
                                                                                                    reason,
                                                                                                    companyId
                                                                                                )}
                                                                                            </p>
                                                                                            <div className="text-xs text-muted-foreground pt-1 border-t">
                                                                                                {
                                                                                                    count as number
                                                                                                }{' '}
                                                                                                candidatos
                                                                                                rechazados
                                                                                                manualmente
                                                                                                por
                                                                                                este
                                                                                                motivo
                                                                                            </div>
                                                                                        </div>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </div>
                                                                            <div className="col-span-6">
                                                                                <div className="bg-baltra-100 rounded-full h-5">
                                                                                    <div
                                                                                        className="bg-baltra-500 h-5 rounded-full"
                                                                                        style={{
                                                                                            width: `${percentage-50}%`,
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-span-2 text-right flex items-center justify-end gap-2">
                                                                                <span className="font-bold text-base">
                                                                                    {
                                                                                        count as number
                                                                                    }
                                                                                </span>
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    (
                                                                                    {percentage.toFixed(
                                                                                        1
                                                                                    )}
                                                                                    %)
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                            )
                                                    ) : (
                                                        <div className="text-center text-sm text-muted-foreground py-4">
                                                            No hay rechazos
                                                            manuales en este
                                                            período
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Total Summary */}
                                        <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                                            Total rechazos:{' '}
                                            {(Object.values(
                                                processedRejectedCandidates?.screening_rejections ||
                                                    {}
                                            ).reduce(
                                                (sum: number, count: number) =>
                                                    sum + count,
                                                0
                                            ) as number) +
                                                (Object.values(
                                                    processedRejectedCandidates?.manual_rejections ||
                                                        {}
                                                ).reduce(
                                                    (
                                                        sum: number,
                                                        count: number
                                                    ) => sum + count,
                                                    0
                                                ) as number)}
                                            {processedRejectedCandidates?.screening_rejections &&
                                                Object.keys(
                                                    processedRejectedCandidates.screening_rejections
                                                ).length > 0 && (
                                                    <span className="text-baltra-600 ml-2">
                                                        (
                                                        {
                                                            Object.values(
                                                                processedRejectedCandidates.screening_rejections
                                                            ).reduce(
                                                                (
                                                                    sum: number,
                                                                    count: number
                                                                ) =>
                                                                    sum + count,
                                                                0
                                                            ) as number
                                                        }{' '}
                                                        en chat)
                                                    </span>
                                                )}
                                            {processedRejectedCandidates?.manual_rejections &&
                                                Object.keys(
                                                    processedRejectedCandidates.manual_rejections
                                                ).length > 0 && (
                                                    <span className="text-baltra-600 ml-2">
                                                        (
                                                        {
                                                            Object.values(
                                                                processedRejectedCandidates.manual_rejections
                                                            ).reduce(
                                                                (
                                                                    sum: number,
                                                                    count: number
                                                                ) =>
                                                                    sum + count,
                                                                0
                                                            ) as number
                                                        }{' '}
                                                        manual)
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TooltipProvider>
        </>
    );
}
