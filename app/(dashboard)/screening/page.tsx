'use client';

import { CandidateDetailsDialog } from '@/components/candidate-details-dialog';
import { CandidateDocumentsDialog } from '@/components/candidate-documents-dialog';
import { CandidateTableSkeleton } from '@/components/candidate-table-skeleton';
import { DashboardTracker } from '@/components/dashboard-tracker';
import { EnhancedScreeningConfiguration } from '@/components/enhanced-screening-configuration';
import { PageHeader } from '@/components/page-header';
import { PendingInterviewsAlert } from '@/components/pending-interviews-alert';
import { StatCard } from '@/components/stat-card';
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
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompanyID } from '@/context/CompanyContext';
import {
    type Candidate,
    type CandidatesPaginationFilters,
    deleteCandidate,
    getCandidatesData,
} from '@/lib/api';
import {
    useCandidatesData,
    useCandidatesStatsData,
    useInfiniteCandidatesPagination,
    useInvalidateCandidatesQuery,
} from '@/querys/candidates';
import { useRolesData } from '@/querys/roles';
import {
    AlertCircle,
    CheckCircle2,
    FileText,
    MoreHorizontal,
    Search,
    Trash2,
    UserCheck,
    XCircle,
} from 'lucide-react';
import { type Ref, useEffect, useMemo, useState } from 'react';
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

import { CandidateProfilePopup } from '@/components/candidate-profile-popup';
import { CompanyAccess } from '@/components/company-access';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const ScoreMaps = {
    '0-59': 'No recomendado',
    '60-80': 'Recomendado',
    '81-100': 'Muy Recomendado',
} as const;

export default function ScreeningPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const [_selectedRole, setSelectedRole] = useState<string | undefined>(
        'default'
    );

    const selectedRole =
        _selectedRole === 'default' ? undefined : _selectedRole;

    const [_selectedScore, setSelectedScore] = useState<string | undefined>(
        'default'
    );

    const selectedScore =
        _selectedScore === 'default' ? undefined : _selectedScore;

    // State for optimistic updates
    const [deletingCandidates, setDeletingCandidates] = useState<Set<number>>(
        new Set()
    );

    // For now, using a hardcoded company ID. You can make this dynamic based on your app's routing
    const companyId = useCompanyID();
    const { data: candidatesStatsData } = useCandidatesStatsData(companyId);

    const { data: rolesData = [] } = useRolesData(companyId);
    const invalidateCandidatesQuery = useInvalidateCandidatesQuery(companyId);

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
                // Invalidate and refetch data to update the UI
                invalidateCandidatesQuery();
            } else {
                throw new Error(result.error || 'Error al eliminar candidato');
            }
        } catch (error) {
            console.error('Error deleting candidate:', error);
            toast.error(
                `Error al eliminar candidato: ${error instanceof Error ? error.message : 'Error desconocido'}`
            );
        } finally {
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
            <DashboardTracker pageName="Screening" />
            <div className="px-4 md:px-8 pt-6">
                <PendingInterviewsAlert />
            </div>
            <PageHeader
                title="Evaluación de Candidatos"
                description="Automatizar y estandarizar la preselección de candidatos y las preguntas frecuentes"
            />

            <div className="p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total evaluados"
                        value={candidatesStatsData?.total_evaluated || '-'}
                        // trend={{ value: "15%", label: "del mes pasado", positive: true }}
                        icon={<UserCheck className="h-4 w-4" />}
                    />
                    <StatCard
                        title="Citados a entrevista (histórico)"
                        value={candidatesStatsData?.interview_cited || '-'}
                        // trend={{ value: "8%", label: "del mes pasado", positive: true }}
                        icon={<CheckCircle2 className="h-4 w-4" />}
                    />
                    <StatCard
                        title="Total rechazados (histórico)"
                        value={candidatesStatsData?.rejected_total || '-'}
                        // trend={{ value: "3%", label: "del mes pasado", positive: false }}
                        icon={<XCircle className="h-4 w-4" />}
                    />
                    <StatCard
                        title="Tasa de conversión"
                        value={candidatesStatsData?.conversion_rate || '-'}
                        // trend={{ value: "2.3%", label: "del mes pasado", positive: true }}
                        icon={<AlertCircle className="h-4 w-4" />}
                    />
                </div>

                {/* Enhanced Screening Configuration */}
                <EnhancedScreeningConfiguration />

                <Tabs defaultValue="interview-scheduled">
                    <div className="flex items-center justify-between">
                        <TabsList>
                            <TabsTrigger value="interview-scheduled">
                                Entrevista Programada
                            </TabsTrigger>
                            <TabsTrigger value="rejected">
                                Rechazado
                            </TabsTrigger>
                            <TabsTrigger value="screening-in-progress">
                                Evaluación en Progreso
                            </TabsTrigger>
                            <TabsTrigger value="all">
                                Todos los Candidatos
                            </TabsTrigger>
                        </TabsList>
                        <div className="flex items-center gap-2">
                            <Select
                                value={_selectedRole}
                                onValueChange={setSelectedRole}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">
                                        Todos los Roles
                                    </SelectItem>
                                    {rolesData.map((role) => (
                                        <SelectItem
                                            key={role.id}
                                            value={role.name}
                                        >
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={_selectedScore}
                                onValueChange={setSelectedScore}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Score" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">
                                        Todas las Puntuaciones
                                    </SelectItem>
                                    {Object.keys(ScoreMaps).map((score) => (
                                        <SelectItem key={score} value={score}>
                                            {score} -{' '}
                                            {
                                                ScoreMaps[
                                                    score as keyof typeof ScoreMaps
                                                ]
                                            }
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {/* Preload all tabs' data by rendering them hidden */}
                    <div style={{ display: 'none' }}>
                        <CandidateTable
                            role={selectedRole}
                            score={selectedScore}
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                        />
                        <CandidateTable
                            funnel_state="scheduled_interview"
                            role={selectedRole}
                            score={selectedScore}
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                        />
                        <CandidateTable
                            funnel_state="rejected"
                            reject_phase="pre_screening"
                            role={selectedRole}
                            score={selectedScore}
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                        />
                        <CandidateTable
                            funnel_state="screening_in_progress"
                            role={selectedRole}
                            score={selectedScore}
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                        />
                    </div>

                    <TabsContent value="all" className="mt-4">
                        <CandidateTable
                            role={selectedRole}
                            score={selectedScore}
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                        />
                    </TabsContent>

                    <TabsContent value="interview-scheduled" className="mt-4">
                        <CandidateTable
                            funnel_state="scheduled_interview"
                            role={selectedRole}
                            score={selectedScore}
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                        />
                    </TabsContent>

                    <TabsContent value="rejected" className="mt-4">
                        <CandidateTable
                            funnel_state="rejected"
                            role={selectedRole}
                            score={selectedScore}
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                        />
                    </TabsContent>

                    <TabsContent value="screening-in-progress" className="mt-4">
                        <CandidateTable
                            funnel_state="screening_in_progress"
                            role={selectedRole}
                            score={selectedScore}
                            onDeleteCandidate={handleDeleteCandidate}
                            deletingCandidates={deletingCandidates}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
const CandidateTable = ({
    onDeleteCandidate,
    deletingCandidates,
    ...props
}: CandidatesPaginationFilters & {
    onDeleteCandidate: (
        candidateId: number,
        candidateName: string
    ) => Promise<void>;
    deletingCandidates: Set<number>;
}) => {
    const companyId = useCompanyID();
    const {
        data: candidates,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteCandidatesPagination(companyId, {
        ...props,
        per_page: 40,
    });

    const observer = useRef<IntersectionObserver | null>(null);
    const observedElements = useRef<Set<HTMLTableRowElement>>(new Set());

    const createObserverRef = useCallback(
        (node: HTMLTableRowElement | null, index: number, total: number) => {
            if (!node || isFetchingNextPage) return;

            // Only observe elements in the last 20% of loaded items
            const shouldObserve = index >= Math.floor(total * 0.8);

            if (shouldObserve && !observedElements.current.has(node)) {
                if (!observer.current) {
                    observer.current = new IntersectionObserver(
                        (entries) => {
                            for (const entry of entries) {
                                if (entry.isIntersecting && hasNextPage) {
                                    fetchNextPage();
                                }
                            }
                        },
                        {
                            rootMargin: '250px', // Start loading when element is 100px away from viewport
                            threshold: 0.1,
                        }
                    );
                }
                observer.current.observe(node);
                observedElements.current.add(node);
            }
        },
        [isFetchingNextPage, hasNextPage, fetchNextPage]
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

    // Mostrar skeleton mientras carga
    if (isLoading) {
        return <CandidateTableSkeleton />;
    }

    const flatCandidates = candidates?.flat() ?? [];

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Fecha de Evaluación</TableHead>
                            <TableHead>Recomendación</TableHead>
                            <TableHead>Puntuación</TableHead>
                            <TableHead>Estado del Proceso</TableHead>
                            <CompanyAccess
                                companyId={companyId}
                                allowedCompanies={[2, 10]}
                            >
                                <TableHead>Archivos</TableHead>
                            </CompanyAccess>
                            <TableHead>Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {flatCandidates.length > 0 ? (
                            flatCandidates
                                .filter(
                                    (candidate) =>
                                        !deletingCandidates.has(candidate.id)
                                )
                                .map((candidate, idx) => (
                                    <CandidateTableRow
                                        candidate={candidate}
                                        key={candidate.id}
                                        onDeleteCandidate={onDeleteCandidate}
                                        deletingCandidates={deletingCandidates}
                                        ref={(node) =>
                                            createObserverRef(
                                                node,
                                                idx,
                                                flatCandidates.length
                                            )
                                        }
                                    />
                                ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    No se encontraron candidatos
                                </TableCell>
                            </TableRow>
                        )}
                        {isFetchingNextPage && (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="text-center py-4"
                                >
                                    Cargando más candidatos...
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

const CandidateTableRow = ({
    candidate,
    onDeleteCandidate,
    deletingCandidates,
    ref,
}: {
    candidate: Candidate;
    onDeleteCandidate: (
        candidateId: number,
        candidateName: string
    ) => Promise<void>;
    deletingCandidates: Set<number>;
    ref?: React.Ref<HTMLTableRowElement>;
}) => {
    const scoreValue =
        candidate.score === 'N/A'
            ? 0
            : Number.parseInt(candidate.score.replace('%', ''));

    return (
        <CandidateProfilePopup candidate={candidate}>
            <TableRow
                key={candidate.id}
                className="hover:bg-muted/50"
                ref={ref}
            >
                <TableCell className="font-medium">{candidate.name}</TableCell>
                <TableCell>{candidate.role}</TableCell>
                <TableCell>{candidate.screening_date}</TableCell>
                <TableCell>
                    <Badge
                        className={`${
                            candidate.recommendation === 'Muy Recomendado' ||
                            candidate.recommendation === 'Recomendado'
                                ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                : candidate.recommendation === 'Rechazado'
                                  ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                                  : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
                        }`}
                    >
                        {candidate.recommendation}
                    </Badge>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <Progress value={scoreValue} className="h-2 w-16 bg-baltra-100" />
                        <span className="text-xs font-medium">
                            {candidate.score}
                        </span>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge
                        variant="outline"
                        className={`${
                            candidate.funnel_state === 'Entrevista Agendada'
                                ? 'bg-baltra-50 text-baltra-700 border-baltra-200'
                                : candidate.funnel_state === 'Rechazado'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                    >
                        {candidate.funnel_state === 'Expirado' 
                            ? (candidate.previous_funnel_state || candidate.funnel_state)
                            : candidate.funnel_state
                        }
                    </Badge>
                </TableCell>
                <CompanyAccess
                    companyId={useCompanyID()}
                    allowedCompanies={[2, 10]}
                >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                        <CandidateDocumentsDialog candidate={candidate}>
                            <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                            </Button>
                        </CandidateDocumentsDialog>
                    </TableCell>
                </CompanyAccess>
                <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Acciones</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <CandidateProfilePopup candidate={candidate}>
                                <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                            </CandidateProfilePopup>
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                    onDeleteCandidate(
                                        candidate.id,
                                        candidate.name
                                    )
                                }
                                disabled={deletingCandidates.has(candidate.id)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {deletingCandidates.has(candidate.id)
                                    ? 'Eliminando...'
                                    : 'Borrar Candidato'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
        </CandidateProfilePopup>
    );
};
