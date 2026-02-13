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
import { CheckCircle2, ThumbsDown, ThumbsUp, XCircle } from 'lucide-react';

interface RecommendationData {
    recommendation: 'hire' | 'not hire';
    screeningScore: number;
    interviewScore: number;
    positivePoints: string[];
    negativePoints: string[];
}

interface RecommendationDialogProps {
    candidateName: string;
    recommendation: 'hire' | 'not hire';
    data: RecommendationData;
}

export function RecommendationDialog({
    candidateName,
    recommendation,
    data,
}: RecommendationDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Badge
                        variant={
                            recommendation === 'hire'
                                ? 'success'
                                : 'destructive'
                        }
                        className="cursor-pointer"
                    >
                        {recommendation === 'hire' ? (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                        ) : (
                            <XCircle className="mr-1 h-3 w-3" />
                        )}
                        {recommendation}
                    </Badge>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        Recomendación para {candidateName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="text-center">
                        <div
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                                recommendation === 'hire'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                            }`}
                        >
                            {recommendation === 'hire' ? (
                                <CheckCircle2 className="h-6 w-6" />
                            ) : (
                                <XCircle className="h-6 w-6" />
                            )}
                            <span className="text-lg font-semibold">
                                {recommendation === 'hire'
                                    ? 'CONTRATAR'
                                    : 'NO CONTRATAR'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                    Puntuación Screening
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {data.screeningScore}%
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {data.screeningScore >= 80
                                        ? 'Excelente'
                                        : data.screeningScore >= 60
                                          ? 'Bueno'
                                          : data.screeningScore >= 40
                                            ? 'Regular'
                                            : 'Deficiente'}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                    Puntuación Interview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {data.interviewScore}%
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {data.interviewScore >= 80
                                        ? 'Excelente'
                                        : data.interviewScore >= 60
                                          ? 'Bueno'
                                          : data.interviewScore >= 40
                                            ? 'Regular'
                                            : 'Deficiente'}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <ThumbsUp className="h-4 w-4 text-green-600" />
                                    Puntos Positivos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {data.positivePoints.map((point, index) => (
                                        <li
                                            key={index}
                                            className="text-sm flex items-start gap-2"
                                        >
                                            <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <ThumbsDown className="h-4 w-4 text-red-600" />
                                    Puntos Negativos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {data.negativePoints.map((point, index) => (
                                        <li
                                            key={index}
                                            className="text-sm flex items-start gap-2"
                                        >
                                            <XCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline">Cerrar</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
