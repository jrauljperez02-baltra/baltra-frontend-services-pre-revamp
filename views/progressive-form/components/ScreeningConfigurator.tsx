'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import OptionsSelect from '@/views/progressive-form/components/OptionsSelect';
import Tooltip from '@/views/progressive-form/tools/Tooltip';
import type { Answers, Vacancy } from '@/types/progressive-form';
import {
    getScreeningPreset,
    type ScreeningHints,
    type ScreeningPreset,
    type GeneralKey,
    type RoleKey,
} from '@/views/progressive-form/components/screening/presets';

type RoleQuestion = { enabled: boolean; template: string };

type GeneralSet = {
    order: GeneralKey[];
    include: Record<GeneralKey, boolean>;
    templates: Record<GeneralKey, string>;
    welcomeDraft?: string;
};

export type ScreeningRoleGroup = {
    vacancyIndexes: number[];
    questions: Record<RoleKey, RoleQuestion>;
};

export type ScreeningPlan = {
    companyType: string;
    general: GeneralSet;
    perRole: ScreeningRoleGroup[];
    bookingTemplate: string;
};

const chip = 'px-3 py-1.5 rounded-md border text-sm select-none transition-colors';
const onChip = 'bg-baltra-600 text-white border-baltra';
const offChip = 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50';

function prettyGeneral(k: GeneralKey) {
    switch (k) {
        case 'welcome': return 'Welcome question';
        case 'name': return 'Pregunta de nombre';
        case 'age': return 'Pregunta de edad';
        case 'education': return 'Pregunta de educación';
        case 'shifts': return 'Preguntas de turnos';
        case 'select_role': return 'Select_role';
        case 'select_role_eligibility': return 'Select_role_eligibility';
        case 'location_critical': return 'location_critical';
        case 'location': return 'Pregunta de location';
        case 'experience': return 'Pregunta de experiencia';
        case 'references': return 'Pregunta de referencias';
        case 'last12months': return 'Trabajos de últimos 12 meses';
        case 'documents': return 'Pregunta de documentos';
        case 'bank': return 'Pregunta de banco';
        case 'certifications_general': return 'Preguntas de certificados';
        default: return k;
    }
}

function prettyRole(k: RoleKey) {
    switch (k) {
        case 'location': return 'Pregunta de location';
        case 'experience': return 'Pregunta de experiencia';
        case 'references': return 'Pregunta de referencias';
        case 'last12months': return 'Trabajos de últimos 12 meses';
        case 'certifications': return 'Preguntas de certificados';
        case 'documents': return 'Pregunta de documentos';
        case 'bank': return 'Pregunta de banco';
        case 'education': return 'Pregunta de educación';
        case 'shifts': return 'Preguntas de turnos';
        default: return k;
    }
}

const DOC_LABELS: Record<string, string> = {
    ine: 'INE',
    curp: 'CURP',
    sat: 'Constancia de situación fiscal (SAT)',
    imss: 'Número de Seguro Social (IMSS)',
    comprobante_domicilio: 'Comprobante de domicilio',
    comprobante_estudios: 'Comprobante de estudios',
    acta_nacimiento: 'Acta de nacimiento',
    solicitud_empleo: 'Solicitud de empleo',
    cartilla_militar: 'Cartilla militar',
    antecedentes_penales: 'Carta de no antecedentes',
    cv: 'CV',
    constancias_laborales: 'Constancias laborales',
    fotos_infantil: 'Fotos tamaño infantil',
    acta_beneficiario: 'Acta de beneficiario',
    cuenta_bancaria: 'Cuenta bancaria',
};

function deriveHints(global: Answers | undefined | null): ScreeningHints {
    const docs = global?.['Configura los documentos requeridos por vacante.'] as any;
    const hasDocuments =
        Array.isArray(docs) &&
        docs.some((g: any) =>
            g?.documents && Object.values(g.documents).some((m: any) => m === 'required' || m === 'reminder')
        );
    const tr = global?.['Configura transporte, certificaciones y preguntas extra.'] as any;
    const hasCerts = Array.isArray(tr) && tr.some((g: any) => g?.certifications?.required === true);
    const sal = global?.['Configura el salario por vacante.'] as any;
    const hasBank = Array.isArray(sal) && sal.some((g: any) => g?.candidateBankRule && g?.candidateBankRule !== 'allow_any');
    return { hasDocuments, hasCerts, hasBank };
}

function buildGeneralTemplates(preset: ScreeningPreset, global: Answers | undefined | null) {
    const tr = global?.['Configura transporte, certificaciones y preguntas extra.'] as any;
    let certName = 'la certificación requerida';
    if (Array.isArray(tr)) {
        const f = tr.find((g: any) => g?.certifications?.required === true && g?.certifications?.name);
        if (f?.certifications?.name) certName = String(f.certifications.name);
    }
    const sal = global?.['Configura el salario por vacante.'] as any;
    let payBank = 'el banco indicado';
    if (Array.isArray(sal) && sal.length) {
        const bank = String(sal[0]?.bank ?? '').split(',')[0]?.trim();
        if (bank) payBank = bank;
    }
    const docs = global?.['Configura los documentos requeridos por vacante.'] as any;
    const reqDocs: string[] = [];
    if (Array.isArray(docs)) {
        for (const g of docs) {
            const m = g?.documents;
            if (m && typeof m === 'object') {
                for (const [k, v] of Object.entries(m)) {
                    if (v === 'required') reqDocs.push(DOC_LABELS[k] ?? k);
                }
            }
        }
    }
    const docsList = reqDocs.length ? reqDocs.join(', ') : 'los documentos requeridos';

    const base: Partial<Record<GeneralKey, string>> = {
        welcome: preset.welcomeDraft ?? '👋 ¡Hola! Gracias por tu interés! Te haremos unas preguntas rápidas para continuar.',
        name: '🧑‍💼 ¿Cuál es tu nombre completo?',
        age: '🎂 ¿Cuántos años tienes?',
        education: '🎓 ¿Cuál es tu último nivel educativo concluido?',
        shifts: '⏰ ¿Puedes trabajar en el turno indicado? Responde Sí o No.',
        select_role: '📌 Elige la vacante a la que te postulas.',
        select_role_eligibility: '✅ Confirma si cumples con los criterios de elegibilidad del rol elegido.',
        location_critical: '📍 ¿Puedes trasladarte diariamente a la zona de trabajo indicada?',
        location: '📍 ¿En qué colonia y municipio vives?',
        experience: '🛠️ ¿Tienes experiencia previa en el puesto? Cuéntanos brevemente.',
        references: '📇 ¿Puedes compartir 1–2 referencias laborales (nombre y teléfono)?',
        last12months: '📅 ¿Has trabajado en los últimos 12 meses? ¿Dónde y cuánto tiempo?',
        documents: `📄 ¿Cuentas con ${docsList}?`,
        bank: `🏦 ¿Tienes cuenta en ${payBank}?`,
        certifications_general: `✅ ¿Cuentas con ${certName}?`,
    };

    const templates: Record<GeneralKey, string> = {} as any;
    for (const k of preset.generalOrder) templates[k] = base[k] ?? '';
    return templates;
}

function buildRoleDefaults(global: Answers | undefined | null): Record<RoleKey, string> {
    const tr = global?.['Configura transporte, certificaciones y preguntas extra.'] as any;
    let certName = 'la certificación requerida';
    if (Array.isArray(tr)) {
        const f = tr.find((g: any) => g?.certifications?.required === true && g?.certifications?.name);
        if (f?.certifications?.name) certName = String(f.certifications.name);
    }
    const sal = global?.['Configura el salario por vacante.'] as any;
    let payBank = 'el banco indicado';
    if (Array.isArray(sal) && sal.length) {
        const bank = String(sal[0]?.bank ?? '').split(',')[0]?.trim();
        if (bank) payBank = bank;
    }
    const docs = global?.['Configura los documentos requeridos por vacante.'] as any;
    const reqDocs: string[] = [];
    if (Array.isArray(docs)) {
        for (const g of docs) {
            const m = g?.documents;
            if (m && typeof m === 'object') {
                for (const [k, v] of Object.entries(m)) {
                    if (v === 'required') reqDocs.push(DOC_LABELS[k] ?? k);
                }
            }
        }
    }
    const docsList = reqDocs.length ? reqDocs.join(', ') : 'los documentos requeridos';

    return {
        location: '📍 ¿En qué colonia y municipio vives?',
        experience: '🛠️ ¿Tienes experiencia previa en el puesto? Cuéntanos brevemente.',
        references: '📇 ¿Puedes compartir 1–2 referencias laborales (nombre y teléfono)?',
        last12months: '📅 ¿Has trabajado en los últimos 12 meses? ¿Dónde y cuánto tiempo?',
        certifications: `✅ ¿Cuentas con ${certName}?`,
        documents: `📄 ¿Cuentas con ${docsList}?`,
        bank: `🏦 ¿Tienes cuenta en ${payBank}?`,
        education: '🎓 ¿Cuál es tu último nivel educativo concluido?',
        shifts: '⏰ ¿Puedes trabajar en el turno indicado? Responde Sí o No.',
    };
}

interface Props {
    vacancies: Vacancy[] | undefined;
    companyType: string;
    globalAnswers: Answers | undefined;
    value?: ScreeningPlan;
    onChange: (plan: ScreeningPlan) => void;
}

export default function ScreeningConfigurator({
    vacancies,
    companyType,
    globalAnswers,
    value,
    onChange,
}: Props) {
    const safeVacancies = useMemo<Vacancy[]>(
        () => (Array.isArray(vacancies) ? vacancies : []),
        [vacancies]
    );

    const hints = useMemo(() => deriveHints(globalAnswers), [globalAnswers]);
    const preset = useMemo(() => getScreeningPreset(companyType, hints), [companyType, hints]);

    const generalDefaults = useMemo(
        () => buildGeneralTemplates(preset, globalAnswers),
        [preset, globalAnswers]
    );
    const roleDefaults = useMemo(
        () => buildRoleDefaults(globalAnswers),
        [globalAnswers]
    );

    const allowedRoleKeys = useMemo(() => Object.keys(preset.roleEnable) as RoleKey[], [preset]);
    const hasRoleQuestions = allowedRoleKeys.length > 0;

    const initialGeneral: GeneralSet = useMemo(() => {
        const include: Record<GeneralKey, boolean> = {} as any;
        for (const k of preset.generalOrder) include[k] = preset.generalInclude[k] ?? false;

        const templates: Record<GeneralKey, string> = {} as any;
        for (const k of preset.generalOrder) templates[k] = generalDefaults[k];

        if (value?.general?.templates) {
            for (const [k, v] of Object.entries(value.general.templates) as [GeneralKey, string][]) {
                if (k in templates) templates[k] = v;
            }
        }
        if (value?.general?.include) {
            for (const [k, v] of Object.entries(value.general.include) as [GeneralKey, boolean][]) {
                if (k in include) include[k] = v;
            }
        }

        return {
            order: value?.general?.order ?? preset.generalOrder,
            include,
            templates,
            welcomeDraft: templates.welcome,
        };
    }, [preset, value, generalDefaults]);

    const normalizeRole = (g?: Partial<ScreeningRoleGroup>): ScreeningRoleGroup => {
        const base: Record<RoleKey, RoleQuestion> = {} as any;
        for (const rk of allowedRoleKeys) {
            base[rk] = {
                enabled: !!preset.roleEnable[rk],
                template: roleDefaults[rk],
            };
        }
        if (g?.questions) {
            for (const [rk, val] of Object.entries(g.questions) as [RoleKey, any][]) {
                if (!allowedRoleKeys.includes(rk)) continue;
                if (typeof val === 'object') {
                    base[rk] = { enabled: !!val.enabled, template: String(val.template ?? base[rk].template) };
                } else if (typeof val === 'boolean') {
                    base[rk] = { ...base[rk], enabled: val };
                }
            }
        }
        return {
            vacancyIndexes: Array.isArray(g?.vacancyIndexes) ? g!.vacancyIndexes : [],
            questions: base,
        };
    };

    const DEFAULT_BOOKING =
        '🗓️ Para agendar tu entrevista, por favor elige un horario disponible respondiendo con el número de la opción.';

    // ---- Normalizador/Coerción desde "value" o estado previo
    const coercePlanFromValue = (val?: Partial<ScreeningPlan>): ScreeningPlan => {
        const v = val ?? {};
        const vg = v.general ?? ({} as Partial<GeneralSet>);

        // include/templates solo para keys del preset actual
        const include: Record<GeneralKey, boolean> = {} as any;
        const templates: Record<GeneralKey, string> = {} as any;
        for (const k of preset.generalOrder) {
            include[k] = vg.include?.[k] ?? (preset.generalInclude[k] ?? false);
            templates[k] = vg.templates?.[k] ?? generalDefaults[k];
        }

        const general: GeneralSet = {
            order: Array.isArray(vg.order) && vg.order.length ? vg.order : preset.generalOrder,
            include,
            templates,
            welcomeDraft: templates.welcome,
        };

        const perRole: ScreeningRoleGroup[] =
            Array.isArray(v.perRole) && v.perRole.length
                ? v.perRole.map(normalizeRole)
                : [normalizeRole()];

        const bookingTemplate = v.bookingTemplate ?? DEFAULT_BOOKING;

        return {
            companyType,
            general,
            perRole,
            bookingTemplate,
        };
    };

    const initialPlan: ScreeningPlan = useMemo(() => {
        if (value) return coercePlanFromValue(value);
        return coercePlanFromValue({
            bookingTemplate: DEFAULT_BOOKING,
            perRole: [normalizeRole()],
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyType, preset, generalDefaults, roleDefaults, /* value intentionally excluded for the initial state */]);

    const [plan, setPlan] = useState<ScreeningPlan>(initialPlan);

    // ------------ FIX 1: Emitir cambios solo si realmente cambió (anti-rebote)
    const onChangeRef = useRef(onChange);
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

    const lastEmittedRef = useRef<string>('');
    useEffect(() => {
        const s = JSON.stringify(plan);
        if (s !== lastEmittedRef.current) {
            lastEmittedRef.current = s;
            onChangeRef.current(plan);
        }
    }, [plan]);

    // ------------ FIX 2: Rehidratar desde `value`/preset SOLO si difiere (y normalizando)
    const incomingPlanStr = useMemo(() => (value ? JSON.stringify(value) : ''), [value]);
    useEffect(() => {
        // Recalcula el "siguiente" plan normalizado con los defaults actuales del preset
        const next = value ? coercePlanFromValue(value) : undefined;
        if (!next) return;
        const nextStr = JSON.stringify(next);
        const curStr = JSON.stringify(plan);
        if (nextStr !== curStr) {
            setPlan(next);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [incomingPlanStr, preset, generalDefaults, roleDefaults]);

    // ------------ FIX 2 (parte B): si cambia companyType pero no llega nuevo `value`, conserva edición aplicando nuevo preset
    const lastCompanyTypeRef = useRef(companyType);
    useEffect(() => {
        if (lastCompanyTypeRef.current !== companyType) {
            lastCompanyTypeRef.current = companyType;
            setPlan(prev => coercePlanFromValue(prev));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyType, preset, generalDefaults, roleDefaults]);

    // ---- UI helpers
    const vacancyOptions = useMemo(
        () => safeVacancies.map((v, i) => ({ label: v.roleName?.trim() || `Vacante #${i + 1}`, value: String(i) })),
        [safeVacancies]
    );

    const assigned = useMemo(() => {
        const set = new Set<number>();
        for (const g of plan.perRole) for (const vi of g.vacancyIndexes) set.add(vi);
        return set;
    }, [plan.perRole]);

    const notAssigned = useMemo(() => {
        const arr: number[] = [];
        for (let i = 0; i < safeVacancies.length; i++) if (!assigned.has(i)) arr.push(i);
        return arr;
    }, [assigned, safeVacancies.length]);

    const addGroupForRemaining = () => {
        if (!notAssigned.length) return;
        setPlan(prev => ({
            ...prev,
            perRole: [
                ...prev.perRole,
                {
                    vacancyIndexes: notAssigned,
                    questions: Object.fromEntries(
                        (Object.keys(prev.perRole[0].questions) as RoleKey[]).map(rk => [
                            rk,
                            {
                                enabled: prev.perRole[0].questions[rk].enabled,
                                template: prev.perRole[0].questions[rk].template,
                            },
                        ])
                    ) as Record<RoleKey, RoleQuestion>,
                },
            ],
        }));
    };

    const removeGroup = (idx: number) =>
        setPlan(prev => ({ ...prev, perRole: prev.perRole.filter((_, i) => i !== idx) }));

    const setGeneral = (patch: Partial<GeneralSet>) =>
        setPlan(prev => {
            const next = { ...prev.general, ...patch } as GeneralSet;
            if (patch.templates?.welcome) next.welcomeDraft = patch.templates.welcome;
            return { ...prev, general: next };
        });

    const toggleGeneral = (k: GeneralKey) =>
        setPlan(prev => ({
            ...prev,
            general: {
                ...prev.general,
                include: { ...prev.general.include, [k]: !prev.general.include[k] },
            },
        }));

    const move = (k: GeneralKey, dir: -1 | 1) =>
        setPlan(prev => {
            if (k === 'welcome' || k === 'name') return prev;
            const cur = [...prev.general.order];
            const i = cur.indexOf(k);
            if (i < 0) return prev;
            const j = i + dir;
            if (j < 2 || j >= cur.length) return prev;
            [cur[i], cur[j]] = [cur[j], cur[i]];
            return { ...prev, general: { ...prev.general, order: cur } };
        });

    const setGeneralTemplate = (k: GeneralKey, val: string) =>
        setGeneral({ templates: { ...plan.general.templates, [k]: val } });

    const setPerRole = (idx: number, patch: Partial<ScreeningRoleGroup>) =>
        setPlan(prev => {
            const next = [...prev.perRole];
            next[idx] = { ...next[idx], ...patch };
            return { ...prev, perRole: next };
        });

    const toggleRoleQ = (idx: number, key: RoleKey) =>
        setPlan(prev => {
            const cur = prev.perRole[idx].questions[key];
            const nextGroups = [...prev.perRole];
            nextGroups[idx] = {
                ...nextGroups[idx],
                questions: { ...nextGroups[idx].questions, [key]: { ...cur, enabled: !cur.enabled } },
            };
            return { ...prev, perRole: nextGroups };
        });

    const setRoleTemplate = (idx: number, key: RoleKey, val: string) =>
        setPlan(prev => {
            const cur = prev.perRole[idx].questions[key];
            const nextGroups = [...prev.perRole];
            nextGroups[idx] = {
                ...nextGroups[idx],
                questions: { ...nextGroups[idx].questions, [key]: { ...cur, template: val } },
            };
            return { ...prev, perRole: nextGroups };
        });

    const onVacanciesChange = (idx: number, val: string | string[]) => {
        const arr = Array.isArray(val) ? val : [val];
        const parsed = arr.map(v => Number(v)).filter(n => Number.isInteger(n));
        setPerRole(idx, { vacancyIndexes: parsed });
    };

    const roleSummary = (g: ScreeningRoleGroup) => {
        const enabled = Object.values(g.questions).filter(q => q.enabled).length;
        return `${enabled} pregunta(s) por rol · (${g.vacancyIndexes.length} vacante/s)`;
    };

    return (
        <div className="space-y-5">
            <header className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-gray-700">
                    Vacantes totales: <span className="font-medium">{safeVacancies.length}</span> · Sin asignar{' '}
                    <span className={notAssigned.length ? 'font-medium' : 'text-gray-500'}>{notAssigned.length}</span>
                </div>

                <div className="flex items-center gap-2">
                    {preset.undefinedGroup && (
                        <span className="px-2 py-1 text-xs rounded-md border border-yellow-400 bg-yellow-50 text-yellow-800">
                            Grupo no definido
                        </span>
                    )}

                    {hasRoleQuestions && (
                        <Tooltip
                            side="bottom"
                            content="Configura preguntas por rol y asígnalas a las vacantes pendientes. Se añadirán al flujo de WhatsApp."
                        >
                            <span className="inline-flex">
                                <button
                                    type="button"
                                    onClick={addGroupForRemaining}
                                    disabled={notAssigned.length === 0}
                                    className="px-3 py-2 rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                                >
                                    Agregar grupo para vacantes restantes
                                </button>
                            </span>
                        </Tooltip>
                    )}
                </div>
            </header>

            <section className="border border-gray-200 rounded-md">
                <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold">Preguntas generales</p>
                    <p className="text-xs text-gray-600">
                        “Welcome” va en 1 y “Pregunta de nombre” en 2. Activa y redacta cada mensaje.
                    </p>
                </div>

                <div className="p-4 space-y-3">
                    {plan.general.order.map((k, idx) => {
                        const included = !!plan.general.include[k];
                        return (
                            <div key={k} className="border border-gray-200 rounded-md">
                                <div className="flex items-center justify-between gap-3 px-3 py-2">
                                    <div className="min-w-0">
                                        <p className="text-sm">
                                            <span className="inline-block w-6 text-gray-500">{idx + 1}.</span> {prettyGeneral(k)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleGeneral(k)}
                                            className={[chip, included ? onChip : offChip].join(' ')}
                                            disabled={k === 'welcome' || k === 'name'}
                                            title={k === 'welcome' || k === 'name' ? 'Siempre activado' : undefined}
                                        >
                                            {included ? 'Activo' : 'Inactivo'}
                                        </button>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => move(k, -1)}
                                                className="px-2 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                                                disabled={k === 'welcome' || k === 'name' || idx <= 1}
                                                title="Subir"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => move(k, +1)}
                                                className="px-2 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                                                disabled={k === 'welcome' || k === 'name' || idx >= plan.general.order.length - 1}
                                                title="Bajar"
                                            >
                                                ↓
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {included && (
                                    <div className="px-3 pb-3">
                                        <label className="block mb-1 text-xs text-gray-600">
                                            Mensaje para {prettyGeneral(k)}
                                        </label>
                                        <textarea
                                            rows={k === 'welcome' ? 3 : 2}
                                            value={plan.general.templates[k]}
                                            onChange={(e) => setGeneralTemplate(k, e.target.value)}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="border border-gray-200 rounded-md">
                <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold">Mensaje para agendar entrevista</p>
                    <p className="text-xs text-gray-600">Se enviará al final del flujo de cada rol.</p>
                </div>
                <div className="p-4">
                    <textarea
                        rows={3}
                        value={plan.bookingTemplate}
                        onChange={(e) => setPlan(prev => ({ ...prev, bookingTemplate: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        placeholder="🗓️ Para agendar tu entrevista, elige un horario disponible respondiendo con el número de la opción."
                    />
                </div>
            </section>

            {hasRoleQuestions ? (
                <div className="space-y-3">
                    <p className="text-sm font-semibold">Preguntas por rol</p>

                    {plan.perRole.map((g, i) => (
                        <section key={i} className="border border-gray-200 rounded-md">
                            <div className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate">Grupo #{i + 1}</p>
                                    <p className="text-xs text-gray-600 truncate">{roleSummary(g)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {plan.perRole.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeGroup(i)}
                                            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-gray-200 px-4 py-4 space-y-4">
                                <OptionsSelect
                                    label="Selecciona las vacantes a las que aplica este grupo"
                                    options={vacancyOptions}
                                    multiple
                                    value={g.vacancyIndexes.map(n => String(n))}
                                    onChange={(v) => onVacanciesChange(i, v)}
                                    searchable
                                    placeholder="Vacantes…"
                                />

                                <div className="space-y-2">
                                    {(Object.keys(g.questions) as RoleKey[]).map((rk) => {
                                        const rq = g.questions[rk];
                                        return (
                                            <div key={rk} className="border border-gray-200 rounded-md">
                                                <div className="flex items-center justify-between gap-2 px-3 py-2">
                                                    <span className="text-sm">{prettyRole(rk)}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleRoleQ(i, rk)}
                                                        className={[chip, rq.enabled ? onChip : offChip].join(' ')}
                                                    >
                                                        {rq.enabled ? 'Sí' : 'No'}
                                                    </button>
                                                </div>

                                                {rq.enabled && (
                                                    <div className="px-3 pb-3">
                                                        <label className="block mb-1 text-xs text-gray-600">
                                                            Mensaje para {prettyRole(rk)}
                                                        </label>
                                                        <textarea
                                                            rows={2}
                                                            value={rq.template}
                                                            onChange={(e) => setRoleTemplate(i, rk, e.target.value)}
                                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    <p className="text-xs text-gray-500">
                                        Los textos vienen prellenados usando tu configuración (documentos, certificaciones, banco).
                                    </p>
                                </div>
                            </div>
                        </section>
                    ))}

                    <Tooltip side="bottom" content="Copia la configuración del primer grupo para las vacantes sin grupo.">
                        <span className="inline-flex">
                            <button
                                type="button"
                                onClick={addGroupForRemaining}
                                disabled={notAssigned.length === 0}
                                className="px-3 py-2 rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                            >
                                Agregar grupo para vacantes restantes
                            </button>
                        </span>
                    </Tooltip>
                </div>
            ) : (
                <p className="text-xs text-gray-500">
                    Este tipo muestra la mayoría de preguntas en el set general. Al final se enviará el mensaje de entrevista configurado arriba.
                </p>
            )}
        </div>
    );
}
