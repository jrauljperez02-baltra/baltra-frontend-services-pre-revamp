'use client';

import type React from 'react';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Save } from 'lucide-react';

interface InterviewCommentsProps {
    candidateName: string;
    existingComments?: string;
    children: React.ReactNode;
}

export function InterviewCommentsDialog({
    candidateName,
    existingComments = '',
    children,
}: InterviewCommentsProps) {
    const [comments, setComments] = useState(existingComments);

    const handleSave = () => {
        // Handle saving comments
        console.log('Saving comments for', candidateName, ':', comments);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Comentarios de la Entrevista - {candidateName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="comments">
                            Notas y Comentarios de la Entrevista
                        </Label>
                        <Textarea
                            id="comments"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Agrega tus observaciones de la entrevista, fortalezas del candidato, áreas de preocupación y evaluación general..."
                            rows={8}
                            className="resize-none"
                        />
                    </div>

                    <div className="text-sm text-muted-foreground">
                        <p>Incluye detalles sobre:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>
                                Habilidades de comunicación y profesionalismo
                            </li>
                            <li>Conocimiento técnico y experiencia</li>
                            <li>Compatibilidad cultural y actitud</li>
                            <li>
                                Ejemplos específicos o respuestas que destacaron
                            </li>
                            <li>Cualquier preocupación o señal de alerta</li>
                        </ul>
                    </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline">Cancelar</Button>
                    <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Comentarios
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
