'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';

const interviewSchedule = [
    {
        date: '2024-05-20',
        interviews: [
            { time: '09:00', candidate: 'Carlos Mendez', role: 'Operator' },
            {
                time: '11:00',
                candidate: 'Maria Gonzalez',
                role: 'Warehouse Staff',
            },
            { time: '15:00', candidate: 'Juan Perez', role: 'Production Line' },
        ],
    },
    {
        date: '2024-05-21',
        interviews: [
            {
                time: '10:00',
                candidate: 'Ana Rodriguez',
                role: 'Delivery Driver',
            },
            { time: '14:00', candidate: 'Roberto Sanchez', role: 'Operator' },
        ],
    },
    {
        date: '2024-05-22',
        interviews: [
            {
                time: '09:30',
                candidate: 'Luis Martinez',
                role: 'Warehouse Staff',
            },
            {
                time: '16:00',
                candidate: 'Sofia Lopez',
                role: 'Production Line',
            },
        ],
    },
];

export function InterviewCalendar() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Calendario de Entrevistas
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {interviewSchedule.map((day) => (
                        <div key={day.date} className="border rounded-lg p-4">
                            <div className="font-medium text-sm text-muted-foreground mb-3">
                                {new Date(day.date).toLocaleDateString(
                                    'en-US',
                                    {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    }
                                )}
                            </div>
                            <div className="space-y-2">
                                {day.interviews.map((interview, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-muted/50 rounded"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 text-sm">
                                                <Clock className="h-3 w-3" />
                                                {interview.time}
                                            </div>
                                            <div className="font-medium">
                                                {interview.candidate}
                                            </div>
                                        </div>
                                        <Badge variant="outline">
                                            {interview.role}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
