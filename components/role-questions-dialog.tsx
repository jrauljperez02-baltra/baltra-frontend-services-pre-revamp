'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useCompanyID } from '@/context/CompanyContext';
import type { QuestionSet, RoleData } from '@/lib/api';
import {
    useMapMessageTemplates,
    useMessageTemplates,
} from '@/querys/message_template';
import {
    useMutationRoleEligibilityCriteria,
    useRolesData,
} from '@/querys/roles';
import { useGeneralSetData, useQuestionsSetsData } from '@/querys/sets';
import { Edit3, FileText, MessageSquare, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useImmer } from 'use-immer';

interface RoleQuestionsDialogProps {
    roleId: number;
    roleName: string;
    children: React.ReactNode;
}

export function RoleQuestionsDialog({
    roleId,
    roleName,
    children,
}: RoleQuestionsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const companyId = useCompanyID();
    const { data: roles } = useRolesData(companyId);
    const { mutateAsync: changeRoleEligibilityCriteria } =
        useMutationRoleEligibilityCriteria(companyId);

    const { data: messageTemplates } = useMapMessageTemplates(companyId);

    // Encontrar el rol actual y obtener su set_id
    const currentRole = roles?.find((role) => role.id === roleId);

    const { data: generalSet } = useGeneralSetData(companyId);

    const setId = generalSet?.id;

    const { data: questions } = useQuestionsSetsData(companyId, setId ?? 0);

    const [eligibilityCriteria, setEligibilityCriteria] = useImmer<
        Record<number, string>
    >({});

    useEffect(() => {
        if (currentRole?.eligibility_criteria) {
            setEligibilityCriteria(currentRole.eligibility_criteria);
        } else {
            setEligibilityCriteria({});
        }
    }, [currentRole, setEligibilityCriteria]);

    const updateCriteria = (questionId: number, answer: string) => {
        setEligibilityCriteria((draft) => {
            if (!answer || answer.trim() === '') {
                delete draft[questionId];
            } else {
                draft[questionId] = answer;
            }
        });
    };

    const handleSave = async () => {
        try {
            await changeRoleEligibilityCriteria({
                roleId: roleId,
                criteria: eligibilityCriteria,
            });

            toast.success(`Criterios de ${roleName} guardados exitosamente`);
            setIsOpen(false);
        } catch (error) {
            toast.error('Error al guardar los criterios');
            console.error('Error saving criteria:', error);
        }
    };

    const handleCancel = () => {
        // Restaurar los criterios originales
        if (currentRole?.eligibility_criteria) {
            setEligibilityCriteria(currentRole.eligibility_criteria);
        } else {
            setEligibilityCriteria({});
        }
        setIsOpen(false);
    };

    const hasChanges = useMemo(() => {
        const original = currentRole?.eligibility_criteria || {};

        // Obtener todas las claves únicas de ambos objetos
        const allKeys = new Set([
            ...Object.keys(original).map((k) => Number(k)),
            ...Object.keys(eligibilityCriteria).map((k) => Number(k)),
        ]);

        // Verificar si alguna clave tiene un valor diferente
        for (const keyNum of allKeys) {
            const originalValue = original[keyNum] || '';
            const currentValue = eligibilityCriteria[keyNum] || '';

            if (originalValue !== currentValue) {
                return true;
            }
        }

        return false;
    }, [currentRole?.eligibility_criteria, eligibilityCriteria]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        Preguntas y Criterios - {roleName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6  max-h-[70vh] overflow-y-auto">
                    {questions?.map((question) => (
                        <div
                            key={question.id}
                            className="border border-slate-200 rounded-lg p-4 bg-slate-50/50"
                        >
                            <div className="space-y-4">
                                {/* Header de la pregunta */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge
                                                variant="outline"
                                                className="text-xs font-medium"
                                            >
                                                Pregunta {question.position}
                                            </Badge>
                                            <Badge
                                                variant="secondary"
                                                className="text-xs capitalize"
                                            >
                                                {question.type}
                                            </Badge>
                                        </div>
                                        <h4 className="font-medium text-slate-800 mb-2">
                                            {messageTemplates?.[
                                                question.question
                                            ]?.text ||
                                                question.question ||
                                                'Pregunta sin título'}
                                        </h4>
                                    </div>
                                </div>

                                {/* Respuesta general (ejemplo) */}
                                {question.example_answer && (
                                    <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3">
                                        <Label className="text-xs font-medium text-blue-700 mb-1 block">
                                            <FileText className="h-3 w-3 inline mr-1" />
                                            Respuesta General
                                        </Label>
                                        <p className="text-sm text-blue-800">
                                            {question.example_answer}
                                        </p>
                                    </div>
                                )}

                                {/* Respuesta específica para este rol */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                        <Edit3 className="h-3 w-3" />
                                        Respuesta Específica para {roleName}
                                    </Label>
                                    <Textarea
                                        placeholder={`Criterio específico para ${roleName}... (Opcional: si se deja vacío, se usará la respuesta general)`}
                                        value={
                                            eligibilityCriteria[question.id] ||
                                            ''
                                        }
                                        onChange={(e) =>
                                            updateCriteria(
                                                question.id,
                                                e.target.value
                                            )
                                        }
                                        rows={3}
                                        className="border-green-300 bg-green-50/30 backdrop-blur-sm focus:border-green-400 focus:ring-green-200"
                                    />
                                </div>

                                {/* Respuesta que termina entrevista */}
                                {question.end_interview_answer && (
                                    <div className="bg-red-50/50 border border-red-200 rounded-lg p-3">
                                        <Label className="text-xs font-medium text-red-700 mb-1 block">
                                            ⚠️ Respuesta que Termina la
                                            Entrevista
                                        </Label>
                                        <p className="text-sm text-red-800">
                                            {question.end_interview_answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {questions?.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No hay preguntas disponibles para este rol</p>
                        </div>
                    )}
                </div>

                {/* Footer con botones */}
                <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-slate-600">
                        {questions?.length || 0} pregunta(s) disponible(s)
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={handleCancel} variant="outline">
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges}
                            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Criterios
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
