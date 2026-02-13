'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { AdminDashboard } from '@/components/admin-dashboard';
import { CandidatesTableHired } from '@/components/candidates-table-hired';
import { ConversionFunnel } from '@/components/conversion-funnel';
import { DashboardTracker } from '@/components/dashboard-tracker';
import { PageHeader } from '@/components/page-header';
import { ShowCompany2 } from '@/components/show-company-2';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AlertCircle, TrendingUp, Loader2, CalendarIcon } from 'lucide-react';
import { PendingInterviewsAlert } from '@/components/pending-interviews-alert';
import type { DateRange } from 'react-day-picker';

import {
    fetchUserAttributesSafe,
    hasCompanyId,
    isUserAdmin,
    type UserAttributes,
} from '@/lib/user-attributes';
import { useCompany } from '@/context/CompanyContext';
import { useCompanyData } from '@/querys/company';

export default function DashboardClient({
    initialStoreId,
}: {
    initialStoreId?: string | number;
}) {
    const [attrs, setAttrs] = useState<UserAttributes>({
        email: null,
        userId: null,
        companyId: null,
        isSuperadmin: null,
        isAdmin: null,
        emailVerified: null,
        companiesIds: null,
    });
    const [loading, setLoading] = useState(true);
    
    // Date filter state - default to current month
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [endDate, setEndDate] = useState<string>(() => {
        const d = new Date();
        const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
    });
    
    const dateRange: DateRange = useMemo(() => {
        const toDate = (s: string) => {
            const [y, m, d] = s.split('-').map(Number);
            return new Date(y, (m || 1) - 1, d || 1);
        };
        return { from: toDate(startDate), to: toDate(endDate) };
    }, [startDate, endDate]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const a = await fetchUserAttributesSafe();
            if (mounted) {
                setAttrs(a);
                setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const { isImpersonating, companyId: effectiveCompanyId, isLoadingCompanyData } = useCompany();
    const { data: companyData } = useCompanyData(effectiveCompanyId ?? 0);

    // companyId seguro como number | null
    const companyId = hasCompanyId(attrs) ? attrs.companyId : null;

    // Determine if we need to wait for company data to load
    // If user has isAdmin flag, we need to wait for companyData to check group_id
    const needsCompanyDataForAdminCheck = attrs.isAdmin === true && companyId != null;
    const isWaitingForAdminCheck = needsCompanyDataForAdminCheck && isLoadingCompanyData;

    // Show loading while:
    // 1. User attributes are loading
    // 2. Company data is loading AND we need it to determine admin status
    if (loading || isWaitingForAdminCheck) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Cargando dashboard...</p>
            </div>
        );
    }

    // Reglas de negocio
    const isAdmin = isUserAdmin(attrs, companyData ?? undefined);
    const shouldShowAdmin = isAdmin && !isImpersonating;

    if (shouldShowAdmin) {
        const initialSelectedStore = initialStoreId
            ? `store-${initialStoreId}`
            : 'all';
        return <AdminDashboard initialSelectedStore={initialSelectedStore} />;
    }

    return (
        <div className="flex flex-col min-h-screen w-full">
            <DashboardTracker pageName="Dashboard" trackDashboard={true} />

            <div className="px-4 md:px-8 pt-6">
                <PendingInterviewsAlert />
            </div>

            <PageHeader
                title="Panel de Control"
                description="Seguimiento integral de contratación y retención de trabajadores de primera línea"
            />

            <div className="px-4 md:px-8 pt-4">
                <div className="flex justify-end">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="min-w-[260px] justify-start text-left font-normal"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate && endDate ? (
                                    `${startDate} - ${endDate}`
                                ) : (
                                    <span>Seleccionar rango de fechas</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                numberOfMonths={2}
                                onSelect={(r) => {
                                    if (!r) return;
                                    if (r.from) {
                                        const y = r.from.getFullYear();
                                        const m = String(
                                            r.from.getMonth() + 1
                                        ).padStart(2, '0');
                                        const d = String(
                                            r.from.getDate()
                                        ).padStart(2, '0');
                                        setStartDate(`${y}-${m}-${d}`);
                                    }
                                    if (r.to) {
                                        const y = r.to.getFullYear();
                                        const m = String(
                                            r.to.getMonth() + 1
                                        ).padStart(2, '0');
                                        const d = String(
                                            r.to.getDate()
                                        ).padStart(2, '0');
                                        setEndDate(`${y}-${m}-${d}`);
                                    }
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full">
                {/* Si tus componentes necesitan el companyId, pásalo como prop */}
                <ConversionFunnel 
                    dateRange={{ startDate, endDate }}
                />

                <CandidatesTableHired 
                    dateRange={{ startDate, endDate }}
                />

                <ShowCompany2 /* companyId={companyId ?? undefined} */>
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                        <Card>
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="text-lg sm:text-xl">
                                    Métricas Clave
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2 border rounded-md p-3">
                                            <h3 className="text-sm font-medium">
                                                Costo por Contratación
                                            </h3>
                                            <div className="text-xl sm:text-2xl font-bold">
                                                $428
                                            </div>
                                            <div className="flex items-center text-xs text-baltra-500">
                                                <TrendingUp className="mr-1 h-3 w-3" />
                                                12% de mejora
                                            </div>
                                        </div>

                                        <div className="space-y-2 border rounded-md p-3">
                                            <h3 className="text-sm font-medium">
                                                Tiempo de Contratación
                                            </h3>
                                            <div className="text-xl sm:text-2xl font-bold">
                                                14 días
                                            </div>
                                            <div className="flex items-center text-xs text-baltra-500">
                                                <TrendingUp className="mr-1 h-3 w-3" />
                                                3 días más rápido
                                            </div>
                                        </div>

                                        <div className="space-y-2 border rounded-md p-3">
                                            <h3 className="text-sm font-medium">
                                                Éxito en Entrevistas
                                            </h3>
                                            <div className="text-xl sm:text-2xl font-bold">
                                                68%
                                            </div>
                                            <div className="flex items-center text-xs text-baltra-500">
                                                <TrendingUp className="mr-1 h-3 w-3" />
                                                5% de mejora
                                            </div>
                                        </div>

                                        <div className="space-y-2 border rounded-md p-3">
                                            <h3 className="text-sm font-medium">
                                                Precisión de Evaluación
                                            </h3>
                                            <div className="text-xl sm:text-2xl font-bold">
                                                82%
                                            </div>
                                            <div className="flex items-center text-xs text-baltra-500">
                                                <TrendingUp className="mr-1 h-3 w-3" />
                                                7% de mejora
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="text-lg sm:text-xl">
                                    Alertas y Notificaciones
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                                <div className="space-y-4">
                                    {alerts.map((alert) => (
                                        <div
                                            key={`${alert.title}-${alert.time}`}
                                            className="flex items-start gap-3 p-3 border rounded-md"
                                        >
                                            <div
                                                className={`mt-0.5 rounded-full p-1 flex-shrink-0 ${
                                                    alert.type === 'warning'
                                                        ? 'bg-yellow-100 text-yellow-600'
                                                        : alert.type === 'error'
                                                          ? 'bg-red-100 text-red-600'
                                                          : 'bg-blue-100 text-blue-600'
                                                }`}
                                            >
                                                <AlertCircle className="h-4 w-4" />
                                            </div>
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <div className="font-medium text-sm sm:text-base">
                                                    {alert.title}
                                                </div>
                                                <div className="text-xs sm:text-sm text-muted-foreground">
                                                    {alert.description}
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs self-start"
                                                    >
                                                        {alert.category}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {alert.time}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </ShowCompany2>
            </div>
        </div>
    );
}

const baltraStatuses = [
    {
        id: '1',
        name: 'Carlos Mendez',
        role: 'Operador',
        status: 'evaluación completada',
        lastContactDate: '15 de mayo, 2024',
    },
    {
        id: '2',
        name: 'Maria Gonzalez',
        role: 'Personal de Almacén',
        status: 'entrevista programada',
        lastContactDate: '14 de mayo, 2024',
    },
    {
        id: '3',
        name: 'Juan Perez',
        role: 'Línea de Producción',
        status: 'entrevista completada',
        lastContactDate: '12 de mayo, 2024',
    },
    {
        id: '4',
        name: 'Ana Rodriguez',
        role: 'Conductor de Entrega',
        status: 'evaluación no aprobada',
        lastContactDate: '10 de mayo, 2024',
    },
    {
        id: '5',
        name: 'Roberto Sanchez',
        role: 'Operador',
        status: 'evaluación no completada',
        lastContactDate: '9 de mayo, 2024',
    },
];

const alerts = [
    {
        type: 'warning',
        title: 'Tasa de Retención en Descenso',
        description:
            'La tasa de retención a 8 semanas para Personal de Almacén ha disminuido un 8% en el último mes.',
        category: 'Incorporación',
        time: 'hace 2 horas',
    },
    {
        type: 'info',
        title: 'Nuevas Preguntas de Evaluación',
        description:
            'El equipo de RRHH ha actualizado las preguntas de evaluación para el rol de Operador.',
        category: 'Evaluación',
        time: 'Ayer',
    },
    {
        type: 'error',
        title: 'Alta Tasa de No Presentación',
        description:
            'La tasa de no presentación a entrevistas ha aumentado al 24% esta semana.',
        category: 'Entrevista',
        time: 'hace 2 días',
    },
];
