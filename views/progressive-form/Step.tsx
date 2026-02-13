'use client';

import { useEffect, useMemo, useState } from 'react';
import QuestionRenderer from '@/views/progressive-form/QuestionRenderer';
import type { Answers, FormStep, Question, Vacancy } from '@/types/progressive-form';

interface Props {
    step: FormStep;
    onNext: (data: Answers) => void;
    onBack: () => void;
    isLast: boolean;
    currentStep: number;
    globalAnswers: Answers;
    setGlobalAnswers: React.Dispatch<React.SetStateAction<Answers>>;
}

function isEmptyValue(val: any) {
    if (val === undefined || val === null) return true;
    if (typeof val === 'string') return val.trim() === '';
    if (Array.isArray(val)) return val.length === 0;
    return false;
}

function isValidUrl(value: string) {
    try {
        const u = new URL(value);
        return !!u.protocol && !!u.host;
    } catch {
        return false;
    }
}

function getVacanciesFromAnswers(globalAnswers: Answers): Vacancy[] {
    const commonKey = 'Registra las vacantes de la empresa.';
    const direct = globalAnswers?.[commonKey];
    if (Array.isArray(direct)) return direct as Vacancy[];
    for (const val of Object.values(globalAnswers || {})) {
        if (Array.isArray(val) && val.length > 0) {
            const first = val[0] as any;
            if (first && typeof first === 'object' && 'roleName' in first && 'useCompanyAddress' in first) {
                return val as Vacancy[];
            }
        }
    }
    return [];
}

function validateQuestion(q: Question, value: any, globalAnswers: Answers): string | null {
    if (q.required && isEmptyValue(value)) {
        return `Por favor completa: ${q.question}`;
    }

    if (q.type === 'url' && !isEmptyValue(value) && !isValidUrl(String(value))) {
        return `La URL ingresada en "${q.question}" no es válida.`;
    }

    if (q.type === 'text' && q.restrictions?.max_length) {
        if (typeof value === 'string' && value.length > q.restrictions.max_length) {
            return `"${q.question}" excede el máximo de ${q.restrictions.max_length} caracteres.`;
        }
    }

    if (q.type === 'component' && (q as any).componentKind === 'vacancies') {
        const limits = {
            roleName: (q.restrictions as any)?.roleNameMax ?? 24,
            relevantInfo: (q.restrictions as any)?.relevantInfoMax ?? 72,
            aboutRole: (q.restrictions as any)?.aboutRoleMax ?? 200,
        };
        if (!Array.isArray(value) || value.length === 0) {
            return 'Agrega al menos una vacante con todos los campos obligatorios.';
        }
        const t = (s: any) => (typeof s === 'string' ? s.trim() : '');
        for (let i = 0; i < value.length; i++) {
            const v = value[i] as Vacancy;
            const idx = i + 1;
            if (!t(v?.roleName)) return `Vacante #${idx}: completa "Nombre del rol".`;
            if (t(v.roleName).length > limits.roleName) return `Vacante #${idx}: "Nombre del rol" supera ${limits.roleName} caracteres.`;
            if (!t(v?.relevantInfo)) return `Vacante #${idx}: completa "Información relevante".`;
            if (t(v.relevantInfo).length > limits.relevantInfo) return `Vacante #${idx}: "Información relevante" supera ${limits.relevantInfo} caracteres.`;
            if (!t(v?.aboutRole)) return `Vacante #${idx}: completa "Acerca del rol".`;
            if (t(v.aboutRole).length > limits.aboutRole) return `Vacante #${idx}: "Acerca del rol" supera ${limits.aboutRole} caracteres.`;
            if (!v.useCompanyAddress) {
                const a = v.location;
                if (!a || !t(a.address) || !a.latitude || !a.longitude) {
                    return `Vacante #${idx}: captura la "Dirección de la vacante".`;
                }
            }
        }
    }

    if (q.type === 'component' && (q as any).componentKind === 'demographics') {
        const vacancies = getVacanciesFromAnswers(globalAnswers);
        const total = Array.isArray(vacancies) ? vacancies.length : 0;
        if (total === 0) return 'Antes de configurar datos demográficos, registra al menos una vacante.';
        if (!Array.isArray(value) || value.length === 0) return 'Agrega al menos un grupo de datos demográficos.';

        const ALL = new Set<number>();
        for (let i = 0; i < total; i++) ALL.add(i);

        let hasAll = false;
        const covered = new Set<number>();

        for (let i = 0; i < value.length; i++) {
            const g = value[i] as any;
            const idx = i + 1;

            const minAge = Number(g?.minAge);
            const maxAge = Number(g?.maxAge);
            if (Number.isNaN(minAge) || Number.isNaN(maxAge)) return `Grupo #${idx}: define edades válidas.`;
            if (minAge < 18 || maxAge > 60 || minAge > maxAge) {
                return `Grupo #${idx}: el rango de edad debe estar entre 18 y 60 y la mínima no puede superar la máxima.`;
            }

            if (!g?.education) return `Grupo #${idx}: selecciona el nivel educativo concluido.`;

            if (g?.appliesToAll) {
                if (hasAll || value.length > 1) return 'Si un grupo aplica a todas las vacantes, debe ser el único grupo.';
                hasAll = true;
                break;
            } else {
                const arr = Array.isArray(g?.vacancyIndexes) ? g.vacancyIndexes : [];
                if (arr.length === 0) return `Grupo #${idx}: selecciona al menos una vacante.`;
                for (const vi of arr) {
                    if (typeof vi !== 'number' || vi < 0 || vi >= total) return `Grupo #${idx}: índice de vacante inválido (${vi}).`;
                }
                for (const vi of arr) covered.add(vi);
            }
        }

        if (!hasAll) {
            for (const vi of ALL) if (!covered.has(vi)) return 'Aún hay vacantes sin asignar a un grupo de datos demográficos.';
        }
    }

    if (q.type === 'component' && (q as any).componentKind === 'salary') {
        const vacancies = getVacanciesFromAnswers(globalAnswers);
        const total = Array.isArray(vacancies) ? vacancies.length : 0;
        if (total === 0) return 'Antes de configurar salario, registra al menos una vacante.';
        if (!Array.isArray(value) || value.length === 0) return 'Agrega al menos un grupo de salario.';

        const ALL = new Set<number>();
        for (let i = 0; i < total; i++) ALL.add(i);

        let hasAll = false;
        const covered = new Set<number>();

        const validPayType = (x: any) => x === 'Bruto' || x === 'Neto';
        const validFreq = (x: any) => x === 'Semanal' || x === 'Quincenal' || x === 'Mensual';

        for (let i = 0; i < value.length; i++) {
            const g = value[i] as any;
            const idx = i + 1;

            if (!validPayType(g?.payType)) return `Grupo #${idx}: indica si el salario es bruto o neto.`;
            if (!g?.bank || String(g.bank).trim() === '') return `Grupo #${idx}: especifica el banco de pago.`;
            if (!validFreq(g?.frequency)) return `Grupo #${idx}: selecciona la frecuencia de pago.`;

            if ('candidateBankRule' in g) {
                const validRule = (x: any) => x === 'allow_any' || x === 'must_match_pay_bank' || x === 'exclude_banks';
                if (!validRule(g?.candidateBankRule)) return `Grupo #${idx}: selecciona la regla de banco del candidato.`;
                if (g.candidateBankRule === 'exclude_banks') {
                    if (!Array.isArray(g?.candidateExcludeBanks) || g.candidateExcludeBanks.length === 0) {
                        return `Grupo #${idx}: agrega al menos un banco a excluir o cambia la regla.`;
                    }
                }
            } else if ('discardByBank' in g) {
                if (typeof g.discardByBank !== 'boolean') return `Grupo #${idx}: indica si se descarta por banco.`;
            }

            if (g?.appliesToAll) {
                if (hasAll || value.length > 1) return 'Si un grupo de salario aplica a todas las vacantes, debe ser el único grupo.';
                hasAll = true;
                break;
            } else {
                const arr = Array.isArray(g?.vacancyIndexes) ? g.vacancyIndexes : [];
                if (arr.length === 0) return `Grupo #${idx}: selecciona al menos una vacante.`;
                for (const vi of arr) {
                    if (typeof vi !== 'number' || vi < 0 || vi >= total) return `Grupo #${idx}: índice de vacante inválido (${vi}).`;
                }
                for (const vi of arr) covered.add(vi);
            }
        }

        if (!hasAll) {
            for (const vi of ALL) if (!covered.has(vi)) return 'Aún hay vacantes sin asignar a un grupo de salario.';
        }
    }

    if (q.type === 'component' && (q as any).componentKind === 'shifts') {
        const vacancies = getVacanciesFromAnswers(globalAnswers);
        const total = Array.isArray(vacancies) ? vacancies.length : 0;
        if (total === 0) return 'Antes de configurar turnos, registra al menos una vacante.';
        if (!Array.isArray(value) || value.length === 0) return 'Agrega al menos un grupo de turnos.';

        const ALL = new Set<number>();
        for (let i = 0; i < total; i++) ALL.add(i);

        let hasAll = false;
        const covered = new Set<number>();
        const limit = (q.restrictions as any)?.shiftMax ?? 120;

        for (let i = 0; i < value.length; i++) {
            const g = value[i] as any;
            const idx = i + 1;

            const s = typeof g?.shift === 'string' ? g.shift.trim() : '';
            if (!s) return `Grupo #${idx}: describe el turno.`;
            if (s.length > limit) return `Grupo #${idx}: el turno supera ${limit} caracteres.`;
            if (typeof g?.includeBreaks !== 'boolean') return `Grupo #${idx}: indica si incluye descansos (sí/no).`;

            if (g?.appliesToAll) {
                if (hasAll || value.length > 1) return 'Si un grupo de turnos aplica a todas las vacantes, debe ser el único grupo.';
                hasAll = true;
                break;
            } else {
                const arr = Array.isArray(g?.vacancyIndexes) ? g.vacancyIndexes : [];
                if (arr.length === 0) return `Grupo #${idx}: selecciona al menos una vacante.`;
                for (const vi of arr) {
                    if (typeof vi !== 'number' || vi < 0 || vi >= total) return `Grupo #${idx}: índice de vacante inválido (${vi}).`;
                }
                for (const vi of arr) covered.add(vi);
            }
        }

        if (!hasAll) {
            for (const vi of ALL) if (!covered.has(vi)) return 'Aún hay vacantes sin asignar a un grupo de turnos.';
        }
    }

    if (q.type === 'component' && (q as any).componentKind === 'documents') {
        const vacancies = getVacanciesFromAnswers(globalAnswers);
        const total = Array.isArray(vacancies) ? vacancies.length : 0;
        if (total === 0) return 'Antes de configurar documentos, registra al menos una vacante.';
        if (!Array.isArray(value) || value.length === 0) return 'Agrega al menos un grupo de documentos.';

        const ALL = new Set<number>();
        for (let i = 0; i < total; i++) ALL.add(i);

        let hasAll = false;
        const covered = new Set<number>();

        for (let i = 0; i < value.length; i++) {
            const g = value[i] as any;
            const idx = i + 1;

            const docs = g?.documents;
            if (!docs || typeof docs !== 'object') return `Grupo #${idx}: define los documentos.`;
            const someChosen = Object.values(docs as any).some((x: any) => x === 'required' || x === 'reminder');

            if (g?.appliesToAll) {
                if (hasAll || value.length > 1) return 'Si un grupo de documentos aplica a todas las vacantes, debe ser el único grupo.';
                hasAll = true;
                break;
            } else {
                const arr = Array.isArray(g?.vacancyIndexes) ? g.vacancyIndexes : [];
                if (arr.length === 0) return `Grupo #${idx}: selecciona al menos una vacante.`;
                for (const vi of arr) {
                    if (typeof vi !== 'number' || vi < 0 || vi >= total) return `Grupo #${idx}: índice de vacante inválido (${vi}).`;
                }
                for (const vi of arr) covered.add(vi);
            }
        }

        if (!hasAll) {
            for (const vi of ALL) if (!covered.has(vi)) return 'Aún hay vacantes sin asignar a un grupo de documentos.';
        }
    }

    return null;
}

export default function Step({
    step,
    onNext,
    onBack,
    isLast,
    currentStep,
    globalAnswers,
    setGlobalAnswers,
}: Props) {
    const [localData, setLocalData] = useState<Answers>({});
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const preload = step.questions.reduce((acc: Answers, q) => {
            if (globalAnswers[q.question] !== undefined) {
                acc[q.question] = globalAnswers[q.question];
            }
            return acc;
        }, {});
        setLocalData(preload);
        setError('');
    }, [currentStep, step]);

    const questions = useMemo(() => step.questions, [step]);

    const handleChange = (question: string, value: any) => {
        setLocalData(prev => ({ ...prev, [question]: value }));
        setGlobalAnswers(prev => ({ ...prev, [question]: value }));
    };

    const handleSubmit = () => {
        for (const q of questions) {
            const val = localData[q.question];
            const maybeError = validateQuestion(q, val, globalAnswers);
            if (maybeError) {
                setError(maybeError);
                return;
            }
        }
        setError('');
        onNext(localData);
    };

    return (
        <div className="mt-8 transition-all duration-300 ease-in-out">
            <h2 className="text-2xl font-semibold mb-6">{step.section_name}</h2>

            {questions.map((q, i) => (
                <div key={i} className="mb-6">
                    <QuestionRenderer
                        question={q}
                        value={localData[q.question]}
                        onChange={handleChange}
                        globalAnswers={globalAnswers}
                    />
                </div>
            ))}

            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

            <div className="flex justify-between mt-6">
                <button
                    onClick={onBack}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
                    disabled={currentStep === 0}
                >
                    Atrás
                </button>

                <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-baltra-600 text-white rounded-md hover:bg-gray-800"
                >
                    {isLast ? 'Enviar' : 'Siguiente'}
                </button>
            </div>
        </div>
    );
}