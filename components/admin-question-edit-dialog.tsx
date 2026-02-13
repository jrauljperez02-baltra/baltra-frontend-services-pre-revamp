'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    updateScreeningQuestion,
    type ScreeningQuestion,
} from '@/lib/admin-api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { InfoIcon } from 'lucide-react';
import { MiniEditor } from './mini-editor';

interface AdminQuestionEditDialogProps {
    isOpen: boolean;
    onClose: () => void;
    question: ScreeningQuestion | null;
    queryKey: (string | number | object)[];
}

export function AdminQuestionEditDialog({
    isOpen,
    onClose,
    question,
    queryKey,
}: AdminQuestionEditDialogProps) {
    const queryClient = useQueryClient();

    const [editedText, setEditedText] = useState(() => {
        if (!question) return '';
        // Per user-provided data sample, the editable text is always in `full_question`.
        return question.full_question || '';
    });

    // Effect to re-sync state if the dialog is re-opened for the same question after closing.
    useEffect(() => {
        if (isOpen && question) {
            setEditedText(question.full_question || '');
        }
    }, [isOpen, question]);

    const updateQuestionMutation = useMutation({
        mutationFn: (data: {
            questionId: number;
            payload: Partial<ScreeningQuestion>;
        }) => updateScreeningQuestion(data.questionId, data.payload),
    });

    const handleSave = async () => {
        if (!question) return;

        const originalText = question.full_question || '';
        if (editedText === originalText) {
            toast.info('No se detectaron cambios para guardar.');
            onClose();
            return;
        }

        const payload = { full_question: editedText };

        toast.promise(
            updateQuestionMutation.mutateAsync({
                questionId: question.id,
                payload,
            }),
            {
                loading: 'Guardando cambios...',
                success: () => {
                    queryClient.invalidateQueries({ queryKey });
                    onClose();
                    return 'Pregunta actualizada con éxito';
                },
                error: 'Error al actualizar la pregunta',
            }
        );
    };

    const isEditable = question?.editable ?? true;
    const isInteractive = question?.response_type === 'interactive';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        Editar Pregunta de Screening (ID: {question?.id})
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    {isInteractive ? (
                        <div className="space-y-4 rounded-md border p-4">
                            {!isEditable && (
                                <Alert variant="info">
                                    <InfoIcon className="h-4 w-4" />
                                    <AlertTitle>
                                        Plantilla no editable
                                    </AlertTitle>
                                    <AlertDescription>
                                        Esta es una plantilla global y no puede
                                        ser modificada.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label>
                                    Texto de la Plantilla (lo que ve el usuario)
                                </Label>
                                <MiniEditor
                                    value={editedText}
                                    onChange={setEditedText}
                                    disabled={!isEditable}
                                />
                            </div>
                            {question?.options &&
                                question.options.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>
                                            Opciones (Solo visualización)
                                        </Label>
                                        <div className="space-y-2 rounded-md bg-muted p-3">
                                            {question.options.map((option) => (
                                                <div
                                                    key={option[0]}
                                                    className="text-sm p-2 border-b"
                                                >
                                                    {option[1]}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                        </div>
                    ) : (
                        <div className="space-y-2 p-4 border rounded-lg">
                            <Label htmlFor="full_question">
                                Texto Completo de la Pregunta
                            </Label>
                            <MiniEditor
                                value={editedText}
                                onChange={setEditedText}
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={handleSave}
                        disabled={!isEditable && isInteractive}
                    >
                        Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
