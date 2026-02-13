'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { RejectionReasonDialog } from '@/components/rejection-reason-dialog';
import { HiredCandidateStartDateDialog } from '@/components/hired-candidate-start-date-dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Candidate, RejectReason } from '@/lib/api';
import { useCompany } from '@/context/CompanyContext';
import { Calendar, CheckCircle2, Loader2, Plus, XCircle } from 'lucide-react';
import { useState } from 'react';

interface CompletedInterviewsPopupProps {
    isOpen: boolean;
    onClose: () => void;
    completedCandidates: Candidate[];
    onAccept: (candidateId: number, startDate: string) => void;
    onReject: (candidateId: number, reason?: RejectReason) => void;
    onReschedule: (candidateId: number) => void;
    onLoadMore?: () => void;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    totalCandidates?: number;
}

export function CompletedInterviewsPopup({
    isOpen,
    onClose,
    completedCandidates,
    onAccept,
    onReject,
    onReschedule,
    onLoadMore,
    hasNextPage = false,
    isFetchingNextPage = false,
    totalCandidates = 0,
}: CompletedInterviewsPopupProps) {
    const { isAdmin, isGroupOne } = useCompany();
    const [isStartDateDialogOpen, setStartDateDialogOpen] = useState(false);
    const [candidateToHire, setCandidateToHire] = useState<{ id: number; name: string } | null>(null);

    const handleHireClick = (candidate: Candidate) => {
        setCandidateToHire({ id: candidate.id, name: candidate.name });
        setStartDateDialogOpen(true);
    };

    const handleSaveStartDate = (startDate: string) => {
        if (!candidateToHire) return;
        onAccept(candidateToHire.id, startDate);
        setStartDateDialogOpen(false);
        setCandidateToHire(null);
    };

    if (completedCandidates.length === 0) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-baltra-600" />
                        Entrevistas Completadas
                    </DialogTitle>
                    <DialogDescription>
                        Tienes {totalCandidates} entrevista(s) completada(s) que
                        requieren una decisión.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4  max-h-[58vh] overflow-y-auto">
                    {completedCandidates.map((candidate) => (
                        <Card
                            key={candidate.id}
                            className="border-l-4 border-l-blue-500"
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12">
                                            <AvatarFallback className="text-lg">
                                                {candidate.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-lg">
                                                    {candidate.name}
                                                </h3>
                                                <div className="flex items-center gap-1">
                                                    {candidate.worked_here && (
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
                                                    {candidate.rescheduled && (
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
                                                                        - Se
                                                                        envio
                                                                        mensaje
                                                                        para
                                                                        reagendar
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {candidate.phone}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline">
                                                    {candidate.role}
                                                </Badge>
                                                {candidate.recommendation && (
                                                    <Badge
                                                        className={`${
                                                            candidate.recommendation ===
                                                                'Muy Recomendado' ||
                                                            candidate.recommendation ===
                                                                'Recomendado'
                                                                ? 'bg-baltra-100 text-baltra-800 border-baltra-200 hover:bg-baltra-200'
                                                                : candidate.recommendation ===
                                                                    'Rechazado'
                                                                  ? 'bg-red-100 text-red-800 border-red-200'
                                                                  : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {
                                                            candidate.recommendation
                                                        }
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <Button
                                        size="sm"
                                        className="flex-1 bg-baltra-600 hover:bg-baltra-700 text-white"
                                        onClick={() => handleHireClick(candidate)}
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Contratar
                                    </Button>
                                    <RejectionReasonDialog
                                        onReject={(reason) =>
                                            onReject(candidate.id, reason)
                                        }
                                    >
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="flex-1"
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Rechazar
                                        </Button>
                                    </RejectionReasonDialog>
                                    {candidate.rescheduled ? (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 opacity-50 cursor-not-allowed"
                                                        disabled
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                                                            <span>
                                                                Ya reagendado
                                                            </span>
                                                        </div>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>
                                                        Este candidato ya
                                                        reagendó su entrevista.
                                                        No se pueden enviar más
                                                        mensajes de
                                                        reagendamiento.
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : !isAdmin && isGroupOne ? null : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() =>
                                                onReschedule(candidate.id)
                                            }
                                        >
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Reagendar
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {hasNextPage && (
                        <div className="flex justify-center mt-4">
                            <Button
                                variant="outline"
                                onClick={onLoadMore}
                                disabled={isFetchingNextPage}
                                className="flex items-center gap-2"
                            >
                                {isFetchingNextPage ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                                {isFetchingNextPage
                                    ? 'Cargando...'
                                    : 'Cargar más candidatos'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Load More Button */}

                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={onClose}>
                        Revisar Después
                    </Button>
                </div>
            </DialogContent>
            <HiredCandidateStartDateDialog
                isOpen={isStartDateDialogOpen}
                onClose={() => {
                    setStartDateDialogOpen(false);
                    setCandidateToHire(null);
                }}
                onSave={handleSaveStartDate}
                candidateName={candidateToHire?.name ?? ''}
            />
        </Dialog>
    );
}
