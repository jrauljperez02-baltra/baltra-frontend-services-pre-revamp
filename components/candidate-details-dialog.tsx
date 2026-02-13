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
import { CheckCircle2, MapPin, Star, XCircle } from 'lucide-react';

interface CandidateAnswer {
    question: string;
    answer: string;
    score: number;
}

interface CandidateDetailsProps {
    candidate: {
        id: string;
        name: string;
        role: string;
        recommendation: string;
        score: number;
        location: string;
        answers: CandidateAnswer[];
        gradingReason: string;
    };
    children: React.ReactNode;
}

export function CandidateDetailsDialog({
    candidate,
    children,
}: CandidateDetailsProps) {
    // Safety check to prevent undefined errors
    if (!candidate) {
        return <>{children}</>;
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getRecommendationColor = (recommendation: string) => {
        if (
            recommendation === 'Muy Recomendado' ||
            recommendation === 'Recomendado'
        ) {
            return 'bg-green-100 text-green-800 border-green-200';
        }
        if (recommendation === 'Discarded') {
            return 'bg-red-100 text-red-800 border-red-200';
        }
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Detalles del Candidato - {candidate.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                    Puntuación General
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={`text-2xl font-bold ${getScoreColor(candidate.score)}`}
                                >
                                    {candidate.score}%
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                    Recomendación
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Badge
                                    className={getRecommendationColor(
                                        candidate.recommendation
                                    )}
                                >
                                    {candidate.recommendation}
                                </Badge>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                    Ubicación
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        {candidate.location}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Screening Answers */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Respuestas de Preselección</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {candidate.answers.map((answer, index) => (
                                    <div
                                        key={index}
                                        className="border rounded-lg p-4 space-y-2"
                                    >
                                        <div className="flex items-start justify-between">
                                            <h4 className="font-medium text-sm">
                                                {answer.question}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <Star
                                                    className={`h-4 w-4 ${getScoreColor(answer.score)}`}
                                                />
                                                <span
                                                    className={`text-sm font-medium ${getScoreColor(answer.score)}`}
                                                >
                                                    {answer.score}%
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {answer.answer}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Grading Reason */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {candidate.recommendation === 'Discarded' ? (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                ) : (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                )}
                                Análisis de Calificación
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {candidate.gradingReason}
                            </p>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline">Cerrar</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
