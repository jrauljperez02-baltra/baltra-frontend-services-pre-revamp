'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCompany, useCompanyID } from '@/context/CompanyContext';
import {
    useAddExcludedDates,
    useAddInterviewDays,
    useAddInterviewHours,
    useCompanyData,
    useMutationPostCompanyInterviewAddresses,
    useRemoveExcludedDates,
    useRemoveInterviewDays,
    useRemoveInterviewHours,
} from '@/querys/company';
import { Calendar, Clock, MapPin, Plus, Trash2, Video, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useImmer } from 'use-immer';
const mapDaysOfWeek = {
    Monday: 'mon',
    Tuesday: 'tue',
    Wednesday: 'wed',
    Thursday: 'thu',
    Friday: 'fri',
    Saturday: 'sat',
    Sunday: 'sun',
} as const;

const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
] as (keyof typeof mapDaysOfWeek)[];

const timeSlots = [
    '07:00',
    '07:30',
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
    '20:00',
    '20:30',
    '21:00',
];

function capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function InterviewSchedulingDialog() {
    const companyID = useCompanyID();
    const { data: companyData } = useCompanyData(companyID);

    const companyId = useCompanyID();
    const { isAdmin, isGroupOne } = useCompany();
    const canSeeOptions = !isGroupOne || isAdmin;

    const { mutateAsync: addExcludedDates } = useAddExcludedDates(companyID);
    const { mutateAsync: removeExcludedDates } =
        useRemoveExcludedDates(companyID);
    const { mutateAsync: addInterviewDays } = useAddInterviewDays(companyID);
    const { mutateAsync: removeInterviewDays } =
        useRemoveInterviewDays(companyID);
    const { mutateAsync: addInterviewHours } = useAddInterviewHours(companyID);
    const { mutateAsync: removeInterviewHours } =
        useRemoveInterviewHours(companyID);

    const interview_days =
        companyData?.interview_days.map((day) => day.toLowerCase()) ?? [];

    const interview_hours =
        companyData?.interview_hours.map((hour) => {
            const hourDatum = hour
                .toLowerCase()
                .replace('am', '')
                .replace('pm', '');
            if (hourDatum[0] !== '0' && hourDatum[0] !== '1') {
                return `0${hourDatum}`;
            }
            return hourDatum;
        }) ?? [];

    const [physicalAddress, setPhysicalAddress] = useState(
        'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX'
    );

    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
            {canSeeOptions && (
                <DialogTrigger asChild>
                    <Button className="w-full bg-baltra-600 hover:bg-baltra-700 transition text-white py-3 text-base font-medium">
                        <Calendar className="mr-2 h-5 w-5" />
                        Configurar Programación de Entrevistas
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        Configuración de Programación de Entrevistas
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="availability" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="availability">
                            Disponibilidad
                        </TabsTrigger>
                        <TabsTrigger value="location">Ubicación</TabsTrigger>
                        <TabsTrigger value="exclusions">
                            Exclusiones
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="availability" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Días Disponibles
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-7 gap-2">
                                    {daysOfWeek.map((day) => (
                                        <Button
                                            key={day}
                                            variant={
                                                // selectedDays.includes(day) ? "default" : "outline"
                                                interview_days.includes(
                                                    mapDaysOfWeek[day]
                                                )
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            onClick={() => {
                                                const isSelected =
                                                    interview_days.includes(
                                                        mapDaysOfWeek[day]
                                                    );

                                                if (isSelected) {
                                                    removeInterviewDays({
                                                        days: [
                                                            capitalizeFirstLetter(
                                                                mapDaysOfWeek[
                                                                    day
                                                                ]
                                                            ),
                                                        ],
                                                    });
                                                    return;
                                                }
                                                addInterviewDays({
                                                    days: [
                                                        capitalizeFirstLetter(
                                                            mapDaysOfWeek[day]
                                                        ),
                                                    ],
                                                });
                                            }}
                                            className="text-xs"
                                        >
                                            {day.slice(0, 3)}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Horarios Disponibles
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-6 gap-2">
                                    {timeSlots.map((time, i) => (
                                        <Button
                                            key={time}
                                            variant={
                                                interview_hours.includes(time)
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            onClick={() => {
                                                const isSelected =
                                                    interview_hours.includes(
                                                        time
                                                    );
                                                if (isSelected) {
                                                    removeInterviewHours({
                                                        hours: [time],
                                                    });
                                                    return;
                                                }
                                                addInterviewHours({
                                                    hours: [time],
                                                });
                                            }}
                                            className="text-xs"
                                        >
                                            {time}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="location" className="space-y-6">
                        <LocationInterview />
                    </TabsContent>

                    <TabsContent value="exclusions" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Fechas Excluidas</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {companyData?.interview_excluded_dates.map(
                                        (date) => (
                                            <Badge
                                                key={date}
                                                variant="secondary"
                                                className="flex items-center gap-1"
                                            >
                                                {date}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-4 w-4 p-0 hover:bg-red-100"
                                                    onClick={() =>
                                                        removeExcludedDates({
                                                            dates: [date],
                                                        })
                                                    }
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </Badge>
                                        )
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        type="date"
                                        name="excludedDates"
                                        id="excludedDates"
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const e = document.getElementById(
                                                'excludedDates'
                                            ) as HTMLInputElement;

                                            if (!e.value) {
                                                return;
                                            }

                                            addExcludedDates(
                                                {
                                                    dates: [e.value],
                                                },
                                                {
                                                    onSuccess: () => {
                                                        e.value = '';
                                                    },
                                                }
                                            );
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2 pt-4">
                    <Button onClick={() => setIsOpen(false)}>Cerrar</Button>
                    {/* <Button>Save Configuración</Button> */}
                </div>
            </DialogContent>
        </Dialog>
    );
}

const LocationInterview = () => {
    const companyID = useCompanyID();
    const { data: companyData } = useCompanyData(companyID);

    const { mutateAsync: postCompanyInterviewAddresses } =
        useMutationPostCompanyInterviewAddresses(companyID);

    const [physicalAddresses, setPhysicalAddresses] = useImmer<string[]>([]);
    const [initialAddresses, setInitialAddresses] = useState<string[]>([]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        const addresses =
            companyData?.interview_addresses?.map(
                (address) => address.address
            ) ?? [];
        setPhysicalAddresses(addresses);
        setInitialAddresses(addresses);
    }, [companyData]);

    // Debounce function to save addresses only if modified
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const currentAddresses = physicalAddresses.filter(
                (addr) => addr.trim() !== ''
            );
            const hasChanged =
                JSON.stringify(currentAddresses) !==
                JSON.stringify(initialAddresses);

            if (hasChanged && currentAddresses.length > 0) {
                const savePromise = postCompanyInterviewAddresses({
                    interview_addresses: currentAddresses,
                });

                toast.promise(savePromise, {
                    loading: 'Guardando direcciones...',
                    success: () => {
                        setInitialAddresses(currentAddresses);
                        return 'Direcciones guardadas exitosamente';
                    },
                    error: 'Error al guardar las direcciones',
                });
            }
        }, 1000); // 1 second debounce

        return () => clearTimeout(timeoutId);
    }, [physicalAddresses, postCompanyInterviewAddresses, initialAddresses]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Lugares de entrevistas
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {physicalAddresses.map((address, index) => (
                        <div
                            key={`address-${index}`}
                            className="flex items-center gap-2"
                        >
                            <Input
                                value={address}
                                onChange={(e) =>
                                    setPhysicalAddresses((draft) => {
                                        draft[index] = e.target.value;
                                    })
                                }
                                className="text-sm"
                                placeholder="Ingrese una dirección..."
                            />
                            <Button
                                size="icon"
                                onClick={() =>
                                    setPhysicalAddresses((draft) => {
                                        draft.splice(index, 1);
                                    })
                                }
                                variant="ghost"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        onClick={() => {
                            setPhysicalAddresses((draft) => {
                                draft.push('');
                            });
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Dirección
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
