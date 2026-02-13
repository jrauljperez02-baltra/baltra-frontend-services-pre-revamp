'use client';

import type React from 'react';

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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    FileText,
    MessageSquare,
    Save,
    Star,
    ThumbsDown,
    ThumbsUp,
} from 'lucide-react';
import { useState } from 'react';

interface InterviewSummaryProps {
    candidate: {
        name: string;
        role: string;
        interviewDate: string;
        interviewer: string;
    };
    summary?: {
        keyCapabilities: string[];
        overallRating: number;
        notes: string;
        recommendation: 'hire' | 'not_hire' | 'pending';
    };
    children: React.ReactNode;
}

export function InterviewSummaryDialog({
    candidate,
    summary,
    children,
}: InterviewSummaryProps) {
    const [notes, setNotes] = useState(summary?.notes || '');
    const [recommendation, setRecommendation] = useState(
        summary?.recommendation || 'pending'
    );
    const [isEditing, setIsEditing] = useState(false);

    const defaultCapabilities = [
        'Strong communication skills',
        'Relevant technical experience',
        'Good problem-solving abilities',
        'Team collaboration',
        'Adaptability to change',
    ];

    const capabilities = summary?.keyCapabilities || defaultCapabilities;

    const handleSave = () => {
        console.log('Saving interview summary:', { notes, recommendation });
        setIsEditing(false);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Resumen de Entrevista - {candidate.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Interview Details */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">
                                Detalles de la Entrevista
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-600">Rol:</span>
                                <div className="font-medium">
                                    {candidate.role}
                                </div>
                            </div>
                            <div>
                                <span className="text-slate-600">Fecha:</span>
                                <div className="font-medium">
                                    {candidate.interviewDate}
                                </div>
                            </div>
                            <div>
                                <span className="text-slate-600">
                                    Entrevistador:
                                </span>
                                <div className="font-medium">
                                    {candidate.interviewer}
                                </div>
                            </div>
                            <div>
                                <span className="text-slate-600">
                                    Calificación General:
                                </span>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`h-4 w-4 ${
                                                star <=
                                                (summary?.overallRating || 4)
                                                    ? 'text-yellow-400 fill-current'
                                                    : 'text-slate-300'
                                            }`}
                                        />
                                    ))}
                                    <span className="ml-1 text-sm font-medium">
                                        {summary?.overallRating || 4}/5
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Key Capabilities */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">
                                Capacidades Clave
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {capabilities.map((capability, index) => (
                                    <Badge
                                        key={index}
                                        variant="outline"
                                        className="bg-blue-50 text-blue-700 border-blue-200"
                                    >
                                        {capability}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Interview Notes */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Notas de Entrevista
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditing(!isEditing)}
                                >
                                    {isEditing ? 'Cancelar' : 'Editar'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notas</Label>
                                    <Textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) =>
                                            setNotes(e.target.value)
                                        }
                                        placeholder="Agregar observaciones detalladas de la entrevista, fortalezas, áreas de preocupación..."
                                        rows={6}
                                        className="resize-none"
                                    />
                                </div>
                            ) : (
                                <div className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">
                                    {notes ||
                                        'No hay notas disponibles. Haz clic en Editar para agregar observaciones de la entrevista.'}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recommendation */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">
                                Recomendación de Contratación
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Select
                                    value={recommendation}
                                    onValueChange={(
                                        value: 'hire' | 'not_hire' | 'pending'
                                    ) => setRecommendation(value)}
                                    disabled={!isEditing}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Seleccionar recomendación" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hire">
                                            <div className="flex items-center gap-2">
                                                <ThumbsUp className="h-4 w-4 text-green-600" />
                                                Recomendar Contratar
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="not_hire">
                                            <div className="flex items-center gap-2">
                                                <ThumbsDown className="h-4 w-4 text-red-600" />
                                                No Recomendar
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="pending">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4 text-yellow-600" />
                                                Decisión Pendiente
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="text-center">
                                    <Badge
                                        className={`${
                                            recommendation === 'hire'
                                                ? 'bg-green-100 text-green-800 border-green-200'
                                                : recommendation === 'not_hire'
                                                  ? 'bg-red-100 text-red-800 border-red-200'
                                                  : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                        }`}
                                    >
                                        {recommendation === 'hire'
                                            ? '✓ Recomendados para aceptar'
                                            : recommendation === 'not_hire'
                                              ? '✗ No Recomendados'
                                              : '⏳ Decisión pendiente'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline">Cerrar</Button>
                        {isEditing && (
                            <Button onClick={handleSave}>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar Cambios
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
