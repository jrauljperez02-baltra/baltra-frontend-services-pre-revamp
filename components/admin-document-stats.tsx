'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { useCompanyID } from '@/context/CompanyContext';
import { fetchDocumentsTypes } from '@/lib/admin-api';
import type { UserAttributes } from '@/lib/user-attributes';

interface AdminDocumentStatsProps {
    selectedIds?: number[];
    selectedStore: string;
    dateRange: { startDate: string; endDate: string };
    attrs: UserAttributes;
}

type DocTypeRow = {
    type: string;
    total: number;
    verified: number;
    rejected: number;
    waiting: number;
};

type DocsSummary = {
    total_hired: number;
    verified: number;
    rejected: number;
    waiting: number;
    verification_rate: number;
    failure_rate: number;
};

function parseSelectedCompanyId(
    selected: string,
    fallbackCompanyId: number
): number {
    if (!selected || selected === 'all') return fallbackCompanyId;
    const m = selected.match(/(\d+)/);
    return m ? Number(m[1]) : fallbackCompanyId;
}

function normalizeTypeRows(payload: any): DocTypeRow[] {
    // Soporta: Array plano | {data: Array} | {data:{items:Array}}
    const arr =
        (Array.isArray(payload) && payload) ||
        (Array.isArray(payload?.data) && payload.data) ||
        (Array.isArray(payload?.data?.items) && payload.data.items) ||
        [];

    return (arr as any[]).map((it) => {
        const type = it.type ?? it.subtype ?? 'unknown';
        const total = Number(it.total ?? 0);
        const verified = Number(it.verified ?? 0);
        const rejected = Number(it.rejected ?? 0);
        const waiting = Number(
            it.waiting ?? Math.max(0, total - verified - rejected)
        );
        return { type, total, verified, rejected, waiting };
    });
}

function summarizeDocs(rows: DocTypeRow[]): DocsSummary {
    const acc = rows.reduce(
        (a, r) => {
            a.total += r.total;
            a.verified += r.verified;
            a.rejected += r.rejected;
            a.waiting += r.waiting;
            return a;
        },
        { total: 0, verified: 0, rejected: 0, waiting: 0 }
    );
    const total_hired = acc.total;
    const verification_rate = Number(
        ((acc.verified / (total_hired || 1)) * 100).toFixed(1)
    );
    const failure_rate = Number(
        ((acc.rejected / (total_hired || 1)) * 100).toFixed(1)
    );
    return {
        total_hired,
        verified: acc.verified,
        rejected: acc.rejected,
        waiting: acc.waiting,
        verification_rate,
        failure_rate,
    };
}

export function AdminDocumentStats({
    selectedStore,
    selectedIds,
    dateRange,
    attrs,
}: AdminDocumentStatsProps) {
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
            return { ...dateParams, company_ids: attrs?.companiesIds ?? [] };
        }
        return { ...dateParams, scope: 'idcompany' as const };
    }, [
        selectedIds,
        selectedStore,
        dateRange.startDate,
        dateRange.endDate,
        attrs?.companiesIds,
    ]);

    const {
        data: typesResp,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['admin-docs-types', companyId, apiParams],
        queryFn: async () => fetchDocumentsTypes(companyId, apiParams),
        enabled: !!attrs,
    });

    useEffect(() => {
        console.log('[DOCS] typesResp raw:', typesResp);
    }, [typesResp]);

    const typesRows = useMemo(() => {
        const rows = normalizeTypeRows(typesResp);
        console.log(
            '[DOCS] typesRows (normalizado):',
            rows,
            'length:',
            rows.length
        );
        return rows;
    }, [typesResp]);

    const summary = useMemo<DocsSummary | undefined>(() => {
        if (!typesRows.length) return undefined;
        return summarizeDocs(typesRows);
    }, [typesRows]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Estadísticas de Documentos</CardTitle>
                    <CardDescription>Cargando…</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (isError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Estadísticas de Documentos</CardTitle>
                    <CardDescription>Error al cargar</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Estadísticas de Documentos</CardTitle>
                <CardDescription>
                    Estado de verificación de documentos de empleados
                    contratados
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Resumen */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                        <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-yellow-600">
                            {summary?.waiting ?? '-'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Esperando Documento
                        </div>
                        {summary && (
                            <Badge variant="secondary" className="mt-1">
                                {(
                                    (summary.waiting /
                                        (summary.total_hired || 1)) *
                                    100
                                ).toFixed(1)}
                                % del total
                            </Badge>
                        )}
                    </div>

                    <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">
                            {summary?.verified ?? '-'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Verificados
                        </div>
                        {summary && (
                            <Badge variant="secondary" className="mt-1">
                                {summary.verification_rate}% del total
                            </Badge>
                        )}
                    </div>

                    <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <XCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">
                            {summary?.rejected ?? '-'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Rechazados
                        </div>
                        {summary && (
                            <Badge variant="secondary" className="mt-1">
                                {summary.failure_rate}% del total
                            </Badge>
                        )}
                    </div>

                    <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">
                            {summary?.total_hired ?? '-'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Total Contratados
                        </div>
                    </div>
                </div>

                {/* Desglose por tipo */}
                {typesRows.length > 0 ? (
                    <div>
                        <h4 className="font-medium mb-4">
                            Desglose por Tipo de Documento
                        </h4>
                        <div className="space-y-4">
                            {typesRows.map((doc, index) => (
                                <div
                                    key={doc.type ?? `doc-${index}`}
                                    className="p-4 rounded-lg border"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium">
                                            {doc.type}
                                        </h5>
                                        <Badge variant="outline">
                                            {(
                                                ((doc.verified || 0) /
                                                    (doc.total || 1)) *
                                                100
                                            ).toFixed(1)}
                                            % verificado
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-yellow-600" />
                                            <span>
                                                Esperando:{' '}
                                                <strong>{doc.waiting}</strong>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <span>
                                                Verificados:{' '}
                                                <strong>{doc.verified}</strong>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <XCircle className="h-4 w-4 text-blue-600" />
                                            <span>
                                                Rechazados:{' '}
                                                <strong>{doc.rejected}</strong>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        Sin datos para el desglose. Revisa los logs{' '}
                        <code>[DOCS]</code>.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
