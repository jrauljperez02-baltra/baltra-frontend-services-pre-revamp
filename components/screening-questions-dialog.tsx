'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Settings, Plus, Trash2 } from 'lucide-react';

interface ScreeningQuestion {
    id: string;
    question: string;
    type: 'text' | 'multiple_choice' | 'yes_no';
    options?: string[];
}

interface Role {
    id: string;
    name: string;
    questions: ScreeningQuestion[];
}

const roles: Role[] = [
    {
        id: 'operator',
        name: 'Operador',
        questions: [
            {
                id: '1',
                question:
                    '¿Tienes experiencia previa trabajando en líneas de producción?',
                type: 'yes_no',
            },
            {
                id: '2',
                question:
                    '¿Puedes trabajar en turnos rotativos incluyendo noches y fines de semana?',
                type: 'yes_no',
            },
            {
                id: '3',
                question: '¿Cuál es tu nivel de educación completado?',
                type: 'multiple_choice',
                options: [
                    'Primaria',
                    'Secundaria',
                    'Preparatoria',
                    'Universidad',
                ],
            },
            {
                id: '4',
                question: 'Describe tu experiencia con maquinaria industrial',
                type: 'text',
            },
            {
                id: '5',
                question:
                    '¿Tienes disponibilidad para trabajar horas extras cuando sea necesario?',
                type: 'yes_no',
            },
        ],
    },
    {
        id: 'warehouse',
        name: 'Personal de Almacén',
        questions: [
            {
                id: '1',
                question: '¿Tienes experiencia en manejo de inventarios?',
                type: 'yes_no',
            },
            {
                id: '2',
                question:
                    '¿Puedes levantar objetos de hasta 25 kg regularmente?',
                type: 'yes_no',
            },
            {
                id: '3',
                question:
                    '¿Has usado sistemas de gestión de almacenes (WMS) anteriormente?',
                type: 'yes_no',
            },
            {
                id: '4',
                question:
                    'Describe tu experiencia con montacargas o equipo de almacén',
                type: 'text',
            },
        ],
    },
    {
        id: 'production',
        name: 'Línea de Producción',
        questions: [
            {
                id: '1',
                question: '¿Tienes experiencia en control de calidad?',
                type: 'yes_no',
            },
            {
                id: '2',
                question:
                    '¿Puedes mantener el ritmo de trabajo en líneas de producción rápidas?',
                type: 'yes_no',
            },
            {
                id: '3',
                question:
                    '¿Qué tan importante es para ti seguir procedimientos de seguridad?',
                type: 'multiple_choice',
                options: [
                    'Muy importante',
                    'Importante',
                    'Moderadamente importante',
                    'Poco importante',
                ],
            },
            {
                id: '4',
                question:
                    'Describe una situación donde identificaste un problema de calidad',
                type: 'text',
            },
        ],
    },
];

export function ScreeningQuestionsDialog() {
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);

    const handleRoleChange = (roleId: string) => {
        setSelectedRole(roleId);
        const role = roles.find((r) => r.id === roleId);
        setQuestions(role?.questions || []);
    };

    const addQuestion = () => {
        const newQuestion: ScreeningQuestion = {
            id: Date.now().toString(),
            question: '',
            type: 'text',
        };
        setQuestions([...questions, newQuestion]);
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter((q) => q.id !== id));
    };

    const updateQuestion = (
        id: string,
        field: keyof ScreeningQuestion,
        value: any
    ) => {
        setQuestions(
            questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
        );
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Editar Preguntas de Preselección
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Configurar Preguntas de Preselección
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="role-select">Seleccionar Rol</Label>
                        <Select
                            value={selectedRole}
                            onValueChange={handleRoleChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un rol para editar" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedRole && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">
                                    Preguntas para{' '}
                                    {
                                        roles.find((r) => r.id === selectedRole)
                                            ?.name
                                    }
                                </h3>
                                <Button onClick={addQuestion} size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Agregar Pregunta
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {questions.map((question, index) => (
                                    <div
                                        key={question.id}
                                        className="border rounded-lg p-4 space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <Label>Pregunta {index + 1}</Label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    removeQuestion(question.id)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <Textarea
                                            value={question.question}
                                            onChange={(e) =>
                                                updateQuestion(
                                                    question.id,
                                                    'question',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Escribe la pregunta aquí..."
                                            rows={2}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Tipo de Pregunta</Label>
                                                <Select
                                                    value={question.type}
                                                    onValueChange={(value) =>
                                                        updateQuestion(
                                                            question.id,
                                                            'type',
                                                            value
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="text">
                                                            Texto Libre
                                                        </SelectItem>
                                                        <SelectItem value="yes_no">
                                                            Sí/No
                                                        </SelectItem>
                                                        <SelectItem value="multiple_choice">
                                                            Opción Múltiple
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {question.type ===
                                                'multiple_choice' && (
                                                <div className="space-y-2">
                                                    <Label>
                                                        Opciones (separadas por
                                                        coma)
                                                    </Label>
                                                    <Textarea
                                                        value={
                                                            question.options?.join(
                                                                ', '
                                                            ) || ''
                                                        }
                                                        onChange={(e) =>
                                                            updateQuestion(
                                                                question.id,
                                                                'options',
                                                                e.target.value.split(
                                                                    ', '
                                                                )
                                                            )
                                                        }
                                                        placeholder="Opción 1, Opción 2, Opción 3"
                                                        rows={2}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button variant="outline">Cancelar</Button>
                                <Button>Guardar Cambios</Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
