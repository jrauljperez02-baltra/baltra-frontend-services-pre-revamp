'use client';

import type React from 'react';

import { InterviewSchedulingDialog } from '@/components/interview-scheduling-dialog';
import { RejectionReasonDialog } from '@/components/rejection-reason-dialog';
import { HiredCandidateStartDateDialog } from '@/components/hired-candidate-start-date-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    type Candidate,
    changeFunnelState,
    type RejectReason,
    cancelInterview,
} from '@/lib/api';
import {
    useCandidatesData,
    useChangeFunnelStateMutation,
    useInfiniteCandidatesPagination,
    useInterviewAddresses,
} from '@/querys/candidates';
import {
    CalendarIcon,
    CheckCircle2,
    ChevronLeftIcon,
    ChevronRightIcon,
    Clock,
    Ellipsis,
    EllipsisVertical,
    MapPin,
    MapPinIcon,
    User,
    Video,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Calendar } from './ui/calendar';

import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarTrigger,
} from '@/components/ui/menubar';
import { useCompanyID, useCompany } from '@/context/CompanyContext';
import { toast } from 'sonner';
import { CandidateProfilePopup } from './candidate-profile-popup';
import { Label } from './ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from './ui/tooltip';

import { rawDateFix } from '@/lib/raw-date-fix';
import { format } from 'date-fns';
import { formatDateCandidateRow } from '@/lib/time';


export function InterviewScheduleExpanded() {
    const { isAdmin, isGroupOne } = useCompany();
    const companyId = useCompanyID();

    const { mutateAsync: changeFunnelState } =
        useChangeFunnelStateMutation(companyId);

    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isStartDateDialogOpen, setStartDateDialogOpen] = useState(false);
    const [candidateToHire, setCandidateToHire] = useState<{ id: number; name: string } | null>(null);

    // Ensure date is never undefined - fallback to current date
    useEffect(() => {
        if (!date) {
            setDate(new Date());
        }
    }, [date]);

    const { data: interviewAddresses } = useInterviewAddresses(
        companyId,
        date?.toISOString().split('T')[0]
    );

    const [_selectedInterviewAddress, setSelectedInterviewAddress] =
        useState<string>('all');

    useEffect(() => {
        setSelectedInterviewAddress('all');
    }, [date]);

    const selectedInterviewAddress = useMemo(() => {
        if (_selectedInterviewAddress === 'all') {
            return undefined;
        }
        return _selectedInterviewAddress;
    }, [_selectedInterviewAddress]);

    const {
        data: candidates,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteCandidatesPagination(companyId, {
        per_page: 100,
        interview_address: selectedInterviewAddress,
        interview_date_exact: date?.toISOString().split('T')[0],
    });

    const countAllCandidates = useMemo(() => {
        if (!candidates) return 0;
        if (!interviewAddresses) return 0;
        return Object.keys(interviewAddresses).reduce((acc, key) => {
            return acc + interviewAddresses[key];
        }, 0);
    }, [interviewAddresses, candidates]);

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

    const handleHire = (interview: Candidate, e: React.MouseEvent) => {
        e.stopPropagation();
        setCandidateToHire({ id: interview.id, name: interview.name });
        setStartDateDialogOpen(true);
    };

    const handleSaveStartDate = async (startDate: string) => {
        if (!candidateToHire) return;

        await toast.promise(
            changeFunnelState({
                newState: 'hired',
                candidateId: candidateToHire.id,
                startDate,
            }),
            {
                loading: 'Guardando fecha de inicio y contratando...',
                success: 'Fecha de inicio guardada y candidato contratado',
                error: 'Error al guardar la fecha de inicio y contratar',
            }
        );
        setStartDateDialogOpen(false);
        setCandidateToHire(null);
    };

    const handleReject = (interview: Candidate, reason?: RejectReason) => {
        toast.promise(
            changeFunnelState({
                newState: 'rejected',
                candidateId: interview.id,
                reason,
            }),
            {
                loading: 'Cargando...',
                success: 'Cambiando estado a rechazado',
                error: 'Error al cambiar estado',
            }
        );
    };

    const handleCancelInterview = (
        interview: Candidate,
        e: React.MouseEvent
    ) => {
        e.stopPropagation();
        toast.promise(cancelInterview(companyId, interview.id), {
            loading: 'Cancelando entrevista...',
            success: 'Entrevista cancelada',
            error: 'Error al cancelar entrevista',
        });
    };

    return (
        <div className="w-full space-y-6">
            <div className="w-full">
                <InterviewSchedulingDialog />
            </div>
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        Calendario de entrevistas
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">
                            Entrevistas de hoy
                        </h2>
                        <div className="lg:grid lg:grid-cols-12 lg:gap-x-6">
                            <div className="mt-10 text-center lg:col-start-8 lg:col-end-13 lg:row-start-1 lg:mt-0 xl:col-start-9">
                                {/* Interview Address selector encima del calendario */}
                                <div className="mb-4">
                                    <Label
                                        htmlFor="interview-address"
                                        className="text-sm font-semibold text-slate-700 block mb-2"
                                    >
                                        Dirección de la entrevista
                                    </Label>
                                    <Select
                                        name="interview-address"
                                        value={_selectedInterviewAddress}
                                        onValueChange={
                                            setSelectedInterviewAddress
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                ({countAllCandidates}) Todas
                                            </SelectItem>
                                            {Object.entries(
                                                interviewAddresses ?? {}
                                            ).map(([address, count]) => (
                                                <SelectItem
                                                    key={address}
                                                    value={address}
                                                >
                                                    ({count}){' '}
                                                    {address === 'none'
                                                        ? 'Sin dirección'
                                                        : address}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Calendario */}
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(newDate) => {
                                        // Prevent deselection - always keep a date selected
                                        if (newDate) {
                                            setDate(newDate);
                                        }
                                        // If newDate is undefined (deselection attempt), do nothing
                                    }}
                                    className="rounded-lg border"
                                />
                            </div>

                            <ol className="mt-4 divide-y divide-gray-100 text-sm/6 lg:col-span-7 xl:col-span-8 max-h-96 overflow-y-auto">
                                {candidates?.map((meeting) => {
                                    return (
                                        <CandidateProfilePopup
                                            key={meeting.id}
                                            candidate={meeting}
                                        >
                                            <li
                                                key={meeting.id}
                                                className="relative flex gap-x-6 py-6 xl:static"
                                            >
                                                <Avatar className="size-14 flex-none rounded-full">
                                                    <AvatarFallback>
                                                        {meeting.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-auto">
                                                    <div className="flex items-center gap-2 pr-10 xl:pr-0">
                                                        <h3 className="font-semibold text-gray-900">
                                                            {meeting.name}
                                                        </h3>
                                                        <div className="flex items-center gap-1">
                                                            {meeting.worked_here && (
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
                                                            {meeting.rescheduled && (
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
                                                    <dl className="mt-2 flex flex-col text-gray-500 xl:flex-row">
                                                        <div className="flex items-start gap-x-3">
                                                            <dt className="mt-0.5">
                                                                <span className="sr-only">
                                                                    Date
                                                                </span>
                                                                <CalendarIcon
                                                                    className="size-5 text-gray-400"
                                                                    aria-hidden="true"
                                                                />
                                                            </dt>
                                                            <dd>
                                                                <time
                                                                    dateTime={
                                                                        meeting.interview_date ??
                                                                        undefined
                                                                    }
                                                                >
                                                                    {formatDateCandidateRow(
                                                                        meeting.interview_date ??
                                                                        ''
                                                                    )}
                                                                </time>
                                                            </dd>
                                                        </div>
                                                        <div className="mt-2 flex items-start gap-x-3 xl:ml-3.5 xl:mt-0 xl:border-l xl:border-gray-400/50 xl:pl-3.5">
                                                            <dt className="mt-0.5">
                                                                <span className="sr-only">
                                                                    Role
                                                                </span>
                                                            </dt>
                                                            <dd>{meeting.role}</dd>
                                                        </div>
                                                    </dl>
                                                </div>
                                                <div
                                                    className="px-6"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <Menubar>
                                                        <MenubarMenu>
                                                            <MenubarTrigger>
                                                                <EllipsisVertical />
                                                            </MenubarTrigger>
                                                            <MenubarContent>
                                                                <MenubarItem
                                                                    onClick={(e) =>
                                                                        handleHire(
                                                                            meeting,
                                                                            e
                                                                        )
                                                                    }
                                                                    className="text-green-600"
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                                                    Contratar
                                                                </MenubarItem>
                                                                <RejectionReasonDialog
                                                                    onReject={(
                                                                        reason
                                                                    ) =>
                                                                        handleReject(
                                                                            meeting,
                                                                            reason
                                                                        )
                                                                    }
                                                                >
                                                                    <MenubarItem
                                                                        className="text-red-600"
                                                                        onSelect={(
                                                                            e
                                                                        ) =>
                                                                            e.preventDefault()
                                                                        }
                                                                    >
                                                                        <XCircle className="h-4 w-4 mr-2" />
                                                                        Rechazar
                                                                    </MenubarItem>
                                                                </RejectionReasonDialog>
                                                                <MenubarItem
                                                                    onClick={(e) =>
                                                                        handleCancelInterview(
                                                                            meeting,
                                                                            e
                                                                        )
                                                                    }
                                                                    className="text-orange-600"
                                                                >
                                                                    Cancelar
                                                                    Entrevista
                                                                </MenubarItem>
                                                                {meeting.rescheduled ? (
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger
                                                                                asChild
                                                                            >
                                                                                <MenubarItem
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
                                                                                </MenubarItem>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent side="left">
                                                                                <p>
                                                                                    Este
                                                                                    candidato
                                                                                    ya
                                                                                    reagendó
                                                                                    su
                                                                                    entrevista.
                                                                                    No
                                                                                    se
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
                                                                ) : !isAdmin &&
                                                                    isGroupOne ? null : (
                                                                    <MenubarItem
                                                                        onClick={(
                                                                            e
                                                                        ) =>
                                                                            handleMissInterview(
                                                                                meeting,
                                                                                e
                                                                            )
                                                                        }
                                                                    >
                                                                        Reagendar
                                                                    </MenubarItem>
                                                                )}
                                                            </MenubarContent>
                                                        </MenubarMenu>
                                                    </Menubar>
                                                </div>
                                            </li>
                                        </CandidateProfilePopup>
                                    )
                                })}
                            </ol>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <HiredCandidateStartDateDialog
                isOpen={isStartDateDialogOpen}
                onClose={() => {
                    setStartDateDialogOpen(false);
                    setCandidateToHire(null);
                }}
                onSave={handleSaveStartDate}
                candidateName={candidateToHire?.name ?? ''}
            />
        </div>
    );
}
