'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';

import { useCompanyID } from '@/context/CompanyContext';
import { fetchScreeningQuestions } from '@/lib/admin-api';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface AdminScreeningQuestionsProps {
    selectedStore: string;
    dateRange: { startDate: string; endDate: string };
}

function parseSelectedCompanyId(
    selected: string,
    fallbackCompanyId: number
): number {
    if (!selected || selected === 'all') return fallbackCompanyId;
    const m = selected.match(/(\d+)/);
    return m ? Number(m[1]) : fallbackCompanyId;
}

export function AdminScreeningQuestions({
    selectedStore,
    dateRange,
}: AdminScreeningQuestionsProps) {
    const baseCompanyId = useCompanyID();

    const companyId = useMemo(
        () => parseSelectedCompanyId(selectedStore, baseCompanyId),
        [selectedStore, baseCompanyId]
    );

    const { data, isLoading, isError } = useQuery({
        queryKey: [
            'admin-screening-questions',
            companyId,
            dateRange.startDate,
            dateRange.endDate,
        ],
        queryFn: async () =>
            fetchScreeningQuestions(companyId, {
                start_date: dateRange.startDate,
                end_date: dateRange.endDate,
            }),
    });

    const questions = (data ?? []).sort(
        (a, b) => (a.step_index || a.id) - (b.step_index || b.id)
    );
    const totalInitialResponses = questions[0]?.total_responses || 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Preguntas de Screening</CardTitle>
                <CardDescription>
                    Flujo completo de preguntas del proceso de selección inicial
                </CardDescription>
            </CardHeader>

            <CardContent>
                {isLoading && <div>Cargando preguntas...</div>}
                {isError && (
                    <div className="text-red-600">
                        No se pudo cargar el flujo.
                    </div>
                )}

                <div className="space-y-6">
                    {/* Resumen */}
                    <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-lg font-bold">
                                    Candidatos Iniciaron Proceso
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Total de interacciones iniciales
                                </div>
                            </div>
                            <div className="text-2xl font-bold">
                                {Number(totalInitialResponses).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Preguntas */}
                    <div className="space-y-4">
                        {questions.map((q) => (
                            <div key={q.id} className="p-4 rounded-lg border">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                Pregunta {q.id}
                                            </Badge>
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {q.response_type}
                                            </Badge>
                                        </div>
                                        <h5 className="font-medium text-sm leading-relaxed">
                                            {q.short_title}
                                        </h5>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <div className="text-sm font-medium">
                                                {q.total_responses.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                respuestas
                                            </div>
                                        </div>

                                        {/* Dialog */}
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 bg-transparent"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Pregunta {q.id} - Texto
                                                        Completo
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Tipo de respuesta:{' '}
                                                        {q.response_type} ·{' '}
                                                        {q.total_responses.toLocaleString()}{' '}
                                                        respuestas totales
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="mt-4">
                                                    <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed whitespace-pre-line">
                                                        {q.full_question}
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>

                                {/* Tasa de finalización */}
                                <div className="mt-3 pt-3 border-t">
                                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                                        <span>
                                            Tasa de finalización en este paso
                                        </span>
                                        <span>
                                            {totalInitialResponses
                                                ? (
                                                      (q.total_responses /
                                                          totalInitialResponses) *
                                                      100
                                                  ).toFixed(1)
                                                : '0.0'}
                                            %
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
