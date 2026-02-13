'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipContentWithPortal,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCompanyID } from '@/context/CompanyContext';
import type { MessageTemplate, QuestionSet, RoleData } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    useMapMessageTemplates,
    useMessageTemplates,
} from '@/querys/message_template';
import {
    useMutationRoleEligibilityCriteria,
    useRolesData,
} from '@/querys/roles';
import { Edit, Mic, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useImmer } from 'use-immer';

interface QuestionEditDialogProps {
    onSave: (question: QuestionSet) => void;
    onChange: (id: number, field: keyof QuestionSet, value: string) => void;
    onCancel: () => void;
    children: React.ReactNode;
    question: QuestionSet;
    hasRoleSpecific?: boolean;
}

export function QuestionEditDialog({
    onSave,
    onChange,
    children,
    question,
    onCancel,
    hasRoleSpecific,
}: QuestionEditDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputType, setInputType] = useState<'text' | 'select'>('text');
    const [isRoleSpecific, setIsRoleSpecific] = useState(false);
    const [selectedRoleID, setSelectedRoleID] = useState<number>(0);
    const companyId = useCompanyID();
    const { data: mapMessageTemplates } = useMapMessageTemplates(companyId);
    const { mutateAsync: changeRoleEligibilityCriteria } =
        useMutationRoleEligibilityCriteria(companyId);

    const { data: roles } = useRolesData(companyId);

    const [rolesMap, setRolesMap] = useImmer<Record<number, RoleData> | null>(
        {}
    );

    useEffect(() => {
        if (roles) {
            setSelectedRoleID(roles[0]?.id ?? 0);
            setRolesMap(
                roles.reduce(
                    (acc, role) => {
                        acc[role.id] = role;
                        return acc;
                    },
                    {} as Record<number, RoleData>
                )
            );
        }
    }, [roles]);

    const selectedRole = rolesMap?.[selectedRoleID];

    const updateEligibilityCriteria = async (
        questionId: number,
        answer: string
    ) => {
        setRolesMap((state) => {
            if (!state) return state;
            if (!selectedRoleID) return state;

            if (!state[selectedRoleID]) return state;

            if (!state[selectedRoleID].eligibility_criteria) {
                state[selectedRoleID].eligibility_criteria = {};
            }

            if (
                state[selectedRoleID].eligibility_criteria?.[questionId] ===
                answer
            ) {
                return state;
            }

            if (!answer || answer.trim() === '') {
                const { [questionId]: removed, ...remainingCriteria } =
                    state[selectedRoleID].eligibility_criteria;

                state[selectedRoleID].eligibility_criteria = remainingCriteria;
                return state;
            }

            state[selectedRoleID].eligibility_criteria[questionId] =
                answer.trim();

            return state;
        });
    };

    const handleSave = async () => {
        if (!roles || !rolesMap) {
            onSave(question);
            setIsOpen(false);
            return;
        }

        // Encontrar solo los roles que realmente cambiaron
        const rolesToUpdate: Array<{
            roleId: number;
            criteria: Record<number, string>;
        }> = [];

        for (const role of roles) {
            const oldCriteria = role.eligibility_criteria || {};
            const newCriteria = rolesMap[role.id]?.eligibility_criteria || {};

            // Comparación más eficiente - solo comparar los criterios de elegibilidad
            const hasChanged =
                JSON.stringify(oldCriteria) !== JSON.stringify(newCriteria);

            if (hasChanged) {
                rolesToUpdate.push({
                    roleId: role.id,
                    criteria: newCriteria,
                });
            }
        }

        // Solo hacer la llamada si hay cambios reales
        if (rolesToUpdate.length > 0) {
            const updatePromises = rolesToUpdate.map(({ roleId, criteria }) =>
                changeRoleEligibilityCriteria({ roleId, criteria })
            );

            toast.promise(Promise.all(updatePromises), {
                loading: 'Guardando criterios de elegibilidad...',
                success: `${rolesToUpdate.length} rol(es) actualizado(s) exitosamente`,
                error: 'Error al guardar roles',
                position: 'top-center',
            });
        }

        onSave(question);
        setIsOpen(false);
    };

    const handleCancel = () => {
        if (roles) {
            setRolesMap(
                roles.reduce(
                    (acc, role) => {
                        acc[role.id] = role;
                        return acc;
                    },
                    {} as Record<number, RoleData>
                )
            );
        }

        onCancel();
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Editar Pregunta {question.position}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 ">
                    <div className="space-y-2">
                        {/* Tipos flexibles: phone_reference, location, name */}
                        {['phone_reference', 'location', 'name'].includes(
                            question.type
                        ) && (
                            <div className="space-y-3">
                                <Label className="text-sm font-medium text-slate-600">
                                    Texto de la Pregunta
                                </Label>
                                <Tabs
                                    value={inputType}
                                    onValueChange={(value: string) =>
                                        setInputType(value as 'text' | 'select')
                                    }
                                >
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="text">
                                            Texto libre
                                        </TabsTrigger>
                                        <TabsTrigger value="select">
                                            Selección
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <div className="mt-4">
                                    {inputType === 'text' ? (
                                        <Textarea
                                            value={question.question}
                                            onChange={(e) =>
                                                onChange(
                                                    question.id,
                                                    'question',
                                                    e.target.value
                                                )
                                            }
                                            disabled={question.is_blocked}
                                            placeholder="Ingresa tu pregunta aquí..."
                                            rows={3}
                                            className="border-slate-300 bg-white/80 backdrop-blur-sm"
                                        />
                                    ) : (
                                        <Select
                                            value={question.question}
                                            onValueChange={(value) =>
                                                onChange(
                                                    question.id,
                                                    'question',
                                                    value
                                                )
                                            }
                                        >
                                            <SelectTrigger className="border-slate-300 bg-white/80 backdrop-blur-sm">
                                                <SelectValue placeholder="Selecciona una plantilla..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-w-2xl">
                                                {Object.entries(
                                                    mapMessageTemplates || {}
                                                ).map(([keyword, template]) => (
                                                    <TooltipProvider
                                                        key={keyword}
                                                    >
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <SelectItem
                                                                    value={
                                                                        keyword
                                                                    }
                                                                    className="max-w-2xl truncate cursor-pointer"
                                                                >
                                                                    {
                                                                        template.text
                                                                    }
                                                                </SelectItem>
                                                            </TooltipTrigger>
                                                            <TooltipContentWithPortal className="max-w-xs z-[9999]">
                                                                <p className="text-sm">
                                                                    {
                                                                        template.text
                                                                    }
                                                                </p>
                                                            </TooltipContentWithPortal>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Solo texto para tipo "text" */}
                        {question.type === 'text' && (
                            <>
                                <Label className="text-sm font-medium text-slate-600">
                                    Texto de la Pregunta
                                </Label>
                                <Textarea
                                    value={question.question}
                                    onChange={(e) =>
                                        onChange(
                                            question.id,
                                            'question',
                                            e.target.value
                                        )
                                    }
                                    disabled={question.is_blocked}
                                    placeholder="Ingresa tu pregunta aquí..."
                                    rows={3}
                                    className="border-slate-300 bg-white/80 backdrop-blur-sm"
                                />
                            </>
                        )}

                        {/* Solo select para tipo "interactive" */}
                        {question.type === 'interactive' && (
                            <>
                                <Label className="text-sm font-medium text-slate-600">
                                    Texto de la Pregunta
                                </Label>
                                <Select
                                    value={question.question}
                                    onValueChange={(value) =>
                                        onChange(question.id, 'question', value)
                                    }
                                >
                                    <SelectTrigger className="border-slate-300 bg-white/80 backdrop-blur-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="max-w-2xl">
                                        {Object.entries(
                                            mapMessageTemplates || {}
                                        ).map(([keyword, template]) => (
                                            <TooltipProvider key={keyword}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <SelectItem
                                                            value={keyword}
                                                            className="max-w-2xl truncate cursor-pointer"
                                                        >
                                                            {template.text}
                                                        </SelectItem>
                                                    </TooltipTrigger>
                                                    <TooltipContentWithPortal className="max-w-xs z-[9999]">
                                                        <p className="text-sm">
                                                            {template.text}
                                                        </p>
                                                    </TooltipContentWithPortal>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-slate-600">
                                Respuesta de Ejemplo
                            </Label>
                            <div
                                className={cn('flex items-center space-x-2', {
                                    hidden: !hasRoleSpecific,
                                })}
                            >
                                <Checkbox
                                    id="role-specific"
                                    checked={isRoleSpecific}
                                    onCheckedChange={(checked) =>
                                        setIsRoleSpecific(checked as boolean)
                                    }
                                />
                                <Label
                                    htmlFor="role-specific"
                                    className="text-sm font-medium text-slate-600 cursor-pointer"
                                >
                                    Específico por rol
                                </Label>
                            </div>
                        </div>

                        {!isRoleSpecific ? (
                            <Textarea
                                value={question.example_answer || ''}
                                onChange={(e) =>
                                    onChange(
                                        question.id,
                                        'example_answer',
                                        e.target.value
                                    )
                                }
                                disabled={question.is_blocked}
                                placeholder="Ingresa una respuesta de ejemplo para guiar a los candidatos..."
                                rows={3}
                                className="border-slate-300 bg-white/80 backdrop-blur-sm"
                            />
                        ) : (
                            <div className="space-y-3">
                                <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg">
                                    <p className="text-xs text-blue-600">
                                        <strong>Nota:</strong> Si un rol no
                                        tiene respuesta específica, se utilizará
                                        la respuesta general.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-600">
                                            Seleccionar Rol
                                        </Label>
                                        <Select
                                            value={`${selectedRoleID}`}
                                            onValueChange={(value) =>
                                                setSelectedRoleID(Number(value))
                                            }
                                        >
                                            <SelectTrigger className="border-slate-300 bg-white/80 backdrop-blur-sm">
                                                <SelectValue placeholder="Selecciona un rol..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles?.map((role) => (
                                                    <SelectItem
                                                        key={role.id}
                                                        value={`${role.id}`}
                                                    >
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-600">
                                            Respuesta General (Fallback)
                                        </Label>
                                        <Textarea
                                            value={
                                                question.example_answer || ''
                                            }
                                            onChange={(e) =>
                                                onChange(
                                                    question.id,
                                                    'example_answer',
                                                    e.target.value
                                                )
                                            }
                                            disabled={question.is_blocked}
                                            placeholder="Respuesta general por defecto..."
                                            rows={2}
                                            className="border-slate-300 bg-white/80 backdrop-blur-sm text-sm"
                                        />
                                    </div>
                                </div>

                                {selectedRole && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-600">
                                            Respuesta Específica para:{' '}
                                            <span className="text-blue-600 font-semibold">
                                                {selectedRole.name}
                                            </span>
                                        </Label>
                                        <Textarea
                                            placeholder={`Respuesta específica para ${selectedRole.name}...`}
                                            value={
                                                selectedRole
                                                    .eligibility_criteria?.[
                                                    question.id
                                                ] || ''
                                            }
                                            onChange={(e) =>
                                                updateEligibilityCriteria(
                                                    question.id,
                                                    e.target.value
                                                )
                                            }
                                            rows={3}
                                            className="border-blue-300 bg-blue-50/30 backdrop-blur-sm focus:border-blue-400 focus:ring-blue-200"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-600">
                            Respuesta que Termina la Entrevista
                        </Label>
                        <div className="p-3 bg-red-50/50 border border-red-200 rounded-lg mb-2">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                <span className="text-xs font-medium text-red-700">
                                    Pregunta de Ruptura de Ciclo
                                </span>
                            </div>
                            <p className="text-xs text-red-600">
                                Si el candidato responde de forma parecida a
                                esto, la entrevista terminará automáticamente
                            </p>
                        </div>
                        <Textarea
                            value={question.end_interview_answer || ''}
                            onChange={(e) =>
                                onChange(
                                    question.id,
                                    'end_interview_answer',
                                    e.target.value
                                )
                            }
                            disabled={question.is_blocked}
                            placeholder="Ingresa la respuesta que debe terminar la entrevista (ej: 'No tengo experiencia', 'No estoy interesado')..."
                            rows={2}
                            className="border-red-300 bg-red-50/30 backdrop-blur-sm focus:border-red-400 focus:ring-red-200"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-600">
                                Tipo de Pregunta
                            </Label>
                            <Select
                                value={question.type}
                                onValueChange={(value) =>
                                    onChange(question.id, 'type', value)
                                }
                            >
                                <SelectTrigger className="border-slate-300 bg-white/80 backdrop-blur-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">
                                        Respuesta de Texto
                                    </SelectItem>
                                    <SelectItem value="interactive">
                                        Pregunta Interactiva
                                    </SelectItem>
                                    <SelectItem value="phone_reference">
                                        Referencia Telefónica
                                    </SelectItem>
                                    <SelectItem value="location">
                                        Referencia de Ubicación
                                    </SelectItem>
                                    <SelectItem value="name">
                                        Referencia de Nombre
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {question.type === 'text_voice' && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-600">
                                    Configuración de Nota de Voz
                                </Label>
                                <div className="flex items-center gap-2 p-2 border rounded-lg bg-blue-50/50">
                                    <Mic className="h-4 w-4 text-blue-600" />
                                    <span className="text-xs text-blue-700">
                                        Los candidatos pueden grabar respuestas
                                        de voz de hasta 2 minutos
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button onClick={handleCancel} variant="outline">
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Cambios
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
