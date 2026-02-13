'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import InputText from '@/views/progressive-form/components/InputText';
import OptionsSelect from '@/views/progressive-form/components/OptionsSelect';
import Tooltip from '@/views/progressive-form/tools/Tooltip';
import type { Vacancy } from '@/types/progressive-form';

export type InterviewGroup = {
    askFor: string;
    directions: string;
    transportRoutes: string;
    appliesToAll: boolean;
    vacancyIndexes: number[];
};

interface Props {
    vacancies: Vacancy[];
    value?: InterviewGroup[];
    onChange: (groups: InterviewGroup[]) => void;
}

const defaultGroup = (): InterviewGroup => ({
    askFor: '',
    directions: '',
    transportRoutes: '',
    appliesToAll: false,
    vacancyIndexes: [],
});

export default function InterviewsConfigurator({ vacancies, value, onChange }: Props) {
    const [groups, setGroups] = useState<InterviewGroup[]>(
        Array.isArray(value) && value.length ? value : [defaultGroup()]
    );
    const [openIndex, setOpenIndex] = useState<number>(0);

    const onChangeRef = useRef(onChange);
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
    useEffect(() => { onChangeRef.current(groups); }, [groups]);

    const vacancyOptions = useMemo(
        () =>
            vacancies.map((v, i) => ({
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
                for (const vi of g.vacancyIndexes) set.add(vi);
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

    const toggleOpen = (idx: number) => setOpenIndex(cur => (cur === idx ? -1 : idx));

    const addGroupForRemaining = () => {
        if (notAssigned.length === 0) return;
        setGroups(prev => [
            ...prev,
            { ...defaultGroup(), vacancyIndexes: notAssigned },
        ]);
        setOpenIndex(groups.length);
    };

    const removeGroup = (idx: number) => {
        setGroups(prev => prev.filter((_, i) => i !== idx));
        setOpenIndex(cur => (cur === idx ? -1 : cur > idx ? cur - 1 : cur));
    };

    const setGroup = <K extends keyof InterviewGroup>(idx: number, key: K, val: InterviewGroup[K]) => {
        setGroups(prev => {
            const next = [...prev];
            let g = { ...next[idx], [key]: val };

            if (key === 'appliesToAll' && val === true) {
                g.vacancyIndexes = [];
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

    const summary = (g: InterviewGroup) => {
        const who = g.askFor?.trim() ? `preguntar por: ${g.askFor.trim()}` : 'sin contacto definido';
        const routes = g.transportRoutes?.trim() ? 'con rutas' : 'sin rutas';
        return `${who} · ${routes} ${g.appliesToAll ? '(todas)' : `(${g.vacancyIndexes.length} vacante/s)`}`;
    };

    return (
        <div className="space-y-4">
            <header className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-gray-700">
                    Vacantes totales: <span className="font-medium">{vacancies.length}</span>{' '}
                    · Sin asignar:{' '}
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
                            Agregar grupo para vacantes restantes
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
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={g.appliesToAll}
                                                onChange={(e) => setGroup(i, 'appliesToAll', e.target.checked)}
                                            />
                                            ¿Esta configuración aplica a <b>todas</b> las vacantes?
                                        </label>

                                        {!g.appliesToAll && (
                                            <OptionsSelect
                                                label="Selecciona las vacantes a las que aplica este grupo"
                                                options={vacancyOptions}
                                                multiple
                                                value={g.vacancyIndexes.map(n => String(n))}
                                                onChange={(arr) => onVacanciesChange(i, arr)}
                                                searchable
                                                placeholder="Vacantes…"
                                            />
                                        )}

                                        <div>
                                            <InputText
                                                label="¿Por quién pregunto?"
                                                value={g.askFor}
                                                onChange={(val) => setGroup(i, 'askFor', val)}
                                                maxLength={120}
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium">Instrucciones para llegar</label>
                                            <textarea
                                                rows={4}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                value={g.directions}
                                                onChange={(e) => setGroup(i, 'directions', e.target.value)}
                                                placeholder="Referencias, acceso a planta/edificio, punto de entrada, etc."
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium">Rutas de transporte</label>
                                            <textarea
                                                rows={4}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                value={g.transportRoutes}
                                                onChange={(e) => setGroup(i, 'transportRoutes', e.target.value)}
                                                placeholder="Líneas/ramales, estaciones/paradas cercanas, transbordes, tiempos aproximados…"
                                            />
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
