'use client';

import { RejectionReasonDialog } from '@/components/rejection-reason-dialog';
import { CandidateDocumentVerificationDialog } from '@/components/candidate-document-verification-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCompany } from '@/context/CompanyContext';
import type { Candidate, RejectReason } from '@/lib/api';
import {
    useCandidatesAnswersData,
    useChangeFunnelStateMutation,
} from '@/querys/candidates';
import { CheckCircle2, Shield, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { HiredCandidateStartDateDialog } from './hired-candidate-start-date-dialog';
import { formatDateCandidateRow } from '@/lib/time';

interface CandidateProfilePopupProps {
    candidate: Candidate;
    children: React.ReactNode;
}

export function CandidateProfilePopup({
    candidate,
    children,
}: CandidateProfilePopupProps) {
    const { companyId } = useCompany();

    const [isOpen, setOpen] = useState(false);
    const [isDocumentVerificationOpen, setDocumentVerificationOpen] =
        useState(false);
    const [isStartDateDialogOpen, setStartDateDialogOpen] = useState(false);

    const {
        data: answersData,
        isLoading,
        isError,
        error,
        refetch,
    } = useCandidatesAnswersData(companyId, candidate.id, !isOpen);

    const { mutateAsync: changeFunnelState } =
        useChangeFunnelStateMutation(companyId);

    const handleHire = () => {
        setStartDateDialogOpen(true);
    };

    const handleSaveStartDate = async (startDate: string) => {
        await toast.promise(
            changeFunnelState({
                newState: 'hired',
                candidateId: candidate.id,
                startDate,
            }),
            {
                loading: 'Guardando fecha de inicio y contratando...',
                success: 'Fecha de inicio guardada y candidato contratado',
                error: 'Error al guardar la fecha de inicio y contratar',
            }
        );
        setStartDateDialogOpen(false);
    };

    const handleReject = (reason?: RejectReason) => {
        toast.promise(
            changeFunnelState({
                newState: 'rejected',
                candidateId: candidate.id,
                reason,
            }),
            {
                loading: 'Cargando...',
                success: 'Cambiando estado a rechazado',
                error: 'Error al cambiar estado',
            }
        );
    };

    const handleMissInterview = () => {
        toast.promise(
            changeFunnelState({
                newState: 'missed_interview',
                candidateId: candidate.id,
            }),
            {
                loading: 'Cargando...',
                success: 'Cambiando estado a no entrevistado',
                error: 'Error al cambiar estado',
            }
        );
    };

    return (
        <>
            <Dialog
                data-candidate-id={candidate.id}
                open={isOpen}
                onOpenChange={setOpen}
            >
                <DialogTrigger asChild className="cursor-pointer">
                    {children}
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="flex flex-row items-center justify-between">
                        <DialogTitle className="text-xl">
                            Perfil del Candidato
                        </DialogTitle>
                        <div className="flex justify-end gap-3 pt-4 ">
                            {candidate.rescheduled ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                disabled
                                                className="bg-gray-50 text-gray-400 border-gray-200 opacity-50 cursor-not-allowed"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                                                    <span>Ya reagendado</span>
                                                </div>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                Este candidato ya reagendó su
                                                entrevista. No se pueden enviar
                                                más mensajes de reagendamiento.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                                    onClick={handleMissInterview}
                                >
                                    Reagendar
                                </Button>
                            )}
                            <RejectionReasonDialog onReject={handleReject}>
                                <Button
                                    variant="outline"
                                    className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                >
                                    Rechazar
                                </Button>
                            </RejectionReasonDialog>
                            <Button
                                className="bg-baltra-600 hover:bg-baltra-700 text-white"
                                onClick={handleHire}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Contratar
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Candidate Header */}
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback>
                                        {candidate.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        {candidate.name}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {candidate.role}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="general">
                                    Información General
                                </TabsTrigger>
                                <TabsTrigger value="screening">
                                    Preguntas de Selección
                                </TabsTrigger>
                                <TabsTrigger value="documents">
                                    <Shield className="h-4 w-4 mr-2" />
                                    Verificación de Documentos
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="mt-6">
                                <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                                    <p>
                                        <span className="font-medium text-slate-700">
                                            Teléfono:
                                        </span>{' '}
                                        {candidate.phone}
                                    </p>
                                    <p>
                                        <span className="font-medium text-slate-700">
                                            Fecha de Selección:
                                        </span>{' '}
                                        {formatDateCandidateRow(
                                            candidate.screening_date ?? ''
                                        )}
                                    </p>
                                    <p>
                                        <span className="font-medium text-slate-700">
                                            Fecha de Entrevista:
                                        </span>{' '}
                                        {formatDateCandidateRow(
                                            candidate.interview_date ?? ''
                                        )}
                                    </p>
                                    <div>
                                        <span className="font-medium text-slate-700">
                                            Recomendación:
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="ml-2"
                                        >
                                            {candidate.recommendation}
                                        </Badge>
                                    </div>
                                    <div>
                                        <span className="font-medium text-slate-700">
                                            Estado del Proceso:
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="ml-2"
                                        >
                                            {candidate.funnel_state === 'Expirado' 
                                                ? (candidate.previous_funnel_state || candidate.funnel_state)
                                                : candidate.funnel_state
                                            }
                                        </Badge>
                                    </div>

                                    {candidate.travel_time_minutes && (
                                        <div>
                                            <span className="font-medium text-slate-700">
                                                Tiempo de Viaje:
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="ml-2"
                                            >
                                                {candidate.travel_time_minutes}{' '}
                                                minutos
                                            </Badge>
                                        </div>
                                    )}

                                    <div>
                                        <p className="font-medium text-slate-700">
                                            Puntuación:
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className="ml-2"
                                        >
                                            {candidate.score}
                                        </Badge>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="screening" className="mt-6">
                                <div className="space-y-4">
                                    {!isLoading &&
                                        !isError &&
                                        answersData?.map((item, index) => (
                                            <Card
                                                key={index}
                                                className="overflow-hidden"
                                            >
                                                <CardContent className="p-0">
                                                    <div className="bg-slate-50 p-4">
                                                        <h3 className="font-medium text-slate-800">
                                                            {item.question}
                                                        </h3>
                                                    </div>
                                                    <div className="p-4">
                                                        <p className="text-sm text-slate-600">
                                                            {item.answer_raw}
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}

                                    {isLoading && (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                                            <p className="mt-2 text-muted-foreground">
                                                Cargando preguntas de
                                                selección...
                                            </p>
                                        </div>
                                    )}

                                    {isError && (
                                        <div className="flex flex-col items-center justify-center py-8">
                                            <XCircle className="h-8 w-8 text-red-500" />
                                            <p className="mt-2 text-red-600">
                                                Error cargando preguntas de
                                                selección: {error.message}
                                            </p>
                                            <Button
                                                onClick={() => refetch()}
                                                className="mt-4"
                                                variant="outline"
                                            >
                                                Reintentar
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="documents" className="mt-6">
                                <div className="space-y-4">
                                    <div className="text-center py-8">
                                        <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                        <p className="text-muted-foreground mb-4">
                                            Ver el estado de verificación de
                                            documentos oficiales del candidato
                                        </p>
                                        <Button
                                            onClick={() =>
                                                setDocumentVerificationOpen(
                                                    true
                                                )
                                            }
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <Shield className="h-4 w-4 mr-2" />
                                            Ver Verificación de Documentos
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            *Si no está disponible, la
                                            verificación de documentos no está
                                            habilitada para esta compañía
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <CandidateDocumentVerificationDialog
                        candidateId={candidate.id}
                        candidateName={candidate.name}
                        isOpen={isDocumentVerificationOpen}
                        onClose={() => setDocumentVerificationOpen(false)}
                        allowUpload={true}
                    />
                </DialogContent>
            </Dialog>
            <HiredCandidateStartDateDialog
                isOpen={isStartDateDialogOpen}
                onClose={() => setStartDateDialogOpen(false)}
                onSave={handleSaveStartDate}
                candidateName={candidate.name}
            />
        </>
    );
}
