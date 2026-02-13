'use client';

import { CandidateDocumentsDialog } from '@/components/candidate-documents-dialog';
import { CandidateProfilePopup } from '@/components/candidate-profile-popup';
import { CandidateTableSkeleton } from '@/components/candidate-table-skeleton';
import { CompletedInterviewsPopup } from '@/components/completed-interviews-popup';
import { DashboardTracker } from '@/components/dashboard-tracker';
import { HiredCandidateStartDateDialog } from '@/components/hired-candidate-start-date-dialog';
import { InterviewCommentsDialog } from '@/components/interview-comments-dialog';
import { InterviewRecordingDialog } from '@/components/interview-recording-dialog';
import { InterviewScheduleExpanded } from '@/components/interview-schedule-expanded';
import { InterviewSummaryDialog } from '@/components/interview-summary-dialog';
import { PageHeader } from '@/components/page-header';
import { PendingInterviewsAlert } from '@/components/pending-interviews-alert';
import { RecommendationDialog } from '@/components/recommendation-dialog';
import { RejectionReasonDialog } from '@/components/rejection-reason-dialog';
import { StatCard } from '@/components/stat-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCompanyID } from '@/context/CompanyContext';
import { useDebounce } from '@/hooks/use-debounce';
import type {
    Candidate,
    CandidatesPaginationFilters,
    RejectReason,
} from '@/lib/api';
import {
    deleteCandidate,
    cancelInterview,
    downloadInterviewCandidatesCSV,
} from '@/lib/api';
import { getRejectionReasonLabel as getCentralizedRejectionReasonLabel } from '@/lib/rejection-reasons';
import {
    useCandidatesData,
    useCandidatesStatsData,
    useChangeFunnelStateMutation,
    useInfiniteCandidatesPagination,
    useInvalidateCandidatesQuery,
} from '@/querys/candidates';
import {
    Calendar,
    CheckCircle2,
    FileIcon,
    FileText,
    MessageSquare,
    Mic,
    MoreHorizontal,
    Search,
    Trash2,
} from 'lucide-react';
import { FileDown } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { format, parseISO } from 'date-fns';
import { formatDateCandidateRow } from '@/lib/time';

// Helper function to get human-readable rejection reason labels
// Maintaining backward compatibility while using centralized maps
const getRejectionReasonLabel = (reason?: string, companyId?: number) => {
    if (!reason) return 'No especificado';

    // Use centralized function if companyId is available
    if (companyId !== undefined) {
        const centralizedLabel = getCentralizedRejectionReasonLabel(
            reason,
            companyId
        );
        // Return centralized label if it's different from the input (meaning it was found)
        if (centralizedLabel !== reason) {
            return centralizedLabel;
        }
    }

    // Fallback to local mapping for backward compatibility
    const LEGACY_REJECTION_REASONS_MAP = {
        screening: 'Screening',
        physical_condition: 'Condición física',
        personal_presentation: 'Presentación personal',
        missing_documents: 'Falta documentos',
        antidoping_evidence: 'Exámen veracity',
        experience: 'Experiencia',
        abscense: 'Falta a entrevista',
        abscense_first_day: 'Falta primer dia',
        declined_technical_area: 'Declinado por área técnica',
        distance_home_work: 'Distancia de casa-trabajo',
        declined_salary: 'Declina por salario',
        other: 'Otras',
    } as const;

    return (
        LEGACY_REJECTION_REASONS_MAP[
            reason as keyof typeof LEGACY_REJECTION_REASONS_MAP
        ] || reason
    );
};

export default function InterviewPage() {
    const companyId = useCompanyID();
    const { data: candidatesStatsData } = useCandidatesStatsData(companyId);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Export CSV dialog state
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [exportStart, setExportStart] = useState<string>('');
    const [exportEnd, setExportEnd] = useState<string>('');

    const handleDownloadCSV = async () => {
        try {
            await downloadInterviewCandidatesCSV(
                companyId,
                exportStart || undefined,
                exportEnd || undefined,
                'entrevistas.csv'
            );
            toast.success('CSV descargado');
            setIsExportOpen(false);
        } catch (error) {
            toast.error('Error al descargar CSV');
        }
    };

    // State for popup
    const [isCompletedPopupOpen, setIsCompletedPopupOpen] = useState(false);
    const [completedPopupManual, setCompletedPopupManual] = useState(false);

    // State for optimistic updates
    const [deletingCandidates, setDeletingCandidates] = useState<Set<number>>(
        new Set()
    );

    // Get completed interviews data
    const {
        data: completedInterviewsData,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useInfiniteCandidatesPagination(companyId, {
        funnel_state: 'scheduled_interview',
        interview_date: 'completed',
        per_page: 10,
    });

    const invalidateCandidatesQuery = useInvalidateCandidatesQuery(companyId);

    const { mutateAsync: changeFunnelState } =
        useChangeFunnelStateMutation(companyId);

    // Check for completed interviews on mount and data changes
    useEffect(() => {
        if (completedInterviewsData && completedInterviewsData.length > 0) {
            // Solo abrir el popup si no se ha cerrado manualmente
            if (!completedPopupManual && !isCompletedPopupOpen) {
                setIsCompletedPopupOpen(true);
            }
        }
    }, [completedInterviewsData, completedPopupManual, isCompletedPopupOpen]);

    const handleAcceptCandidate = async (candidateId: number, startDate: string) => {
        try {
            await changeFunnelState({ newState: 'hired', candidateId, startDate });
            toast.success('Fecha de inicio guardada y candidato contratado');

            invalidateCandidatesQuery();

            // Verificar si quedan candidatos después de la invalidación
            setTimeout(() => {
                if (
                    !completedInterviewsData ||
                    completedInterviewsData.length === 0
                ) {
                    setIsCompletedPopupOpen(false);
                    setCompletedPopupManual(false); // Reset del estado manual
                }
            }, 100);
        } catch (error) {
            toast.error('Error al aceptar candidato');
        }
    };

    const handleRejectCandidate = async (
        candidateId: number,
        reason?: RejectReason
    ) => {
        try {
            await changeFunnelState({
                newState: 'rejected',
                candidateId,
                reason,
            });
            toast.success('Candidato rechazado');

            invalidateCandidatesQuery();

            // Verificar si quedan candidatos después de la invalidación
            setTimeout(() => {
                if (
                    !completedInterviewsData ||
                    completedInterviewsData.length === 0
                ) {
                    setIsCompletedPopupOpen(false);
                    setCompletedPopupManual(false); // Reset del estado manual
                }
            }, 100);
        } catch (error) {
            toast.error('Error al rechazar candidato');
        }
    };

    const handleRescheduleCandidate = async (candidateId: number) => {
        try {
            await changeFunnelState({
                newState: 'missed_interview',
                candidateId,
            });
            toast.success('Entrevista reagendada');

            invalidateCandidatesQuery();

            // Verificar si quedan candidatos después de la invalidación
            setTimeout(() => {
                if (
                    !completedInterviewsData ||
                    completedInterviewsData.length === 0
                ) {
                    setIsCompletedPopupOpen(false);
                    setCompletedPopupManual(false); // Reset del estado manual
                }
            }, 100);
        } catch (error) {
            toast.error('Error al reagendar entrevista');
        }
    };

    const handleCancelInterview = async (candidateId: number) => {
        try {
            const result = await cancelInterview(companyId, candidateId);
            if (result.success) {
                toast.success('Entrevista cancelada');
                invalidateCandidatesQuery();
            } else {
                toast.error('Error al cancelar entrevista');
            }
        } catch (error) {
            toast.error('Error al cancelar entrevista');
        }
    };

    const handleLoadMoreCompleted = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const handleClosePopup = () => {
        setIsCompletedPopupOpen(false);
        setCompletedPopupManual(true); // Marcar que se cerró manualmente
    };

    const handleReopenPopup = () => {
        setIsCompletedPopupOpen(true);
        setCompletedPopupManual(false); // Reset del estado manual
    };

    const handleDeleteCandidate = async (
        candidateId: number,
        candidateName: string
    ) => {
        // Add to deleting set for optimistic UI
        setDeletingCandidates((prev) => new Set(prev).add(candidateId));

        try {
            const result = await deleteCandidate(companyId, candidateId);

            if (result.success) {
                toast.success(`Candidato ${candidateName} borrado`);
            } else {
                throw new Error(result.error || 'Error al eliminar candidato');
            }
        } catch (error) {
            console.error('Error deleting candidate:', error);
            toast.error(
                `Error al eliminar candidato: ${error instanceof Error ? error.message : 'Error desconocido'}`
            );
        } finally {
            invalidateCandidatesQuery();
            // Remove from deleting set
            setDeletingCandidates((prev) => {
                const newSet = new Set(prev);
                newSet.delete(candidateId);
                return newSet;
            });
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardTracker pageName="Interview" />
            <CompletedInterviewsPopup
                isOpen={isCompletedPopupOpen}
                onClose={handleClosePopup}
                completedCandidates={completedInterviewsData ?? []}
                onAccept={handleAcceptCandidate}
                onReject={handleRejectCandidate}
                onReschedule={handleRescheduleCandidate}
                onLoadMore={handleLoadMoreCompleted}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                totalCandidates={completedInterviewsData?.length ?? 0}
            />

            <div className="px-4 md:px-8 pt-6">
                <PendingInterviewsAlert />
            </div>
            <PageHeader
                title="Citado Entrevista"
                description="Simplifica la programación, evaluación y seguimiento de entrevistas con candidatos"
                action={{
                    label: `Ver Entrevistas Completadas (${(completedInterviewsData ?? []).length})`,
                    onClick() {
                        handleReopenPopup();
                    },
                }}
            />

            <div className="p-6 space-y-6">
                {/* Status Legend */}
                <Card className="bg-muted/30 border-dashed">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">
                                Indicadores:
                            </span>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                <span>Reingreso (Ha trabajado aquí antes)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                                <span>
                                    Reagendado (Se envio mensaje para reagendar)
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <StatCard
                        title="Entrevistas Totales"
                        value={`${candidatesStatsData?.interview_cited}`}
                        // trend={{ value: "8", label: "esta semana", positive: true }}
                        icon={<Calendar className="h-4 w-4" />}
                    />
                    <StatCard
                        title="Entrevistas Completadas"
                        value={`${candidatesStatsData?.completed_interviews}`}
                        // trend={{ value: "8", label: "esta semana", positive: true }}
                        icon={<Calendar className="h-4 w-4" />}
                    />
                    <StatCard
                        title="Entrevistas Sin Asistencia"
                        value={`${candidatesStatsData?.missed_interviews || 0}`}
                        // trend={{ value: "3", label: "esta semana", positive: false }}
                        icon={<MessageSquare className="h-4 w-4" />}
                    />
                    <StatCard
                        title="Entrevistas Futuras"
                        value={`${candidatesStatsData?.upcoming_interviews}`}
                        // trend={{ value: "12%", label: "del mes pasado", positive: true }}
                        icon={<CheckCircle2 className="h-4 w-4" />}
                    />
                    <StatCard
                        title="Tasa de Contratación"
                        value={`${candidatesStatsData?.hiring_rate || '0%'}`}
                        // trend={{ value: "5%", label: "del mes pasado", positive: true }}
                        icon={<FileText className="h-4 w-4" />}
                    />
                </div>

                {/* Interview Schedule - Full Width */}
                <InterviewScheduleExpanded />

                <Tabs defaultValue="upcoming">
                    <div className="flex items-center justify-between">
                        <TabsList>
                            <TabsTrigger value="upcoming">Próximas</TabsTrigger>
                            <TabsTrigger value="completed">
                                Acción Faltante
                            </TabsTrigger>
                            <TabsTrigger value="missed">
                                No presentados
                            </TabsTrigger>
                            <TabsTrigger value="cancelled">
                                Cancelados
                            </TabsTrigger>
                            <TabsTrigger value="rejected">
                                Rechazados
                            </TabsTrigger>
                            <TabsTrigger value="abscense_first_day">
                                Falto Dia 1
                            </TabsTrigger>
                            <TabsTrigger value="hired">Ingresados</TabsTrigger>
                        </TabsList>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Buscar por nombre, teléfono o rol..."
                                    className="w-[200px] pl-8 md:w-[300px]"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />
                            </div>
                            <Button variant="outline" size="sm">
                                Filtrar
                            </Button>
                            <Dialog
                                open={isExportOpen}
                                onOpenChange={setIsExportOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button size="sm" className="gap-2 bg-baltra-600 hover:bg-baltra-700">
                                        <FileDown className="h-4 w-4" />
                                        Descargar
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Descargar entrevistas
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm">
                                                    Fecha inicio
                                                </label>
                                                <input
                                                    type="date"
                                                    className="border rounded-md px-3 py-2"
                                                    value={exportStart}
                                                    onChange={(e) =>
                                                        setExportStart(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm">
                                                    Fecha fin
                                                </label>
                                                <input
                                                    type="date"
                                                    className="border rounded-md px-3 py-2"
                                                    value={exportEnd}
                                                    onChange={(e) =>
                                                        setExportEnd(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button 
                                            className='bg-baltra-600 hover:bg-baltra-700'
                                        onClick={handleDownloadCSV}>
                                            Descargar CSV
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <div style={{ display: 'none' }}>
                        <TableCandidatesInterview
                            funnel_state="scheduled_interview"
                            interview_date="upcoming"
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                        />
                        <TableCandidatesInterview
                            funnel_state="scheduled_interview"
                            interview_date="completed"
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                        />

                        <TableCandidatesInterview
                            funnel_state="missed_interview"
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                        />
                        <TableCandidatesInterview
                            reject_phase="post_screening"
                            funnel_state="rejected"
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                        />
                        <TableCandidatesInterview
                            reject_phase="post_screening"
                            funnel_state="rejected"
                            rejected_reason="abscense_first_day"
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                        />
                        <TableCandidatesInterview
                            funnel_state="hired"
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                        />
                    </div>

                    <TabsContent value="upcoming" className="mt-4">
                        <TableCandidatesInterview
                            funnel_state="scheduled_interview"
                            interview_date="upcoming"
                            onDeleteCandidate={handleDeleteCandidate}
                            onCancelInterview={handleCancelInterview}
                            deletingCandidates={deletingCandidates}
                            searchTerm={debouncedSearchTerm}
                        />
                    </TabsContent>

                    <TabsContent value="completed" className="mt-4">
                        <TableCandidatesInterview
                            funnel_state="scheduled_interview"
                            interview_date="completed"
                            onDeleteCandidate={handleDeleteCandidate}
                            onCancelInterview={handleCancelInterview}
                            deletingCandidates={deletingCandidates}
                            searchTerm={debouncedSearchTerm}
                        />
                    </TabsContent>

                    <TabsContent value="missed" className="mt-4">
                        <TableCandidatesInterview
                            funnel_state="missed_interview"
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                            searchTerm={debouncedSearchTerm}
                        />
                    </TabsContent>

                    <TabsContent value="cancelled" className="mt-4">
                        <TableCandidatesInterview
                            funnel_state="cancelled"
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                            searchTerm={debouncedSearchTerm}
                        />
                    </TabsContent>

                    <TabsContent value="rejected" className="mt-4">
                        <TableCandidatesInterview
                            reject_phase="post_screening"
                            funnel_state="rejected"
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                            searchTerm={debouncedSearchTerm}
                        />
                    </TabsContent>

                    <TabsContent value="abscense_first_day" className="mt-4">
                        <TableCandidatesInterview
                            reject_phase="post_screening"
                            funnel_state="rejected"
                            rejected_reason="abscense_first_day"
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                            searchTerm={debouncedSearchTerm}
                        />
                    </TabsContent>

                    <TabsContent value="hired" className="mt-4">
                        <TableCandidatesInterview
                            funnel_state="hired"
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                            searchTerm={debouncedSearchTerm}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

const TableCandidatesInterview = ({
    onDeleteCandidate,
    onCancelInterview,
    deletingCandidates,
    searchTerm = '',
    ...props
}: CandidatesPaginationFilters & {
    onDeleteCandidate: (
        candidateId: number,
        candidateName: string
    ) => Promise<void>;
    onCancelInterview?: (candidateId: number) => Promise<void>;
    deletingCandidates: Set<number>;
    searchTerm?: string;
}) => {
    const companyId = useCompanyID();
    
    // Check if we need to fetch both hired and onboarding candidates
    const isHiredTab = props.funnel_state === 'hired';
    
    // Fetch primary candidates (or hired if it's the hired tab)
    const {
        data: primaryCandidates,
        hasNextPage: hasNextPrimaryPage,
        fetchNextPage: fetchNextPrimaryPage,
        isFetchingNextPage: isFetchingNextPrimaryPage,
        isLoading: isLoadingPrimary,
    } = useInfiniteCandidatesPagination(companyId, {
        ...props,
        per_page: 40,
        search: searchTerm,
    });

    // Fetch onboarding candidates only for the hired tab
    const {
        data: onboardingCandidates,
        hasNextPage: hasNextOnboardingPage,
        fetchNextPage: fetchNextOnboardingPage,
        isFetchingNextPage: isFetchingNextOnboardingPage,
        isLoading: isLoadingOnboarding,
    } = useInfiniteCandidatesPagination(companyId, {
        ...props,
        funnel_state: 'onboarding',
        per_page: 40,
        search: searchTerm,
    }, {
        enabled: isHiredTab, // Only fetch onboarding candidates for hired tab
    });

    // Fetch expired candidates (who were previously hired/onboarding) only for the hired tab
    const {
        data: expiredCandidates,
        hasNextPage: hasNextExpiredPage,
        fetchNextPage: fetchNextExpiredPage,
        isFetchingNextPage: isFetchingNextExpiredPage,
        isLoading: isLoadingExpired,
    } = useInfiniteCandidatesPagination(companyId, {
        ...props,
        funnel_state: 'expired',
        per_page: 40,
        search: searchTerm,
        only_hired_onboarding_expired: true,
    }, {
        enabled: isHiredTab, // Only fetch expired candidates for hired tab
    });

    // Merge candidates if we're on the hired tab, otherwise use primary
    const candidates = isHiredTab && (onboardingCandidates || expiredCandidates)
        ? [...(primaryCandidates || []), ...(onboardingCandidates || []), ...(expiredCandidates || [])].sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
        : primaryCandidates;

    // Combine loading and pagination states
    const isLoading = isHiredTab ? (isLoadingPrimary || isLoadingOnboarding || isLoadingExpired) : isLoadingPrimary;
    const hasNextPage = isHiredTab ? (hasNextPrimaryPage || hasNextOnboardingPage || hasNextExpiredPage) : hasNextPrimaryPage;
    const isFetchingNextPage = isHiredTab ? (isFetchingNextPrimaryPage || isFetchingNextOnboardingPage || isFetchingNextExpiredPage) : isFetchingNextPrimaryPage;
    
    const fetchNextPage = useCallback(() => {
        if (isHiredTab) {
            if (hasNextPrimaryPage) fetchNextPrimaryPage();
            if (hasNextOnboardingPage) fetchNextOnboardingPage();
            if (hasNextExpiredPage) fetchNextExpiredPage();
        } else {
            if (hasNextPrimaryPage) fetchNextPrimaryPage();
        }
    }, [isHiredTab, hasNextPrimaryPage, hasNextOnboardingPage, hasNextExpiredPage, fetchNextPrimaryPage, fetchNextOnboardingPage, fetchNextExpiredPage]);

    const observer = useRef<IntersectionObserver | null>(null);
    const observedElements = useRef<Set<HTMLTableRowElement>>(new Set());
    const previousSearchTerm = useRef(searchTerm);
    const [isStartDateDialogOpen, setStartDateDialogOpen] = useState(false);
    const [candidateToHire, setCandidateToHire] = useState<{ id: number; name: string } | null>(null);

    const { mutateAsync: changeFunnelState, error: changeFunnelStateError } =
        useChangeFunnelStateMutation(companyId);

    const invalidateCandidatesQuery = useInvalidateCandidatesQuery(companyId);

    const handleHire = (id: number, name: string) => {
        setCandidateToHire({ id, name });
        setStartDateDialogOpen(true);
    };

    const handleSaveStartDate = async (startDate: string) => {
        if (!candidateToHire) return;
        
        await toast.promise(
            changeFunnelState({ 
                newState: 'hired', 
                candidateId: candidateToHire.id,
                startDate 
            }),
            {
                loading: 'Guardando fecha de inicio y contratando...',
                success: 'Fecha de inicio guardada y candidato contratado',
                error: 'Error al guardar la fecha de inicio y contratar',
            }
        );
        setStartDateDialogOpen(false);
        setCandidateToHire(null);
        invalidateCandidatesQuery();
    };

    const handleReject = (id: number, reason?: RejectReason) => {
        toast.promise(
            changeFunnelState({
                newState: 'rejected',
                candidateId: id,
                reason,
            }),
            {
                loading: 'Cargando...',
                success: 'Cambiando estado a rechazado',
                error: 'Error al cambiar estado',
                finally() {
                    invalidateCandidatesQuery();
                },
            }
        );
    };

    const createObserverRef = useCallback(
        (node: HTMLTableRowElement | null, index: number, total: number) => {
            if (!node || isFetchingNextPage) return;

            // Si hay búsqueda activa, ser menos agresivo con el scroll infinito
            const isSearching = searchTerm && searchTerm.trim().length > 0;
            const threshold = isSearching ? 0.9 : 0.8; // 90% para búsqueda, 80% normal
            const rootMargin = isSearching ? '50px' : '250px'; // Menos margen durante búsqueda

            // Reset observer if search term changed
            if (previousSearchTerm.current !== searchTerm) {
                if (observer.current) {
                    observer.current.disconnect();
                    observer.current = null;
                }
                observedElements.current.clear();
                previousSearchTerm.current = searchTerm;
            }

            // Only observe elements in the last portion of loaded items
            const shouldObserve = index >= Math.floor(total * threshold);

            if (shouldObserve && !observedElements.current.has(node)) {
                if (!observer.current) {
                    observer.current = new IntersectionObserver(
                        (entries) => {
                            for (const entry of entries) {
                                if (
                                    entry.isIntersecting &&
                                    hasNextPage &&
                                    !isSearching
                                ) {
                                    fetchNextPage();
                                }
                            }
                        },
                        {
                            rootMargin: rootMargin,
                            threshold: 0.1,
                        }
                    );
                }
                observer.current.observe(node);
                observedElements.current.add(node);
            }
        },
        [isFetchingNextPage, hasNextPage, fetchNextPage, searchTerm]
    );

    // Clean up observer when component unmounts or data changes
    useEffect(() => {
        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
            observedElements.current.clear();
        };
    }, []);

    const handleMissInterview = (interview: Candidate, e: React.MouseEvent) => {
        e.stopPropagation();
        toast.promise(
            changeFunnelState({
                newState: 'missed_interview',
                candidateId: interview.id,
            }),
            {
                loading: 'Cargando...',
                success: 'Cambiando estado a no entrevistado',
                error: 'Error al cambiar estado',
            }
        );
    };

    // Mostrar skeleton mientras carga
    if (isLoading) {
        return <CandidateTableSkeleton />;
    }

    const flatCandidates = candidates?.flat() ?? [];

    // Filtrar candidatos para mantener tabs mutuamente exclusivos
    const filteredCandidates = flatCandidates.filter((candidate) => {
        // Si es un candidato rechazado y la razón es "screening", no lo mostramos
        if (
            candidate.funnel_state === 'rejected' &&
            candidate.rejected_reason === 'screening'
        ) {
            return false;
        }

        // Si estamos en la tab "rejected" y hay un rejected_reason específico en props,
        // solo mostrar candidatos con ese rejected_reason
        if (props.funnel_state === 'rejected' && props.rejected_reason) {
            return candidate.rejected_reason === props.rejected_reason;
        }

        // Si estamos en la tab "rejected" sin rejected_reason específico,
        // excluir candidatos con "abscense_first_day" (van a su propia tab)
        if (props.funnel_state === 'rejected' && !props.rejected_reason) {
            return candidate.rejected_reason !== 'abscense_first_day';
        }

        return true;
    });

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Candidato</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Fecha de Entrevista</TableHead>
                            <TableHead>
                                {props.funnel_state === 'rejected'
                                    ? 'Razón de Rechazo'
                                    : 'Recomendación'}
                            </TableHead>
                            {/* <TableHead>Resumen de Entrevista</TableHead> */}
                            {/* <TableHead>Comments</TableHead> */}
                            {/* <TableHead>Recommendation</TableHead> */}
                            <TableHead>Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCandidates.length > 0 ? (
                            filteredCandidates.map((interview, idx) => (
                                <CandidateProfilePopup
                                    key={interview.id}
                                    candidate={interview}
                                >
                                    <TableRow
                                        key={interview.id}
                                        className="cursor-pointer"
                                        ref={(node) =>
                                            createObserverRef(
                                                node,
                                                idx,
                                                filteredCandidates.length
                                            )
                                        }
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>
                                                        {interview.name.charAt(
                                                            0
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <div className="font-medium">
                                                            {interview.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {interview.phone}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {interview.worked_here && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger
                                                                        asChild
                                                                    >
                                                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>
                                                                            Reingreso
                                                                            - Ha
                                                                            trabajado
                                                                            aquí
                                                                            antes
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                        {interview.rescheduled && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger
                                                                        asChild
                                                                    >
                                                                        <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>
                                                                            Reagendado
                                                                            -
                                                                            Esta
                                                                            persona
                                                                            reagendó
                                                                            su
                                                                            entrevista
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{interview.role}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {formatDateCandidateRow(
                                                    interview.interview_date ??
                                                        ''
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={`${
                                                    interview.recommendation ===
                                                        'Muy Recomendado' ||
                                                    interview.recommendation ===
                                                        'Recomendado'
                                                        ? 'bg-baltra-100 text-baltra-800 border-baltra-200 hover:bg-baltra-200'
                                                        : interview.recommendation ===
                                                            'Rechazado'
                                                          ? 'bg-red-100 text-red-800 border-red-200'
                                                          : 'bg-gray-100 text-gray-800 border-gray-200'
                                                }`}
                                            >
                                                {props.funnel_state ===
                                                'rejected'
                                                    ? getRejectionReasonLabel(
                                                          interview.rejected_reason,
                                                          companyId
                                                      )
                                                    : interview.recommendation}
                                            </Badge>
                                        </TableCell>
                                        <TableCell
                                            onClick={(e) => e.stopPropagation()}
                                        >
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
                                                    <CandidateProfilePopup
                                                        candidate={interview}
                                                    >
                                                        <DropdownMenuItem
                                                            className="hover:bg-baltra-100"
                                                        >
                                                            Ver Perfil
                                                        </DropdownMenuItem>
                                                    </CandidateProfilePopup>

                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleHire(
                                                                interview.id,
                                                                interview.name
                                                            )
                                                        }
                                                    >
                                                        Contratar Candidato
                                                    </DropdownMenuItem>
                                                    <RejectionReasonDialog
                                                        onReject={(reason) =>
                                                            handleReject(
                                                                interview.id,
                                                                reason
                                                            )
                                                        }
                                                    >
                                                        <DropdownMenuItem
                                                            onSelect={(e) =>
                                                                e.preventDefault()
                                                            }
                                                        >
                                                            Rechazar Candidato
                                                        </DropdownMenuItem>
                                                    </RejectionReasonDialog>

                                                    {interview.rescheduled ? (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <DropdownMenuItem
                                                                        disabled
                                                                        className="opacity-50 cursor-not-allowed"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                                                                            <span>
                                                                                Ya
                                                                                reagendado
                                                                            </span>
                                                                        </div>
                                                                    </DropdownMenuItem>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="left">
                                                                    <p>
                                                                        Este
                                                                        candidato
                                                                        ya
                                                                        reagendó
                                                                        su
                                                                        entrevista.
                                                                        No se
                                                                        pueden
                                                                        enviar
                                                                        más
                                                                        mensajes
                                                                        de
                                                                        reagendamiento.
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            onClick={(e) =>
                                                                handleMissInterview(
                                                                    interview,
                                                                    e
                                                                )
                                                            }
                                                        >
                                                            Reagendar
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    {/* Only show cancel option for scheduled interviews */}
                                                    {props.funnel_state ===
                                                        'scheduled_interview' &&
                                                        onCancelInterview && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    onCancelInterview(
                                                                        interview.id
                                                                    )
                                                                }
                                                            >
                                                                Cancelar Entrevista
                                                            </DropdownMenuItem>
                                                        )}
                                                    {/* <DropdownMenuItem>
														Reprogramar Entrevista
													</DropdownMenuItem> */}
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            onDeleteCandidate(
                                                                interview.id,
                                                                interview.name
                                                            )
                                                        }
                                                        disabled={deletingCandidates.has(
                                                            interview.id
                                                        )}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        {deletingCandidates.has(
                                                            interview.id
                                                        )
                                                            ? 'Eliminando...'
                                                            : 'Borrar Candidato'}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                </CandidateProfilePopup>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    No se encontraron entrevistas
                                </TableCell>
                            </TableRow>
                        )}
                        {isFetchingNextPage && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-4"
                                >
                                    Cargando más entrevistas...
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            <HiredCandidateStartDateDialog
                isOpen={isStartDateDialogOpen}
                onClose={() => {
                    setStartDateDialogOpen(false);
                    setCandidateToHire(null);
                }}
                onSave={handleSaveStartDate}
                candidateName={candidateToHire?.name ?? ''}
            />
        </Card>
    );
};