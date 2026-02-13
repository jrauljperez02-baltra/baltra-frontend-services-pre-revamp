'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCompanyID } from '@/context/CompanyContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    getPhoneInterviewQuestions,
    putPhoneInterviewQuestions,
    type PhoneInterviewQuestion,
    getRolesData,
    type RoleData,
} from '@/lib/api';
import {
    Plus,
    Trash2,
    Settings2,
    ArrowUp,
    ArrowDown,
    Save,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

export function PhoneInterviewQuestionsDialog() {
    const companyId = useCompanyID();
    const [isOpen, setIsOpen] = useState(false);
    const [roles, setRoles] = useState<RoleData[]>([]);
    const [roleId, setRoleId] = useState<number | undefined>(undefined);
    const [questions, setQuestions] = useState<PhoneInterviewQuestion[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!companyId) return;
        getRolesData(companyId)
            .then(setRoles)
            .catch(() => {});
    }, [companyId]);

    const loadQuestions = async (rid?: number) => {
        if (!companyId) return;
        setLoading(true);
        try {
            const qs = await getPhoneInterviewQuestions(companyId, rid);
            setQuestions(qs.sort((a, b) => a.position - b.position));
        } catch (e) {
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) loadQuestions(roleId);
    }, [isOpen, roleId]);

    const addQuestion = () => {
        const nextPos = (questions[questions.length - 1]?.position || 0) + 1;
        setQuestions([
            ...questions,
            { id: 0, position: nextPos, question: '', role_id: roleId ?? null },
        ]);
    };

    const removeQuestion = (idx: number) => {
        setQuestions((qs) => qs.filter((_, i) => i !== idx));
    };

    const move = (idx: number, dir: -1 | 1) => {
        setQuestions((qs) => {
            const arr = [...qs];
            const j = idx + dir;
            if (j < 0 || j >= arr.length) return arr;
            [arr[idx], arr[j]] = [arr[j], arr[idx]];
            return arr.map((q, i) => ({ ...q, position: i + 1 }));
        });
    };

    const changeQuestion = (idx: number, value: string) => {
        setQuestions((qs) =>
            qs.map((q, i) => (i === idx ? { ...q, question: value } : q))
        );
    };

    const canSave = useMemo(
        () => questions.every((q) => (q.question || '').trim().length > 0),
        [questions]
    );

    const onSave = async () => {
        if (!companyId) return;
        try {
            // ensure deterministic positions 1..N before sending
            const normalized = questions
                .map((q, i) => ({
                    position: i + 1,
                    question: (q.question || '').trim(),
                }))
                .filter((q) => q.question.length > 0);
            const res = await putPhoneInterviewQuestions(
                companyId,
                normalized,
                roleId
            );
            if (res.success) {
                toast.success('Preguntas guardadas');
                setIsOpen(false);
            } else {
                toast.error(res.error || 'Error al guardar');
            }
        } catch (e) {
            toast.error('Error al guardar');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-baltra-600 hover:bg-baltra-700 text-white">
                    <Settings2 className="h-4 w-4 mr-2" /> Configurar Preguntas
                    de Entrevista Telefónica
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="text-lg">
                        Preguntas de Entrevista Telefónica
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Estas preguntas alimentan el funnel telefónico descrito
                        por los estados Invitados a llamada → Incompleto →
                        Rechazado/Exitoso, tal como se detalla en el endpoint{' '}
                        <code className="mx-1 text-xs">/dashboard/phone-funnel</code>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Rol</Label>
                        <Select
                            value={roleId == null ? 'general' : String(roleId)}
                            onValueChange={(v) => {
                                if (v === 'general') setRoleId(undefined);
                                else setRoleId(Number(v));
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="General (aplica a todos los roles)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem key="general" value="general">
                                    General (todos los roles)
                                </SelectItem>
                                {roles?.map((r) => (
                                    <SelectItem key={r.id} value={String(r.id)}>
                                        {r.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between border rounded-md py-2 px-3 bg-slate-50">
                        <div className="text-sm text-slate-600">
                            Total:{' '}
                            <span className="font-medium text-slate-900">
                                {questions.length}
                            </span>{' '}
                            preguntas
                        </div>
                        <Button size="sm" onClick={addQuestion} className="h-8 bg-baltra-600 hover:bg-baltra-700 text-white">
                            <Plus className="h-4 w-4 mr-2" /> Agregar Pregunta
                        </Button>
                    </div>
                    <ScrollArea className="h-[55vh] pr-2">
                        <div className="space-y-3">
                            {questions.map((q, idx) => (
                                <div
                                    key={`${q.id}-${idx}`}
                                    className="rounded-md border bg-white p-3 shadow-sm hover:shadow transition-shadow"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm font-medium text-slate-700">
                                            Pregunta {q.position}
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => move(idx, -1)}
                                            >
                                                <ArrowUp className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => move(idx, 1)}
                                            >
                                                <ArrowDown className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    removeQuestion(idx)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <Textarea
                                        rows={2}
                                        value={q.question}
                                        onChange={(e) =>
                                            changeQuestion(idx, e.target.value)
                                        }
                                        placeholder="Escribe la pregunta aquí..."
                                        className="bg-slate-50"
                                    />
                                </div>
                            ))}

                            {questions.length === 0 && !loading && (
                                <div className="text-sm text-muted-foreground">
                                    No hay preguntas definidas.
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4 mr-2" /> Cancelar
                        </Button>
                        <Button 
                        className='bg-baltra-600 hover:bg-baltra-700 text-white'
                        onClick={onSave} disabled={!canSave}>
                            <Save className="h-4 w-4 mr-2" /> Guardar Cambios
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
