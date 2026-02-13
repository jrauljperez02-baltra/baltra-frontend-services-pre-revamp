'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreHorizontal, Eye, Phone, Clock, Calendar } from 'lucide-react';
import { useCompanyID } from '@/context/CompanyContext';
import {
    deleteCandidate,
    getPhoneInterviewCandidates,
    type PhoneInterviewCandidate,
} from '@/lib/api';
import { CandidateDetailsModal } from '@/components/candidate-details-modal';
import { toast } from 'sonner';

interface PhoneCallsTableProps {
    bucket: string;
    searchTerm: string;
    dateRange: {
        startDate: string;
        endDate: string;
    };
}

const FUNNEL_BUCKET_QUERY: Record<string, string | undefined> = {
    invitados: 'invited',
    incompleto: 'incompleto',
    rechazado: 'rechazado',
    exitoso: 'exitoso',
    agendados_e2: 'agendados e2',
    todos: 'todos',
};

export function PhoneCallsTable({
    bucket,
    searchTerm,
    dateRange,
}: PhoneCallsTableProps) {
    const companyId = useCompanyID();
    const [candidates, setCandidates] = useState<PhoneInterviewCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCandidate, setSelectedCandidate] =
        useState<PhoneInterviewCandidate | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deletingCandidates, setDeletingCandidates] = useState<Set<number>>(
        new Set()
    );
    const [pagination, setPagination] = useState({
        current_page: 1,
        total_pages: 1,
        total_count: 0,
        has_next: false,
        has_prev: false,
    });

    useEffect(() => {
        async function fetchCandidates() {
            if (!companyId) return;

            try {
                setLoading(true);
                setError(null);
                const apiBucket =
                    FUNNEL_BUCKET_QUERY[bucket] ?? bucket ?? undefined;
                const data = await getPhoneInterviewCandidates(
                    companyId,
                    1,
                    50,
                    searchTerm || undefined,
                    undefined,
                    apiBucket,
                    undefined,
                    dateRange.startDate,
                    dateRange.endDate
                );
                setCandidates(data.candidates);
                setPagination(data.pagination);
            } catch (err) {
                console.error(
                    'Error fetching phone interview candidates:',
                    err
                );
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Error fetching candidates'
                );
            } finally {
                setLoading(false);
            }
        }

        fetchCandidates();
    }, [companyId, bucket, searchTerm, dateRange.startDate, dateRange.endDate]);

    const handleDeleteCandidate = async (
        candidateId: number,
        candidateName: string
    ) => {
        if (!companyId) return;
        setDeletingCandidates((prev) => new Set(prev).add(candidateId));
        try {
            const result = await deleteCandidate(companyId, candidateId);
            if ((result as any)?.success) {
                toast.success(`Candidato ${candidateName} borrado`);
                setCandidates((prev) =>
                    prev.filter((c) => c.id !== candidateId)
                );
                setPagination((prev) => ({
                    ...prev,
                    total_count: Math.max(0, prev.total_count - 1),
                }));
            } else {
                throw new Error(
                    (result as any)?.error || 'Error al eliminar candidato'
                );
            }
        } catch (err) {
            console.error('Error deleting candidate:', err);
            toast.error(
                `Error al eliminar candidato: ${err instanceof Error ? err.message : 'Error desconocido'}`
            );
        } finally {
            setDeletingCandidates((prev) => {
                const next = new Set(prev);
                next.delete(candidateId);
                return next;
            });
        }
    };

    const getRecommendationVariant = (recommendation: string) => {
        switch (recommendation) {
            case 'Recomendado':
            case 'Muy Recomendado':
                return 'default';
            case 'No Recomendado':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed':
            return 'text-baltra-600';
        case 'failed':
            return 'text-red-600';
        case 'scheduled':
            return 'text-baltra-600';
        case 'missed':
            return 'text-yellow-600';
        default:
            return 'text-gray-600';
    }
};

const FUNNEL_STATE_PRESETS = [
    {
        keys: ['phone_interview_cited', 'invitados a llamada'],
        label: 'Invitados a llamada',
        className: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
        keys: ['phone_interview', 'incompleto'],
        label: 'Incompleto',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
        keys: ['rejected', 'rechazado', 'post_phone_failed'],
        label: 'Rechazado',
        className: 'bg-red-50 text-red-700 border-red-200',
    },
    {
        keys: ['phone_interview_passed', 'exitoso'],
        label: 'Exitoso',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
        keys: ['scheduled_interview', 'agendados e2'],
        label: 'Agendados E2',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
];

const normalizeFunnel = (value: string) =>
    value.replace(/_/g, ' ').trim().toLowerCase();

const getFunnelStateInfo = (value?: string | null) => {
    if (!value) return null;
    const normalized = normalizeFunnel(value);
    for (const preset of FUNNEL_STATE_PRESETS) {
        if (preset.keys.some((key) => normalizeFunnel(key) === normalized)) {
            return { label: preset.label, className: preset.className };
        }
    }
    return {
        label: value,
        className: 'bg-slate-100 text-slate-700 border-slate-200',
    };
};

    if (loading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <div className="animate-pulse">
                                <div className="flex items-center space-x-4">
                                    <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                    </div>
                                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center">
                        <p className="text-destructive mb-2">
                            Error cargando candidatos
                        </p>
                        <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (candidates.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center">
                        <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            No hay entrevistas disponibles
                        </h3>
                        <p className="text-muted-foreground">
                            No se encontraron entrevistas telefónicas para los
                            criterios seleccionados.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {candidates.map((candidate) => {
                    const candidateKey = `${candidate.id}-${candidate.interview_id ?? candidate.vapi_call_id ?? 'call'}`;
                    const funnelInfo = getFunnelStateInfo(
                        candidate.funnel_state
                    );
                    return (
                        <Card
                            key={candidateKey}
                            className="transition-shadow hover:shadow-md"
                        >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <Avatar>
                                        <AvatarFallback>
                                            {candidate.name
                                                ?.charAt(0)
                                                ?.toUpperCase() || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold">
                                            {candidate.name || 'Sin nombre'}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {candidate.role}
                                        </p>
                                        <div className="flex items-center text-xs text-gray-500 mt-1">
                                            <Phone className="h-3 w-3 mr-1" />
                                            {candidate.phone}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-6">
                                    <div className="text-center">
                                        <div className="flex items-center text-sm text-gray-600 mb-1">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {candidate.call_date}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {candidate.duration_display}
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-lg font-bold text-baltra-600">
                                            {candidate.ai_score !== null
                                                ? `${candidate.ai_score}%`
                                                : 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Score IA
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <Badge
                                            variant={getRecommendationVariant(
                                                candidate.recommendation_display
                                            )}
                                            className="mb-1"
                                        >
                                            {candidate.recommendation_display}
                                        </Badge>
                                        <div
                                            className={`text-xs font-medium ${getStatusColor(candidate.call_status)}`}
                                        >
                                            {candidate.call_status_display}
                                        </div>
                                        {funnelInfo && (
                                            <Badge
                                                variant="outline"
                                                className={`mt-2 ${funnelInfo.className}`}
                                            >
                                                {funnelInfo.label}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedCandidate(candidate);
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Ver Detalles
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Acciones
                                                    </span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>
                                                    Acciones
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() =>
                                                        handleDeleteCandidate(
                                                            candidate.id,
                                                            candidate.name
                                                        )
                                                    }
                                                    disabled={deletingCandidates.has(
                                                        candidate.id
                                                    )}
                                                >
                                                    {deletingCandidates.has(
                                                        candidate.id
                                                    )
                                                        ? 'Eliminando...'
                                                        : 'Borrar Candidato'}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>

                            {/* Additional info row for smaller screens */}
                            <div className="md:hidden mt-3 pt-3 border-t border-gray-100">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm">
                                        <span className="text-gray-500">
                                            Fecha:{' '}
                                        </span>
                                        {candidate.call_date} -{' '}
                                        {candidate.duration_display}
                                    </div>
                                    <div className="text-sm font-semibold text-green-600">
                                        {candidate.ai_score !== null
                                            ? `${candidate.ai_score}%`
                                            : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    );
                })}
            </div>

            {/* Pagination Info */}
            {pagination.total_count > 0 && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                    Mostrando {candidates.length} de {pagination.total_count}{' '}
                    candidatos
                </div>
            )}

            {/* Candidate Details Modal */}
            <CandidateDetailsModal
                candidate={selectedCandidate}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedCandidate(null);
                }}
            />
        </>
    );
}
