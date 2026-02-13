'use client';

import { PageHeader } from '@/components/page-header';
import { useCompanyID } from '@/context/CompanyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getReferralStats, type ReferralStatsData, getGroupedCandidatesByState, type CandidateGroupItem } from '@/lib/api';
import { useCompanyData } from '@/querys/company';
import * as R from 'recharts';
import { Loader2, Calendar, CheckCircle2, XCircle, UserCheck, UserX, QrCode, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useEffect } from 'react';
import { useChangeFunnelStateMutation, useInvalidateCandidatesQuery } from '@/querys/candidates';
import { HiredCandidateStartDateDialog } from '@/components/hired-candidate-start-date-dialog';
import { toast } from 'sonner';
import type { RejectReason } from '@/lib/api';
import { getRejectionReasonLabel } from '@/lib/rejection-reasons';
import { Badge } from '@/components/ui/badge';
import { RejectionReasonDialog } from '@/components/rejection-reason-dialog';
import { QRAttendanceDialog } from '@/components/qr-attendance-dialog';
import * as XLSX from 'xlsx-js-style';

export default function ContratadosPage() {
    const companyId = useCompanyID();
    const [activeTab, setActiveTab] = useState('interviewed');
    const [currentPage, setCurrentPage] = useState(1);
    const [isStartDateDialogOpen, setStartDateDialogOpen] = useState(false);
    const [candidateToHire, setCandidateToHire] = useState<{ id: number; name: string } | null>(null);
    const itemsPerPage = 30;
    
    // Get company data to access timezone
    const { data: companyData } = useCompanyData(companyId ?? 0);
    const companyTimezone = companyData?.timezone || 'America/Mexico_City';

    // Date filter state
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const [startDate, setStartDate] = useState<string>(
        thirtyDaysAgo.toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState<string>(
        today.toISOString().split('T')[0]
    );

    const { data: referralStats, isLoading, error } = useQuery({
        queryKey: ['referral-stats', companyId, startDate, endDate],
        queryFn: () => getReferralStats(companyId ?? 0, startDate, endDate),
        enabled: !!companyId && companyId > 0,
    });

    const { data: groupedCandidates, isLoading: isLoadingCandidates, error: errorCandidates, refetch: refetchCandidates } = useQuery({
        queryKey: ['grouped-candidates', companyId, startDate, endDate],
        queryFn: () => getGroupedCandidatesByState(companyId ?? 0, startDate, endDate),
        enabled: !!companyId && companyId > 0,
    });

    const { mutateAsync: changeFunnelState } = useChangeFunnelStateMutation(companyId ?? 0);
    const invalidateCandidatesQuery = useInvalidateCandidatesQuery(companyId ?? 0);

    // Prepare chart data - combine hired and onboarding into one value
    const chartData = referralStats?.map((item) => ({
        referred_by: item.referred_by,
        contratados: item.hired + item.onboarding,
    })) || [];

    // Process grouped candidates data
    const candidatesData = useMemo(() => {
        if (!groupedCandidates || groupedCandidates.length === 0) {
            return {
                interviewed: [],
                hired: [],
                onboarding: [],
                rejected: [],
                all: []
            };
        }

        const flattened: {
            hired?: CandidateGroupItem[];
            onboarding?: CandidateGroupItem[];
            interviewed?: CandidateGroupItem[];
            rejected?: CandidateGroupItem[];
        } = {};
        
        groupedCandidates.forEach((item) => {
            if (item.hired) flattened.hired = item.hired;
            if (item.onboarding) flattened.onboarding = item.onboarding;
            if (item.interviewed) flattened.interviewed = item.interviewed;
            if (item.rejected) flattened.rejected = item.rejected;
        });

        const hired = flattened.hired || [];
        const onboarding = flattened.onboarding || [];
        const interviewed = flattened.interviewed || [];
        const rejected = flattened.rejected || [];
        const all = [...hired, ...onboarding, ...interviewed, ...rejected];

        return {
            interviewed,
            hired,
            onboarding,
            rejected,
            all
        };
    }, [groupedCandidates]);

    // Get candidates for current tab, sorted by interview_date_time (most recent first)
    const currentCandidates = useMemo(() => {
        let candidates: CandidateGroupItem[] = [];
        
        if (activeTab === 'hired+onboarding') {
            candidates = [...candidatesData.hired, ...candidatesData.onboarding];
        } else {
            candidates = candidatesData[activeTab as keyof typeof candidatesData] || [];
        }
        
        // Sort by interview_date_time (most recent first, nulls last)
        return candidates.sort((a, b) => {
            // Handle null values - put them at the end
            if (!a.interview_date_time && !b.interview_date_time) return 0;
            if (!a.interview_date_time) return 1;
            if (!b.interview_date_time) return -1;
            
            // Sort by date descending (most recent first)
            const dateA = new Date(a.interview_date_time).getTime();
            const dateB = new Date(b.interview_date_time).getTime();
            return dateB - dateA;
        });
    }, [activeTab, candidatesData]);

    // Reset page when tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    // Calculate pagination
    const totalCandidates = currentCandidates.length;
    const totalPages = Math.ceil(totalCandidates / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCandidates = currentCandidates.slice(startIndex, endIndex);
    const startEntry = totalCandidates > 0 ? startIndex + 1 : 0;
    const endEntry = Math.min(endIndex, totalCandidates);

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleHire = (candidateId: number, candidateName: string) => {
        setCandidateToHire({ id: candidateId, name: candidateName });
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
        refetchCandidates();
    };

    const handleReject = (candidateId: number, reason?: RejectReason) => {
        toast.promise(
            changeFunnelState({
                newState: 'rejected',
                candidateId: candidateId,
                reason,
            }),
            {
                loading: 'Rechazando candidato...',
                success: 'Candidato rechazado exitosamente',
                error: 'Error al rechazar candidato',
                finally() {
                    invalidateCandidatesQuery();
                    refetchCandidates();
                },
            }
        );
    };

    // Helper function to format phone number - removes "1" after "52"
    const formatPhoneNumber = (phone: string): string => {
        if (!phone) return 'N/A';
        // Remove "1" after "52" if present (e.g., "5218136242156" -> "528136242156")
        if (phone.startsWith('521') && phone.length > 3) {
            return '52' + phone.substring(3);
        }
        return phone;
    };

    // Helper function to prepare export data - exports ALL candidates from all sections
    const prepareExportData = () => {
        const allCandidates = candidatesData.all;
        
        return allCandidates.map((candidate) => {
            // Format interview date
            let formattedDate = 'N/A';
            if (candidate.interview_date_time) {
                try {
                    const [datePart, timePart] = candidate.interview_date_time.split(' ');
                    const [year, month, day] = datePart.split('-');
                    const [hourStr, minute] = timePart.split(':');
                    
                    const hour24 = parseInt(hourStr, 10);
                    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                    const ampm = hour24 >= 12 ? 'p.m.' : 'a.m.';
                    
                    formattedDate = `${day}/${month}/${year}, ${hour12}:${minute.padStart(2, '0')} ${ampm}`;
                } catch (e) {
                    formattedDate = candidate.interview_date_time;
                }
            }

            // Determine status
            const isInterviewed = candidatesData.interviewed.some(c => c.candidate_id === candidate.candidate_id);
            const isHired = candidatesData.hired.some(c => c.candidate_id === candidate.candidate_id) || 
                           candidatesData.onboarding.some(c => c.candidate_id === candidate.candidate_id);
            const isRejected = candidatesData.rejected.some(c => c.candidate_id === candidate.candidate_id);
            
            let status = 'N/A';
            if (isHired) {
                status = 'Contratado';
            } else if (isRejected) {
                status = 'Rechazado';
            } else if (isInterviewed) {
                status = 'Entrevistado';
            }

            // Get rejection reason label
            const rejectionReason = candidate.rejected_reason 
                ? getRejectionReasonLabel(candidate.rejected_reason, companyId ?? 0)
                : 'N/A';

            return {
                'ID': candidate.candidate_id,
                'Nombre': candidate.name || 'N/A',
                'Teléfono': formatPhoneNumber(candidate.phone),
                'Origen': candidate.referred_by,
                'Rol': candidate.role_name || 'N/A',
                'Fecha de Entrevista': formattedDate,
                'Estado': status,
                'Razón de Rechazo': rejectionReason,
                'Nivel Educativo': candidate.education_level || 'N/A',
                'Edad': candidate.age || 'N/A',
                'Género': candidate.gender || 'N/A',
            };
        });
    };

    const exportToExcel = () => {
        const allCandidates = candidatesData.all;
        
        if (allCandidates.length === 0) {
            toast.error('No hay candidatos para exportar');
            return;
        }

        const exportData = prepareExportData();

        // Create workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Candidatos');

        // Define column widths
        const colWidths = [
            { wch: 8 },   // ID
            { wch: 25 },  // Nombre
            { wch: 15 },  // Teléfono
            { wch: 20 },  // Origen
            { wch: 20 },  // Rol
            { wch: 25 },  // Fecha de Entrevista
            { wch: 15 },  // Estado
            { wch: 30 },  // Razón de Rechazo
            { wch: 20 },  // Nivel Educativo
            { wch: 8 },   // Edad
            { wch: 12 },  // Género
        ];
        ws['!cols'] = colWidths;

        // Style header row
        const headerStyle = {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
            fill: { fgColor: { rgb: '005693' } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } },
            },
        };

        // Style data rows
        const dataStyle = {
            font: { sz: 11 },
            alignment: { vertical: 'center', wrapText: true },
            border: {
                top: { style: 'thin', color: { rgb: 'E0E0E0' } },
                bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
                left: { style: 'thin', color: { rgb: 'E0E0E0' } },
                right: { style: 'thin', color: { rgb: 'E0E0E0' } },
            },
        };

        // Get range of cells
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        
        // Apply styles to header row (row 0)
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (!ws[cellAddress]) continue;
            ws[cellAddress].s = headerStyle;
        }

        // Apply styles to data rows
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                if (!ws[cellAddress]) continue;
                
                // Apply base data style
                ws[cellAddress].s = { ...dataStyle };
                
                // Center align ID, Estado, and Edad columns
                if (col === 0 || col === 6 || col === 9) { // ID, Estado, or Edad
                    ws[cellAddress].s.alignment = { ...dataStyle.alignment, horizontal: 'center' };
                }
            }
        }

        // Freeze header row
        ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };

        // Generate filename with date range
        const filename = `candidatos_${startDate}_${endDate}_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Write file
        XLSX.writeFile(wb, filename);
        toast.success(`Exportados ${allCandidates.length} candidatos a Excel`);
    };

    const exportToCSV = () => {
        const allCandidates = candidatesData.all;
        
        if (allCandidates.length === 0) {
            toast.error('No hay candidatos para exportar');
            return;
        }

        const exportData = prepareExportData();

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // Convert to CSV
        const csv = XLSX.utils.sheet_to_csv(ws);

        // Create blob and download
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const filename = `candidatos_${startDate}_${endDate}_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Exportados ${allCandidates.length} candidatos a CSV`);
    };

    return (
        <div className="flex-1 space-y-4 px-4 md:px-8 py-2">
            <PageHeader
                title="Atendio Entrevista"
                description="Gestiona y revisa los candidatos que han sido contratados"
            />
            
            {/* QR Code Button */}
            {companyData?.qr_attendance_s3_path && (
                <div className="flex justify-end">
                    <QRAttendanceDialog
                        qrUrl={companyData.qr_attendance_s3_path}
                        companyName={companyData.name}
                    >
                        <Button variant="outline" className="gap-2">
                            <QrCode className="h-4 w-4" />
                            Ver Código QR de Asistencia
                        </Button>
                    </QRAttendanceDialog>
                </div>
            )}
            
            {/* Date Filter */}
            <Card className="!shadow-none">
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
                                onChange={(e) => setStartDate(e.target.value)}
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
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                                max={today.toISOString().split('T')[0]}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <div className="w-full mx-auto">
                <div className="!shadow-none border-0 w-2/3 mx-auto">
                    <CardHeader>
                        <CardTitle>Estadísticas por Origen de Referencia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center h-[400px]">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center h-[400px] text-destructive">
                                Error al cargar los datos
                            </div>
                        ) : chartData.length === 0 ? (
                            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                                No hay datos disponibles
                            </div>
                        ) : (
                            <div className="h-[400px] w-full">
                                <R.ResponsiveContainer width="100%" height="100%">
                                    <R.BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <R.CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <R.XAxis 
                                            dataKey="referred_by" 
                                            angle={-45}
                                            textAnchor="end"
                                            height={100}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <R.YAxis allowDecimals={false} />
                                        <R.Tooltip 
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-background border rounded-lg  p-3">
                                                            <p className="font-semibold mb-2">{payload[0].payload.referred_by}</p>
                                                            <p className="text-sm text-baltra-600">
                                                                Contratados: {payload[0].payload.contratados}
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <R.Bar 
                                            dataKey="contratados" 
                                            name="Contratados" 
                                            fill="#005693" 
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </R.BarChart>
                                </R.ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </div>

                <Card className="!shadow-none">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Candidatos</CardTitle>
                            {candidatesData.all.length > 0 && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={exportToExcel}
                                        className="gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Exportar a Excel
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={exportToCSV}
                                        className="gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Exportar a CSV
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="interviewed">Entrevistados</TabsTrigger>
                                <TabsTrigger value="hired+onboarding">Contratados</TabsTrigger>
                                <TabsTrigger value="rejected">Rechazados</TabsTrigger>
                                <TabsTrigger value="all">Todos</TabsTrigger>
                            </TabsList>

                            <TabsContent value={activeTab} className="mt-4">
                                {isLoadingCandidates ? (
                                    <div className="flex items-center justify-center h-[200px]">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : errorCandidates ? (
                                    <div className="flex items-center justify-center h-[200px] text-destructive">
                                        Error al cargar los candidatos
                                    </div>
                                ) : currentCandidates.length === 0 ? (
                                    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                                        No hay candidatos en esta categoría
                                    </div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-center">Contratar y Rechazar</TableHead>
                                                    <TableHead>Nombre</TableHead>
                                                    <TableHead>Teléfono</TableHead>
                                                    <TableHead>Origen</TableHead>
                                                <TableHead>Rol</TableHead>
                                                    <TableHead>Fecha de Entrevista</TableHead>
                                                    <TableHead>Razón de Rechazo</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedCandidates.map((candidate) => {
                                                    // Determine candidate state
                                                    const isInterviewed = candidatesData.interviewed.some(c => c.candidate_id === candidate.candidate_id);
                                                    const isHired = candidatesData.hired.some(c => c.candidate_id === candidate.candidate_id) || 
                                                                    candidatesData.onboarding.some(c => c.candidate_id === candidate.candidate_id);
                                                    const isRejected = candidatesData.rejected.some(c => c.candidate_id === candidate.candidate_id);
                                                    
                                                    const showButtons = isInterviewed && (activeTab === 'interviewed' || activeTab === 'all');
                                                    
                                                    return (
                                                        <TableRow key={candidate.candidate_id}>
                                                            <TableCell className="text-center">
                                                                {showButtons ? (
                                                                    <div className="flex gap-2 justify-center items-center">
                                                                        <Button
                                                                            size="sm"
                                                                            className="bg-baltra-600 hover:bg-baltra-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                                                                            onClick={() => handleHire(candidate.candidate_id, candidate.name || 'N/A')}
                                                                        >
                                                                            <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                                                            Contratar
                                                                        </Button>
                                                                        <RejectionReasonDialog
                                                                            onReject={(reason) => handleReject(candidate.candidate_id, reason)}
                                                                        >
                                                                            <Button
                                                                                size="sm"
                                                                                variant="destructive"
                                                                                className="shadow-sm hover:shadow-md transition-all duration-200"
                                                                            >
                                                                                <XCircle className="h-4 w-4 mr-1.5" />
                                                                                Rechazar
                                                                            </Button>
                                                                        </RejectionReasonDialog>
                                                                    </div>
                                                                ) : isHired ? (
                                                                    <div className="flex justify-center">
                                                                        <Badge className="bg-baltra-600 hover:bg-baltra-700 text-white font-medium px-3 py-1.5 shadow-sm">
                                                                            <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                                                                            Contratado
                                                                        </Badge>
                                                                    </div>
                                                                ) : isRejected ? (
                                                                    <div className="flex justify-center">
                                                                        <Badge variant="destructive" className="font-medium px-3 py-1.5 shadow-sm">
                                                                            <UserX className="h-3.5 w-3.5 mr-1.5" />
                                                                            Rechazado
                                                                        </Badge>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted-foreground text-sm">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>{candidate.name || 'N/A'}</TableCell>
                                                            <TableCell>{candidate.phone}</TableCell>
                                                            <TableCell>{candidate.referred_by}</TableCell>
                                                            <TableCell>{candidate.role_name || 'N/A'}</TableCell>
                                                            <TableCell>
                                                                {candidate.interview_date_time 
                                                                    ? (() => {
                                                                        try {
                                                                            // Parse the date string directly without timezone conversion
                                                                            // Format: "YYYY-MM-DD HH:MM:SS"
                                                                            const [datePart, timePart] = candidate.interview_date_time.split(' ');
                                                                            const [year, month, day] = datePart.split('-');
                                                                            const [hourStr, minute] = timePart.split(':');
                                                                            
                                                                            // Convert 24-hour format to 12-hour format with AM/PM
                                                                            const hour24 = parseInt(hourStr, 10);
                                                                            const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                                                                            const ampm = hour24 >= 12 ? 'p.m.' : 'a.m.';
                                                                            
                                                                            // Format as DD/MM/YYYY, HH:MM AM/PM
                                                                            return `${day}/${month}/${year}, ${hour12}:${minute.padStart(2, '0')} ${ampm}`;
                                                                        } catch (e) {
                                                                            // Fallback: show as-is if parsing fails
                                                                            return candidate.interview_date_time;
                                                                        }
                                                                    })()
                                                                    : 'N/A'
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex">
                                                                    <Badge
                                                                        className={`${
                                                                            candidate.rejected_reason
                                                                                ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                                                                                : 'bg-gray-100 text-gray-800 border-gray-200'
                                                                        } transition-colors`}
                                                                    >
                                                                        {candidate.rejected_reason ? (
                                                                            <>
                                                                                <XCircle className="h-3 w-3 mr-1" />
                                                                                {getRejectionReasonLabel(
                                                                                    candidate.rejected_reason,
                                                                                    companyId ?? 0
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            'NA'
                                                                        )}
                                                                    </Badge>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {/* Pagination */}
                                {currentCandidates.length > itemsPerPage && (
                                    <div className="flex flex-col items-center mt-6">
                                        {/* Help text */}
                                        <span className="text-sm text-muted-foreground">
                                            Mostrando <span className="font-semibold text-foreground">{startEntry}</span> a <span className="font-semibold text-foreground">{endEntry}</span> de <span className="font-semibold text-foreground">{totalCandidates}</span> Registros
                                        </span>
                                        {/* Buttons */}
                                        <div className="inline-flex mt-4 -space-x-px">
                                            {/* Previous Button */}
                                            <button
                                                type="button"
                                                onClick={handlePreviousPage}
                                                disabled={currentPage === 1}
                                                className={`inline-flex items-center text-muted-foreground bg-background border border-border hover:bg-muted hover:text-foreground shadow-sm font-medium leading-5 rounded-l-md text-sm px-3 py-2 focus:outline-none ${
                                                    currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                                }`}
                                            >
                                                Anterior
                                            </button>
                                            {/* Next Button */}
                                            <button
                                                type="button"
                                                onClick={handleNextPage}
                                                disabled={currentPage === totalPages}
                                                className={`inline-flex items-center text-muted-foreground bg-background border border-border hover:bg-muted hover:text-foreground shadow-sm font-medium leading-5 rounded-r-md text-sm px-3 py-2 focus:outline-none ${
                                                    currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                                }`}
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            {candidateToHire && (
                <HiredCandidateStartDateDialog
                    isOpen={isStartDateDialogOpen}
                    onClose={() => {
                        setStartDateDialogOpen(false);
                        setCandidateToHire(null);
                    }}
                    onSave={handleSaveStartDate}
                    candidateName={candidateToHire.name}
                />
            )}
        </div>
    );
}
