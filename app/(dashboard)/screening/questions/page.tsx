'use client';

import { DashboardTracker } from '@/components/dashboard-tracker';
import { PageHeader } from '@/components/page-header';
import { QuestionEditDialog } from '@/components/question-edit-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCompanyID } from '@/context/CompanyContext';
import {
    type MessageTemplate,
    type QuestionSet,
    deleteQuestionSets,
    postQuestionSets,
    putQuestionSets,
} from '@/lib/api';
import {
    useMapMessageTemplates,
    useMessageTemplates,
} from '@/querys/message_template';
import { useRolesData } from '@/querys/roles';
import { useGeneralSetData, useQuestionsSetsData } from '@/querys/sets';
import {
    ArrowDown,
    ArrowUp,
    Edit,
    Globe,
    Plus,
    Sparkles,
    Trash2,
    Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useImmer } from 'use-immer';

export default function QuestionsPage() {
    const companyId = useCompanyID();
    const router = useRouter();
    const { data: roles } = useRolesData(companyId);
    const { data: generalSet } = useGeneralSetData(companyId);

    const [activeTab, setActiveTab] = useState<'general' | 'roles'>('general');
    const [selectedSet, setSelectedSet] = useState<string>(
        roles?.[0]?.set_id?.toString() ?? ''
    );

    const { data: mapMessageTemplates } = useMapMessageTemplates(companyId);

    // Determine which set ID to use based on active tab
    const currentSetId = useMemo(
        () =>
            activeTab === 'general'
                ? (generalSet?.id?.toString() ?? '')
                : selectedSet,
        [activeTab, generalSet, selectedSet]
    );

    useEffect(() => {
        if (selectedSet || !roles?.length) return;
        setSelectedSet(roles[0]?.set_id.toString() ?? '');
    }, [roles, selectedSet]);

    const { data: questionsSetsData, refetch } = useQuestionsSetsData(
        companyId,
        currentSetId ? Number(currentSetId) : 0
    );

    const [questions, setQuestions] = useImmer<QuestionSet[] | null>(null);

    useEffect(() => {
        setQuestions(questionsSetsData ?? null);
    }, [questionsSetsData, setQuestions]);

    const addQuestion = async () => {
        if (!currentSetId) return;
        toast.promise(
            postQuestionSets(companyId, Number(currentSetId), {
                question: '',
                type: 'text',
                end_interview_answer: '',
                set_id: Number(currentSetId),
                example_answer: '',
                position: (questions?.length ?? 0) + 1,
                metadata: null,
            }),
            {
                loading: 'Guardando pregunta...',
                success: () => {
                    return 'Pregunta guardada exitosamente';
                },
                error: (error: Error) => {
                    return `Error al guardar pregunta: ${error.message}`;
                },
                finally: () => {
                    refetch();
                },
                position: 'top-center',
            }
        );
    };

    const removeQuestion = async (id: number) => {
        if (!currentSetId) return;
        toast.promise(deleteQuestionSets(companyId, Number(currentSetId), id), {
            loading: 'Eliminando pregunta...',
            success: () => {
                setQuestions((state) => {
                    if (!state) return state;
                    const newQuestions = state
                        .filter((q) => q.id !== id)
                        .sort((a, b) => a.position - b.position)
                        .map((q, index) => ({ ...q, position: index + 1 }));

                    SaveEditing(newQuestions);
                    return newQuestions;
                });
                return 'Pregunta eliminada exitosamente';
            },
            error: (error: Error) => {
                return `Error al eliminar pregunta: ${error.message}`;
            },
            finally: () => {
                refetch();
            },
            position: 'top-center',
        });
    };

    const SaveEditing = (_questions: QuestionSet[] | null = questions) => {
        if (!_questions || !currentSetId) return;
        toast.promise(
            putQuestionSets(companyId, Number(currentSetId), _questions),
            {
                loading: 'Guardando preguntas...',
                success: () => {
                    return 'Preguntas guardadas exitosamente';
                },
                error: (error: Error) => {
                    return `Error al guardar preguntas: ${error.message}`;
                },
                finally: () => {
                    refetch();
                },
                position: 'top-center',
            }
        );
    };

    const handleCancelEditedQuestion = () => {
        setQuestions(questionsSetsData ?? null);
    };

    const updateQuestion = (
        id: number,
        field: keyof QuestionSet,
        value: string
    ) => {
        setQuestions((state) => {
            if (!state) return state;
            return state.map((q) =>
                q.id === id ? { ...q, [field]: value } : q
            );
        });
    };

    const updatePosition = (id: number, position: number) => {
        setQuestions((state) => {
            if (!state) return state;

            const question = state.find((q) => q.id === id);
            if (!question) return state;

            const newQuestions = state
                .filter((q) => q.id !== id)
                .sort((a, b) => a.position - b.position);

            newQuestions.splice(position - 1, 0, question);

            const updatedQuestions = newQuestions.map((q, index) => ({
                ...q,
                position: index + 1,
            }));

            // Guardar los cambios automáticamente
            SaveEditing(updatedQuestions);

            return updatedQuestions;
        });
    };

    const getCurrentSetName = () => {
        if (activeTab === 'general') {
            return 'Preguntas Generales';
        }
        const role = roles?.find((r) => r.set_id.toString() === selectedSet);
        return role?.name ?? 'Rol Seleccionado';
    };

    const handleSaveEditedQuestion = (updatedQuestion: QuestionSet) => {
        updateQuestion(
            updatedQuestion.id,
            'question',
            updatedQuestion.question
        );
        updateQuestion(updatedQuestion.id, 'type', updatedQuestion.type);
        updateQuestion(
            updatedQuestion.id,
            'example_answer',
            updatedQuestion.example_answer || ''
        );
        updateQuestion(
            updatedQuestion.id,
            'end_interview_answer',
            updatedQuestion.end_interview_answer || ''
        );

        SaveEditing();
    };

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardTracker pageName="Questions" />
            <PageHeader
                title="Configuración de Preguntas"
                description="Gestiona y configura las preguntas de evaluación para candidatos"
                action={{
                    label: 'Volver',
                    onClick: () => router.push('/screening'),
                    icon: <ArrowUp />,
                }}
            />

            <div className="p-6 space-y-6">
                {/* Tab Selection */}
                <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-200/60 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Sparkles className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800">
                                Configuración Avanzada de Preguntas
                            </h2>
                            <p className="text-sm text-slate-600 mt-1">
                                Gestiona las preguntas de evaluación por tipo y
                                rol
                            </p>
                        </div>
                    </div>

                    <Tabs
                        value={activeTab}
                        onValueChange={(value) =>
                            setActiveTab(value as 'general' | 'roles')
                        }
                    >
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger
                                value="general"
                                className="flex items-center gap-2"
                            >
                                <Globe className="h-4 w-4" />
                                Preguntas Generales
                            </TabsTrigger>
                            <TabsTrigger
                                value="roles"
                                className="flex items-center gap-2"
                            >
                                <Users className="h-4 w-4" />
                                Preguntas por Rol
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="mt-0">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="text-sm font-semibold text-slate-700 mb-2">
                                        Configurar Preguntas Generales
                                    </div>
                                    <div className="text-xs text-slate-600">
                                        Estas preguntas se aplicarán a todos los
                                        candidatos independientemente del rol
                                    </div>
                                </div>
                                {generalSet && (
                                    <div className="text-right">
                                        <div className="text-sm text-slate-600">
                                            Total de Preguntas
                                        </div>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {questions?.length ?? 0}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="roles" className="mt-0">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <Label
                                        htmlFor="role-select"
                                        className="text-sm font-semibold text-slate-700"
                                    >
                                        Seleccionar Rol para Configurar
                                    </Label>
                                    <Select
                                        value={selectedSet}
                                        onValueChange={setSelectedSet}
                                    >
                                        <SelectTrigger className="mt-2 border-slate-300 bg-white/80 backdrop-blur-sm">
                                            <SelectValue placeholder="Elige un rol para editar las preguntas de selección" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles?.map((role) => (
                                                <SelectItem
                                                    key={`set-${role.id}`}
                                                    value={role.set_id?.toString()}
                                                >
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {selectedSet && (
                                    <div className="text-right">
                                        <div className="text-sm text-slate-600">
                                            Total de Preguntas
                                        </div>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {questions?.length ?? 0}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Questions Content */}
                {currentSetId && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-800">
                                {getCurrentSetName()}
                            </h3>
                            <Button
                                onClick={addQuestion}
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar Pregunta
                            </Button>
                        </div>

                        {/* Questions Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {questions?.map((question) => (
                                <QuestionEditDialog
                                    key={question.id}
                                    question={question}
                                    onSave={handleSaveEditedQuestion}
                                    onChange={updateQuestion}
                                    onCancel={handleCancelEditedQuestion}
                                    hasRoleSpecific={activeTab === 'general'}
                                >
                                    <Card className="border-2 transition-all duration-200 hover:shadow-lg bg-white/80 border-slate-200 cursor-pointer hover:border-blue-300">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        Pregunta{' '}
                                                        {question.position}
                                                    </Badge>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        {question.type.replace(
                                                            '_',
                                                            ' '
                                                        )}
                                                    </Badge>
                                                </div>
                                                <Edit className="h-4 w-4 text-slate-400" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-slate-800 line-clamp-3">
                                                    {mapMessageTemplates[
                                                        question.question
                                                    ]?.text ||
                                                        question.question ||
                                                        'Pregunta sin título'}
                                                </p>
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <span>
                                                        Tipo: {question.type}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        {question.position >
                                                            1 && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 w-6 p-0"
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    updatePosition(
                                                                        question.id,
                                                                        question.position -
                                                                            1
                                                                    );
                                                                }}
                                                            >
                                                                <ArrowUp className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                        {question.position <
                                                            (questions?.length ??
                                                                0) && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 w-6 p-0"
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    updatePosition(
                                                                        question.id,
                                                                        question.position +
                                                                            1
                                                                    );
                                                                }}
                                                            >
                                                                <ArrowDown className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeQuestion(
                                                                    question.id
                                                                );
                                                            }}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </QuestionEditDialog>
                            ))}
                        </div>

                        {questions?.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-slate-400 text-lg mb-2">
                                    Aún no hay preguntas
                                </div>
                                <div className="text-slate-500 text-sm">
                                    Haz clic en &quot;Agregar Pregunta&quot;
                                    para crear tu primera pregunta de selección
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* No set available message */}
                {!currentSetId && (
                    <div className="text-center py-12">
                        <div className="text-slate-400 text-lg mb-2">
                            {activeTab === 'general'
                                ? 'No se encontró un conjunto general'
                                : 'Selecciona un rol para empezar'}
                        </div>
                        <div className="text-slate-500 text-sm">
                            {activeTab === 'general'
                                ? 'Contacta al administrador para configurar el conjunto general'
                                : 'Elige un rol del menú desplegable para configurar sus preguntas'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
