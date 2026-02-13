'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useCompanyID } from '@/context/CompanyContext';
import { useInfiniteCandidatesPagination } from '@/querys/candidates';
import { Loader2, Plus, Search } from 'lucide-react';
import { useCallback, useMemo } from 'react';

interface CandidatesTableProps {
    searchTerm?: string;
    status?: string;
    onSearchChange?: (search: string) => void;
    onStatusFilter?: (status: string) => void;
}

export function CandidatesTableHired({
    dateRange,
}: {
    dateRange?: { startDate?: string; endDate?: string };
} = {}) {
    const companyId = useCompanyID();

    // Fetch hired candidates
    const {
        data: hiredCandidatesData,
        fetchNextPage: fetchNextHiredPage,
        hasNextPage: hasNextHiredPage,
        isFetchingNextPage: isFetchingNextHiredPage,
        isLoading: isLoadingHired,
        error: errorHired,
    } = useInfiniteCandidatesPagination(companyId, {
        per_page: 10,
        funnel_state: 'hired',
        start_date: dateRange?.startDate,
        end_date: dateRange?.endDate,
    });

    // Fetch onboarding candidates
    const {
        data: onboardingCandidatesData,
        fetchNextPage: fetchNextOnboardingPage,
        hasNextPage: hasNextOnboardingPage,
        isFetchingNextPage: isFetchingNextOnboardingPage,
        isLoading: isLoadingOnboarding,
        error: errorOnboarding,
    } = useInfiniteCandidatesPagination(companyId, {
        per_page: 10,
        funnel_state: 'onboarding',
        start_date: dateRange?.startDate,
        end_date: dateRange?.endDate,
    });

    // Fetch expired candidates (who were previously hired/onboarding)
    const {
        data: expiredCandidatesData,
        fetchNextPage: fetchNextExpiredPage,
        hasNextPage: hasNextExpiredPage,
        isFetchingNextPage: isFetchingNextExpiredPage,
        isLoading: isLoadingExpired,
        error: errorExpired,
    } = useInfiniteCandidatesPagination(companyId, {
        per_page: 10,
        funnel_state: 'expired',
        only_hired_onboarding_expired: true,
        start_date: dateRange?.startDate,
        end_date: dateRange?.endDate,
    });

    // Merge hired, onboarding, and expired candidates
    const candidates = useMemo(() => {
        const hired = hiredCandidatesData || [];
        const onboarding = onboardingCandidatesData || [];
        const expired = expiredCandidatesData || [];
        
        // Combine all three and remove duplicates by candidate_id
        const allCandidates = [...hired, ...onboarding, ...expired];
        const uniqueCandidates = allCandidates.filter((candidate, index, self) =>
            index === self.findIndex((c) => c.id === candidate.id)
        );
        
        // Sort by created_at (most recent first)
        return uniqueCandidates.sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }, [hiredCandidatesData, onboardingCandidatesData, expiredCandidatesData]);

    // Combined states
    const isLoading = isLoadingHired || isLoadingOnboarding || isLoadingExpired;
    const error = errorHired || errorOnboarding || errorExpired;
    const hasNextPage = hasNextHiredPage || hasNextOnboardingPage || hasNextExpiredPage;
    const isFetchingNextPage = isFetchingNextHiredPage || isFetchingNextOnboardingPage || isFetchingNextExpiredPage;
    
    // Function to fetch next page for all three queries
    const fetchNextPage = useCallback(() => {
        if (hasNextHiredPage) fetchNextHiredPage();
        if (hasNextOnboardingPage) fetchNextOnboardingPage();
        if (hasNextExpiredPage) fetchNextExpiredPage();
    }, [hasNextHiredPage, hasNextOnboardingPage, hasNextExpiredPage, fetchNextHiredPage, fetchNextOnboardingPage, fetchNextExpiredPage]);

    const formatDate = useCallback((dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        } catch {
            return dateString;
        }
    }, []);

    if (isLoading) {
        return (
            <Card>
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">
                        Lista de Candidatos
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <div className="h-[400px] flex items-center justify-center">
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>Cargando candidatos...</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">
                        Lista de Candidatos
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <div className="h-[400px] flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <p>Error al cargar los candidatos</p>
                            <p className="text-sm mt-2">
                                Por favor, intenta recargar la página
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-lg sm:text-xl">
                        Lista de Candidatos contratados
                    </CardTitle>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[150px]">
                                    Nombre
                                </TableHead>
                                <TableHead className="min-w-[120px]">
                                    Rol
                                </TableHead>
                                <TableHead className="min-w-[100px]">
                                    Teléfono
                                </TableHead>
                                <TableHead className="min-w-[140px]">
                                    Estado
                                </TableHead>
                                <TableHead className="min-w-[120px]">
                                    Fecha de Registro
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {candidates.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        No se encontraron candidatos
                                    </TableCell>
                                </TableRow>
                            ) : (
                                candidates.map((candidate) => (
                                    <TableRow
                                        key={candidate.id}
                                        className="hover:bg-muted/50 cursor-pointer"
                                    >
                                        <TableCell className="font-medium">
                                            {candidate.name}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {candidate.role}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {candidate.phone || 'No disponible'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="default"
                                                className={
                                                    'text-xs whitespace-nowrap bg-baltra-50 text-baltra-600 border-baltra-100 hover:bg-baltra-100 hover:text-baltra-700'
                                                }
                                            >
                                                {candidate.funnel_state === 'Expirado' 
                                                    ? (candidate.previous_funnel_state || candidate.funnel_state)
                                                    : candidate.funnel_state
                                                }
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {formatDate(candidate.created_at)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Load More Button */}
                {hasNextPage && (
                    <div className="p-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="w-full"
                        >
                            {isFetchingNextPage ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Cargando más candidatos...
                                </>
                            ) : (
                                'Cargar más candidatos'
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
