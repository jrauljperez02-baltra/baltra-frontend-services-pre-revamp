'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import OptionsSelect from '@/views/progressive-form/components/OptionsSelect';
import type { Vacancy } from '@/types/progressive-form';
import Tooltip from '@/views/progressive-form/tools/Tooltip';

export type DocumentKey =
    | 'ine'
    | 'curp'
    | 'sat'
    | 'imss'
    | 'comprobante_domicilio'
    | 'comprobante_estudios'
    | 'acta_nacimiento'
    | 'solicitud_empleo'
    | 'cartilla_militar'
    | 'antecedentes_penales'
    | 'cv'
    | 'constancias_laborales'
    | 'fotos_infantil'
    | 'acta_beneficiario'
    | 'cuenta_bancaria';

export type DocMode = 'none' | 'reminder' | 'required';

export type DocumentsGroup = {
    appliesToAll: boolean;
    vacancyIndexes: number[];
    documents: Record<DocumentKey, DocMode>;
    discardIfNoDocs: boolean | null;
};

const DOCS: { key: DocumentKey; label: string }[] = [
    { key: 'ine', label: 'INE' },
    { key: 'curp', label: 'CURP' },
    { key: 'sat', label: 'Constancia fiscal (SAT)' },
    { key: 'imss', label: 'Número del IMSS' },
    { key: 'comprobante_domicilio', label: 'Comprobante de domicilio' },
    { key: 'comprobante_estudios', label: 'Comprobante de estudios' },
    { key: 'acta_nacimiento', label: 'Acta de nacimiento' },
    { key: 'solicitud_empleo', label: 'Solicitud de empleo' },
    { key: 'cartilla_militar', label: 'Cartilla militar' },
    { key: 'antecedentes_penales', label: 'Antecedentes penales' },
    { key: 'cv', label: 'Currículum' },
    { key: 'constancias_laborales', label: 'Constancias laborales' },
    { key: 'fotos_infantil', label: 'Fotos tamaño infantil' },
    { key: 'acta_beneficiario', label: 'Acta de nacimiento de beneficiario' },
    { key: 'cuenta_bancaria', label: 'Cuenta bancaria' },
];

const pillBase = 'px-3 py-2 rounded-md border transition-colors text-sm select-none';
const pillOn = 'bg-baltra-600 text-white border-baltra';
const pillOff = 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50';

interface Props {
    vacancies: Vacancy[];
    value?: DocumentsGroup[];
    onChange: (groups: DocumentsGroup[]) => void;
}

function defaultDocuments(): Record<DocumentKey, DocMode> {
    return DOCS.reduce((acc, d) => {
        acc[d.key] = 'none';
        return acc;
    }, {} as Record<DocumentKey, DocMode>);
}

function makeDefaultGroup(appliesToAll = false): DocumentsGroup {
    return {
        appliesToAll,
        vacancyIndexes: [],
        documents: defaultDocuments(),
        discardIfNoDocs: null,
    };
}

export default function DocumentsRequirements({ vacancies, value, onChange }: Props) {
    const [groups, setGroups] = useState<DocumentsGroup[]>(
        Array.isArray(value) && value.length ? value : [makeDefaultGroup(false)]
    );
    const [openIndex, setOpenIndex] = useState<number>(0);

    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        onChangeRef.current(groups);
    }, [groups]);

    const vacancyOptions = useMemo(
        () =>
            (vacancies || []).map((v, i) => ({
                label: v.roleName?.trim() || `Vacante #${i + 1}`,
                value: String(i),
            })),
        [vacancies]
    );

    // Vacantes no cubiertas por ningún grupo
    const assignedSet = useMemo(() => {
        const set = new Set<number>();
        for (const g of groups) {
            if (g.appliesToAll) {
                for (let i = 0; i < vacancies.length; i++) set.add(i);
            } else {
                for (const vi of g.vacancyIndexes || []) set.add(vi);
            }
        }
        return set;
    }, [groups, vacancies.length]);

    const notAssigned = useMemo(() => {
        const missing: number[] = [];
        for (let i = 0; i < vacancies.length; i++) if (!assignedSet.has(i)) missing.push(i);
        return missing;
    }, [assignedSet, vacancies.length]);

    const toggleOpen = (idx: number) => setOpenIndex(cur => (cur === idx ? -1 : idx));

    const addGroupForRemaining = () => {
        if (!notAssigned.length) return;
        setGroups(prev => [...prev, { ...makeDefaultGroup(false), vacancyIndexes: notAssigned }]);
        setOpenIndex(groups.length);
    };

    const removeGroup = (idx: number) => {
        setGroups(prev => prev.filter((_, i) => i !== idx));
        setOpenIndex(cur => (cur === idx ? -1 : cur > idx ? cur - 1 : cur));
    };

    const setGroup = <K extends keyof DocumentsGroup>(idx: number, key: K, val: DocumentsGroup[K]) => {
        setGroups(prev => {
            const next = [...prev];
            let g = { ...next[idx], [key]: val };

            if (key === 'appliesToAll' && val === true) {
                g.vacancyIndexes = [];
                // si aplica a todas, debe ser el único grupo
                next.splice(0, next.length, g);
                return next;
            }

            next[idx] = g;
            return next;
        });
    };

    const onVacanciesChange = (idx: number, arr: string | string[]) => {
        const vals = Array.isArray(arr) ? arr : [arr];
        const indexes = vals.map(v => Number(v)).filter(n => !Number.isNaN(n));
        setGroup(idx, 'vacancyIndexes', indexes);
    };

    const setDocMode = (idx: number, key: DocumentKey, mode: DocMode) => {
        setGroups(prev => {
            const next = [...prev];
            const docs = { ...(next[idx].documents || defaultDocuments()) };
            docs[key] = mode;
            next[idx] = { ...next[idx], documents: docs };
            return next;
        });
    };

    const summary = (g: DocumentsGroup) => {
        const req = Object.values(g.documents || {}).filter(m => m === 'required').length;
        const rem = Object.values(g.documents || {}).filter(m => m === 'reminder').length;
        const scope = g.appliesToAll ? '(todas)' : `(${g.vacancyIndexes?.length ?? 0} vacante/s)`;
        return `${req} necesarios · ${rem} recordatorios ${scope}`;
    };

    return (
        <div className="space-y-4">
            {/* Header con métricas y botón, igual que Turnos */}
            <header className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-gray-700">
                    Vacantes totales: <span className="font-medium">{vacancies.length}</span> · Sin asignar:{' '}
                    <span className={notAssigned.length ? 'font-medium' : 'text-gray-500'}>
                        {notAssigned.length}
                    </span>
                </div>
                <Tooltip
                    side="bottom"
                    content="Configura características por vacante. Crea un grupo por configuración y asígnalo a las vacantes que necesites. Este botón añade un grupo para las vacantes que aún no tienen uno."
                >
                    <span className="inline-flex">
                        <button
                            type="button"
                            onClick={addGroupForRemaining}
                            disabled={notAssigned.length === 0}
                            className="px-3 py-2 rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                        >
                            Agregar rango para vacantes restantes
                        </button>
                    </span>
                </Tooltip>
            </header>

            <div className="space-y-3">
                {groups.map((g, i) => {
                    const opened = openIndex === i;

                    return (
                        <section key={i} className="border border-gray-200 rounded-md">
                            {/* Encabezado del grupo (igual patrón que Turnos) */}
                            <div className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate">Grupo #{i + 1}</p>
                                    <p className="text-xs text-gray-600 truncate">{summary(g)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => toggleOpen(i)}
                                        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                                    >
                                        {opened ? 'Cerrar' : 'Abrir'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeGroup(i)}
                                        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>

                            {opened && (
                                <div className="border-t border-gray-200 px-4 py-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        {/* ¿Aplica a todas? (misma colocación que Turnos) */}
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={g.appliesToAll}
                                                onChange={e => setGroup(i, 'appliesToAll', e.target.checked)}
                                            />
                                            ¿Esta configuración aplica a <b>todas</b> las vacantes?
                                        </label>

                                        {/* Lista scrollable de documentos */}
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Documentos</p>
                                            <div className="border border-gray-200 rounded-md">
                                                <div className="max-h-64 overflow-y-auto divide-y">
                                                    {DOCS.map(doc => {
                                                        const mode = g.documents?.[doc.key] ?? 'none';
                                                        return (
                                                            <div
                                                                key={doc.key}
                                                                className="flex items-center justify-between gap-3 px-3 py-2"
                                                            >
                                                                <span className="text-sm text-gray-800">{doc.label}</span>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setDocMode(i, doc.key, 'none')}
                                                                        className={`${pillBase} ${mode === 'none' ? pillOn : pillOff}`}
                                                                    >
                                                                        Ninguno
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setDocMode(i, doc.key, 'reminder')}
                                                                        className={`${pillBase} ${mode === 'reminder' ? pillOn : pillOff}`}
                                                                    >
                                                                        Recordatorio
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setDocMode(i, doc.key, 'required')}
                                                                        className={`${pillBase} ${mode === 'required' ? pillOn : pillOff}`}
                                                                    >
                                                                        Necesario
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Usa “Ninguno” para no solicitar ese documento; “Recordatorio” para
                                                sugerirlo; “Necesario” para requerirlo.
                                            </p>
                                        </div>

                                        {/* Descarte por ausencia de documentos */}
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Descartar si no tienen documentos</p>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setGroup(i, 'discardIfNoDocs', true)}
                                                    className={`${pillBase} ${g.discardIfNoDocs === true ? pillOn : pillOff}`}
                                                >
                                                    Sí
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setGroup(i, 'discardIfNoDocs', false)}
                                                    className={`${pillBase} ${g.discardIfNoDocs === false ? pillOn : pillOff}`}
                                                >
                                                    No
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Si seleccionas “Sí”, un candidato sin los documentos marcados como{' '}
                                                <b>Necesario</b> será descartado.
                                            </p>
                                        </div>

                                        {/* Selección de vacantes cuando NO aplica a todas */}
                                        {!g.appliesToAll && (
                                            <OptionsSelect
                                                label="Selecciona las vacantes a las que aplica este grupo"
                                                options={vacancyOptions}
                                                multiple
                                                value={(g.vacancyIndexes || []).map(n => String(n))}
                                                onChange={arr => onVacanciesChange(i, arr)}
                                                searchable
                                                placeholder="Vacantes…"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
