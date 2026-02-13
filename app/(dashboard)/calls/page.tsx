'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCompanyID } from '../../../context/CompanyContext';
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from '../../../components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Download, Phone, CalendarRange } from 'lucide-react';
import { PhoneCallsTable } from '@/components/phone-calls-table';
import { PhoneCallStatsCards } from '@/components/phone-call-stats-cards';
import { useDebounce } from '@/hooks/use-debounce';
import { PhoneInterviewQuestionsDialog } from '@/components/phone-interview-questions-dialog';
import { type DateRange } from 'react-day-picker';

const MAX_RANGE_DAYS = 62;

const buildDefaultRange = (): DateRange => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return { from: start, to: today };
};

const toISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const normalizeRange = (range: DateRange | undefined): DateRange => {
    const fallback = buildDefaultRange();
    if (!range?.from) return fallback;

    const today = new Date();
    const start = new Date(
        range.from.getFullYear(),
        range.from.getMonth(),
        range.from.getDate()
    );
    const rawEnd = range.to
        ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate())
        : start;
    const end = rawEnd > today ? today : rawEnd;

    const dayDiff =
        Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (dayDiff > MAX_RANGE_DAYS) {
        const limitedEnd = new Date(start);
        limitedEnd.setDate(limitedEnd.getDate() + (MAX_RANGE_DAYS - 1));
        return { from: start, to: limitedEnd };
    }

    return { from: start, to: end };
};

const formatDisplayRange = (range: DateRange) => {
    const fmt = new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    const from = range.from ?? new Date();
    const to = range.to ?? range.from ?? new Date();
    return `${fmt.format(from)} – ${fmt.format(to)}`;
};

export default function CallsPage() {
    const companyId = useCompanyID();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('invitados');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [selectedRange, setSelectedRange] = useState<DateRange>(() =>
        buildDefaultRange()
    );

    const effectiveRange = useMemo(
        () => normalizeRange(selectedRange),
        [selectedRange]
    );

    const dateFilters = useMemo(() => {
        const from = effectiveRange.from ?? buildDefaultRange().from!;
        const to = effectiveRange.to ?? from;
        return {
            startDate: toISODate(from),
            endDate: toISODate(to),
        };
    }, [effectiveRange]);

    const rangeLabel = useMemo(
        () => formatDisplayRange(effectiveRange),
        [effectiveRange]
    );

    // Only allow business_unit_id = 2 or 179 to access this feature
    if (companyId !== 2 && companyId !== 179) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Card className="w-full max-w-md">
                        <CardContent className="p-6 text-center">
                            <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                Función No Disponible
                            </h3>
                            <p className="text-muted-foreground">
                                Las entrevistas telefónicas con IA están en
                                desarrollo.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl tracking-tight">
                        Resultados de Entrevistas IA
                    </h2>
                    <p className="text-muted-foreground">
                        Gestiona y revisa los candidatos evaluados por el
                        sistema de entrevistas automatizadas
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="justify-start min-w-[260px]"
                            >
                                <CalendarRange className="h-4 w-4 mr-2" />
                                <span className="truncate">{rangeLabel}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="end">
                            <div className="space-y-3">
                                <Calendar
                                    mode="range"
                                    numberOfMonths={2}
                                    selected={effectiveRange}
                                    onSelect={(range) =>
                                        setSelectedRange(normalizeRange(range))
                                    }
                                    disabled={(date) => date > new Date()}
                                />
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Máximo 2 meses por consulta.</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setSelectedRange(buildDefaultRange())
                                        }
                                    >
                                        Últimos 2 meses
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Datos
                    </Button>
                    <PhoneInterviewQuestionsDialog />
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Funnel de llamadas</h3>
                    <PhoneCallStatsCards
                        startDate={dateFilters.startDate}
                        endDate={dateFilters.endDate}
                    />
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">Candidatos</h3>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="flex items-center justify-between">
                            <TabsList className="flex flex-wrap">
                                <TabsTrigger value="invitados">
                                    Invitados a llamada
                                </TabsTrigger>
                                <TabsTrigger value="incompleto">
                                    Incompleto
                                </TabsTrigger>
                                <TabsTrigger value="rechazado">
                                    Rechazado
                                </TabsTrigger>
                                <TabsTrigger value="exitoso">
                                    Exitoso
                                </TabsTrigger>
                                <TabsTrigger value="agendados_e2">
                                    Agendados E2
                                </TabsTrigger>
                                <TabsTrigger value="todos">
                                    Todos los candidatos
                                </TabsTrigger>
                            </TabsList>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="justify-start min-w-[220px]"
                                        >
                                            <CalendarRange className="h-4 w-4 mr-2" />
                                            <span className="truncate text-sm">
                                                {rangeLabel}
                                            </span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-3" align="end">
                                        <div className="space-y-3">
                                            <Calendar
                                                mode="range"
                                                numberOfMonths={2}
                                                selected={effectiveRange}
                                                onSelect={(range) =>
                                                    setSelectedRange(normalizeRange(range))
                                                }
                                                disabled={(date) => date > new Date()}
                                            />
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>Hasta 2 meses por rango.</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setSelectedRange(
                                                            buildDefaultRange()
                                                        )
                                                    }
                                                >
                                                    Resetear
                                                </Button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Buscar por nombre, puesto o empresa..."
                                        className="w-[200px] pl-8 md:w-[300px]"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <TabsContent value="invitados" className="mt-4">
                            <PhoneCallsTable
                                bucket="invitados"
                                searchTerm={debouncedSearchTerm}
                                dateRange={dateFilters}
                            />
                        </TabsContent>
                        <TabsContent value="incompleto" className="mt-4">
                            <PhoneCallsTable
                                bucket="incompleto"
                                searchTerm={debouncedSearchTerm}
                                dateRange={dateFilters}
                            />
                        </TabsContent>
                        <TabsContent value="rechazado" className="mt-4">
                            <PhoneCallsTable
                                bucket="rechazado"
                                searchTerm={debouncedSearchTerm}
                                dateRange={dateFilters}
                            />
                        </TabsContent>
                        <TabsContent value="exitoso" className="mt-4">
                            <PhoneCallsTable
                                bucket="exitoso"
                                searchTerm={debouncedSearchTerm}
                                dateRange={dateFilters}
                            />
                        </TabsContent>
                        <TabsContent value="agendados_e2" className="mt-4">
                            <PhoneCallsTable
                                bucket="agendados_e2"
                                searchTerm={debouncedSearchTerm}
                                dateRange={dateFilters}
                            />
                        </TabsContent>
                        <TabsContent value="todos" className="mt-4">
                            <PhoneCallsTable
                                bucket="todos"
                                searchTerm={debouncedSearchTerm}
                                dateRange={dateFilters}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
