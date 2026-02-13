
'use client';

import { useEffect, useMemo, useState } from 'react';
import OptionsSelect from '@/views/progressive-form/components/OptionsSelect';
import type { Vacancy } from '@/types/progressive-form';
import Tooltip from '@/views/progressive-form/tools/Tooltip';

type ExtraQA = { question: string; answer: string };

export type TransportCertsExtrasGroup = {
    appliesToAll?: boolean;
    vacancyIndexes?: number[];
    transport: {
        hasTransport: boolean | null;
        note?: string;
        routesNote?: string;
    };
    certifications: {
        required: boolean | null;
        discardIfMissing: boolean | null;
        name?: string;
    };
    extras: ExtraQA[];
};

interface Props {
    vacancies: Vacancy[];
    value?: TransportCertsExtrasGroup[];
    onChange: (groups: TransportCertsExtrasGroup[]) => void;
    title?: string;
}

const pillBase = 'px-3 py-2 rounded-md border transition-colors text-sm select-none';
const pillOn = 'bg-baltra-600 text-white border-baltra';
const pillOff = 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50';

const defaultGroup = (): TransportCertsExtrasGroup => ({
    appliesToAll: false,
    vacancyIndexes: [],
    transport: { hasTransport: null, note: '', routesNote: '' },
    certifications: { required: null, discardIfMissing: null, name: '' },
    extras: [],
});

export default function TransportCertsExtras({
    vacancies,
    value,
    onChange,
    title = 'Transporte, Certificaciones y Otras preguntas',
}: Props) {
    const [groups, setGroups] = useState<TransportCertsExtrasGroup[]>(
        Array.isArray(value) && value.length ? value : [defaultGroup()]
    );
    const [openIndex, setOpenIndex] = useState<number>(0);

    useEffect(() => {
        onChange(groups);
    }, [groups, onChange]);

    const vacOptions = useMemo(
        () =>
            (vacancies || []).map((v, i) => ({
                label: v.roleName?.trim() || `Vacante #${i + 1}`,
                value: String(i),
            })),
        [vacancies]
    );

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
        for (let i = 0; i < vacancies.length; i++) {
            if (!assignedSet.has(i)) missing.push(i);
        }
        return missing;
    }, [assignedSet, vacancies.length]);

    const toggleOpen = (idx: number) => setOpenIndex((cur) => (cur === idx ? -1 : idx));

    const addGroupForRemaining = () => {
        if (notAssigned.length === 0) return;
        setGroups((prev) => [...prev, { ...defaultGroup(), vacancyIndexes: notAssigned }]);
        setOpenIndex(groups.length);
    };

    const removeGroup = (idx: number) => {
        setGroups((prev) => prev.filter((_, i) => i !== idx));
        setOpenIndex((cur) => (cur === idx ? -1 : cur > idx ? cur - 1 : cur));
    };

    const setGroup = <K extends keyof TransportCertsExtrasGroup>(
        idx: number,
        key: K,
        val: TransportCertsExtrasGroup[K]
    ) => {
        setGroups((prev) => {
            const next = [...prev];
            let g: TransportCertsExtrasGroup = { ...next[idx], [key]: val };
            if (key === 'appliesToAll' && val === true) {
                g.vacancyIndexes = [];
                next.splice(0, next.length, g);
                return next;
            }
            next[idx] = g;
            return next;
        });
    };

    const setTransport = <K extends keyof TransportCertsExtrasGroup['transport']>(
        idx: number,
        key: K,
        val: TransportCertsExtrasGroup['transport'][K]
    ) => {
        setGroups((prev) => {
            const next = [...prev];
            const curr = next[idx].transport || { hasTransport: null, note: '', routesNote: '' };
            next[idx] = { ...next[idx], transport: { ...curr, [key]: val } };
            return next;
        });
    };

    const setCerts = <K extends keyof TransportCertsExtrasGroup['certifications']>(
        idx: number,
        key: K,
        val: TransportCertsExtrasGroup['certifications'][K]
    ) => {
        setGroups((prev) => {
            const next = [...prev];
            const curr =
                next[idx].certifications || ({
                    required: null,
                    discardIfMissing: null,
                    name: '',
                } as TransportCertsExtrasGroup['certifications']);
            next[idx] = { ...next[idx], certifications: { ...curr, [key]: val } };
            return next;
        });
    };

    const addGroup = () => setGroups((prev) => [...prev, defaultGroup()]);

    const addExtra = (idx: number) => {
        setGroups((prev) => {
            const next = [...prev];
            const arr = next[idx].extras || [];
            next[idx] = { ...next[idx], extras: [...arr, { question: '', answer: '' }] };
            return next;
        });
    };

    const updateExtra = (idx: number, extraIdx: number, key: keyof ExtraQA, val: string) => {
        setGroups((prev) => {
            const next = [...prev];
            const arr = [...(next[idx].extras || [])];
            arr[extraIdx] = { ...arr[extraIdx], [key]: val };
            next[idx] = { ...next[idx], extras: arr };
            return next;
        });
    };

    const removeExtra = (idx: number, extraIdx: number) => {
        setGroups((prev) => {
            const next = [...prev];
            const arr = [...(next[idx].extras || [])];
            arr.splice(extraIdx, 1);
            next[idx] = { ...next[idx], extras: arr };
            return next;
        });
    };

    const onVacancySelectChange = (idx: number, val: string | string[]) => {
        const arr = Array.isArray(val) ? val : val ? [val] : [];
        const parsed = arr.map((v) => Number(v)).filter((n) => Number.isInteger(n));
        setGroup(idx, 'vacancyIndexes', parsed);
    };

    const summary = (g: TransportCertsExtrasGroup) => {
        const t =
            g.transport?.hasTransport === true
                ? 'transporte: sí'
                : g.transport?.hasTransport === false
                ? 'transporte: no'
                : 'transporte: —';
        const c =
            g.certifications?.required === true
                ? 'certificación: requerida'
                : g.certifications?.required === false
                ? 'certificación: no'
                : 'certificación: —';
        const scope = g.appliesToAll ? '(todas)' : `(${g.vacancyIndexes?.length || 0} vacante/s)`;
        return `${t} · ${c} ${scope}`;
    };

    return (
        <div className="space-y-4">
            <header className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-gray-700">
                    Vacantes totales: <span className="font-medium">{vacancies.length}</span> · Sin asignar:{' '}
                    <span className={notAssigned.length ? 'font-medium' : 'text-gray-500'}>{notAssigned.length}</span>
                </div>
                <Tooltip
                    side="bottom"
                    content="Configura por vacante. Crea grupos según la configuración y asígnalos a las vacantes que quieras."
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
                            <div className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate">Grupo #{i + 1}</p>
                                    <p className="text-xs text-gray-600 truncate">{summary(g)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setOpenIndex((cur) => (cur === i ? -1 : i))}
                                        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                                    >
                                        {opened ? 'Cerrar' : 'Abrir'}
                                    </button>
                                    {groups.length > 1 && (
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

                            {opened && (
                                <div className="border-t border-gray-200 px-4 py-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={!!g.appliesToAll}
                                                onChange={(e) => setGroup(i, 'appliesToAll', e.target.checked)}
                                            />
                                            ¿Esta configuración aplica a <b>todas</b> las vacantes?
                                        </label>

                                        {!g.appliesToAll && (
                                            <OptionsSelect
                                                label="Selecciona las vacantes a las que aplica este grupo"
                                                options={vacOptions}
                                                multiple
                                                value={(g.vacancyIndexes || []).map((n) => String(n))}
                                                onChange={(v) => onVacancySelectChange(i, v)}
                                                searchable
                                                placeholder="Vacantes…"
                                            />
                                        )}

                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Transporte</p>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setTransport(i, 'hasTransport', true)}
                                                    className={`${pillBase} ${g.transport?.hasTransport === true ? pillOn : pillOff}`}
                                                >
                                                    Sí, cuentan con transporte
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTransport(i, 'hasTransport', false)}
                                                    className={`${pillBase} ${g.transport?.hasTransport === false ? pillOn : pillOff}`}
                                                >
                                                    No cuentan con transporte
                                                </button>
                                            </div>

                                            {g.transport?.hasTransport === true && (
                                                <div className="mt-2">
                                                    <label className="block mb-2 text-sm font-medium">Detalles de las rutas</label>
                                                    <textarea
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                        rows={4}
                                                        value={g.transport?.routesNote || ''}
                                                        onChange={(e) => setTransport(i, 'routesNote', e.target.value)}
                                                        placeholder="Describe rutas, horarios, puntos de abordaje, costo, etc."
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Certificaciones</p>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setCerts(i, 'required', true)}
                                                    className={`${pillBase} ${g.certifications?.required === true ? pillOn : pillOff}`}
                                                >
                                                    Se requiere certificación
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCerts(i, 'required', false)}
                                                    className={`${pillBase} ${g.certifications?.required === false ? pillOn : pillOff}`}
                                                >
                                                    No se requiere
                                                </button>
                                            </div>

                                            {g.certifications?.required === true && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block mb-2 text-sm font-medium">Nombre de la certificación</label>
                                                        <input
                                                            type="text"
                                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                            value={g.certifications?.name || ''}
                                                            onChange={(e) => setCerts(i, 'name', e.target.value)}
                                                            placeholder="Ej. DC-3, OSHA, AWS D1.1, etc."
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block mb-2 text-sm font-medium">Descartar por falta de certificación</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setCerts(i, 'discardIfMissing', true)}
                                                                className={`${pillBase} ${g.certifications?.discardIfMissing === true ? pillOn : pillOff}`}
                                                            >
                                                                Sí
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setCerts(i, 'discardIfMissing', false)}
                                                                className={`${pillBase} ${g.certifications?.discardIfMissing === false ? pillOn : pillOff}`}
                                                            >
                                                                No
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium">Otras preguntas</p>
                                                <button
                                                    type="button"
                                                    onClick={() => addExtra(i)}
                                                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                                                >
                                                    Agregar pregunta
                                                </button>
                                            </div>

                                            {(g.extras || []).length === 0 && (
                                                <p className="text-xs text-gray-500">No has agregado preguntas adicionales.</p>
                                            )}

                                            <div className="space-y-3">
                                                {(g.extras || []).map((row, ri) => (
                                                    <div key={ri} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                                                        <div className="sm:col-span-5">
                                                            <label className="block mb-2 text-sm font-medium">Pregunta</label>
                                                            <input
                                                                type="text"
                                                                value={row.question}
                                                                onChange={(e) => updateExtra(i, ri, 'question', e.target.value)}
                                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                                placeholder="Ej. ¿Trabajo en altura?"
                                                            />
                                                        </div>
                                                        <div className="sm:col-span-6">
                                                            <label className="block mb-2 text-sm font-medium">Respuesta</label>
                                                            <input
                                                                type="text"
                                                                value={row.answer}
                                                                onChange={(e) => updateExtra(i, ri, 'answer', e.target.value)}
                                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                                placeholder="Ej. Sí, con arnés certificado"
                                                            />
                                                        </div>
                                                        <div className="sm:col-span-1 flex sm:justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeExtra(i, ri)}
                                                                className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                                                                title="Eliminar"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <p className="text-xs text-gray-500">
                                                Estas preguntas aplican según el alcance seleccionado del grupo (todas o vacantes específicas).
                                            </p>
                                        </div>
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
