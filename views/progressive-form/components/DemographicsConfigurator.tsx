'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import OptionsSelect from '@/views/progressive-form/components/OptionsSelect';
import type {
    Vacancy,
    DemographicGroup,
    EducationLevel,
} from '@/types/progressive-form';
import Tooltip from '@/views/progressive-form/tools/Tooltip';

interface Props {
    vacancies: Vacancy[];
    value?: DemographicGroup[];
    onChange: (groups: DemographicGroup[]) => void;
}

const EDUCATION_LEVELS: { label: string; value: EducationLevel }[] = [
    { label: 'Primaria', value: 'Primaria' },
    { label: 'Secundaria', value: 'Secundaria' },
    { label: 'Preparatoria/Bachillerato', value: 'Preparatoria' },
    { label: 'Técnico', value: 'Técnico' },
    { label: 'Licenciatura', value: 'Licenciatura' },
    { label: 'Maestría', value: 'Maestría' },
    { label: 'Doctorado', value: 'Doctorado' },
];

const defaultGroup = (): DemographicGroup => ({
    minAge: 18,
    maxAge: 60,
    appliesToAll: false,
    vacancyIndexes: [],
    education: 'Preparatoria',
});

export default function DemographicsConfigurator({ vacancies, value, onChange }: Props) {
    const [groups, setGroups] = useState<DemographicGroup[]>(
        Array.isArray(value) && value.length ? value : [defaultGroup()]
    );

    const [openIndex, setOpenIndex] = useState<number>(0); // solo uno abierto

    // Evita loops con StrictMode
    const onChangeRef = useRef(onChange);
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
    useEffect(() => { onChangeRef.current(groups); }, [groups]);

    // Opciones de vacantes para selects
    const vacancyOptions = useMemo(
        () =>
            vacancies.map((v, i) => ({
                label: `${v.roleName?.trim() || `Vacante #${i + 1}`}`,
                value: String(i),
            })),
        [vacancies]
    );

    // Conjunto de asignaciones actual
    const assignedSet = useMemo(() => {
        const set = new Set<number>();
        for (const g of groups) {
            for (const idx of g.vacancyIndexes) set.add(idx);
            if (g.appliesToAll) {
                // si un grupo aplica a todas, conceptualmente cubre todas
                for (let i = 0; i < vacancies.length; i++) set.add(i);
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
            {
                ...defaultGroup(),
                vacancyIndexes: notAssigned,
            },
        ]);
        setOpenIndex(groups.length); // abrir el nuevo
    };

    const removeGroup = (idx: number) => {
        setGroups(prev => prev.filter((_, i) => i !== idx));
        setOpenIndex(cur => (cur === idx ? -1 : cur > idx ? cur - 1 : cur));
    };

    const setGroup = <K extends keyof DemographicGroup>(
        idx: number,
        key: K,
        val: DemographicGroup[K]
    ) => {
        setGroups(prev => {
            const next = [...prev];
            const g = { ...next[idx], [key]: val };

            // Reglas especiales
            if (key === 'appliesToAll') {
                if (val === true) {
                    // Si este grupo aplica a todas, lo mantenemos y descartamos los demás para evitar inconsistencias
                    g.vacancyIndexes = [];
                    g.appliesToAll = true;
                    return [g];
                } else {
                    // Si se desactiva, queda con selección manual
                    g.appliesToAll = false;
                }
            }

            // Limitar edades
            if (key === 'minAge') {
                g.minAge = Math.max(18, Math.min(Number(val), 60));
                if (g.minAge > g.maxAge) g.maxAge = g.minAge;
            }
            if (key === 'maxAge') {
                g.maxAge = Math.max(18, Math.min(Number(val), 60));
                if (g.maxAge < g.minAge) g.minAge = g.maxAge;
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
                            Agregar rango para vacantes restantes
                        </button>
                    </span>
                </Tooltip>
            </header>

            <div className="space-y-3">
                {groups.map((g, i) => {
                    const opened = openIndex === i;
                    const label = g.appliesToAll
                        ? `Rango ${g.minAge}–${g.maxAge} · ${g.education} (todas las vacantes)`
                        : `Rango ${g.minAge}–${g.maxAge} · ${g.education} (${g.vacancyIndexes.length} vacante/s)`;

                    return (
                        <section key={i} className="border border-gray-200 rounded-md">
                            {/* Header */}
                            <div className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate">Grupo #{i + 1}</p>
                                    <p className="text-xs text-gray-600 truncate">{label}</p>
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

                            {/* Panel */}
                            {opened && (
                                <div className="border-t border-gray-200 px-4 py-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Aplica a todas */}
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={g.appliesToAll}
                                                onChange={(e) => setGroup(i, 'appliesToAll', e.target.checked)}
                                            />
                                            ¿Este rango aplica a <b>todas</b> las vacantes?
                                        </label>

                                        {/* Rango de edad */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium">Edad mínima</label>
                                                <input
                                                    type="number"
                                                    min={18}
                                                    max={60}
                                                    value={g.minAge}
                                                    onChange={(e) => setGroup(i, 'minAge', Number(e.target.value))}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium">Edad máxima</label>
                                                <input
                                                    type="number"
                                                    min={18}
                                                    max={60}
                                                    value={g.maxAge}
                                                    onChange={(e) => setGroup(i, 'maxAge', Number(e.target.value))}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                />
                                            </div>
                                        </div>

                                        {/* Nivel educativo */}
                                        <div>
                                            <label className="block mb-2 text-sm font-medium">Nivel educativo concluido</label>
                                            <OptionsSelect
                                                label=""
                                                options={EDUCATION_LEVELS}
                                                multiple={false}
                                                value={g.education}
                                                onChange={(v) => setGroup(i, 'education', String(v) as EducationLevel)}
                                                placeholder="Selecciona un nivel"
                                            />
                                        </div>

                                        {/* Selección de vacantes (si NO aplica a todas) */}
                                        {!g.appliesToAll && (
                                            <div>
                                                <OptionsSelect
                                                    label="Selecciona las vacantes a las que aplica este rango"
                                                    options={vacancyOptions}
                                                    multiple
                                                    value={g.vacancyIndexes.map(n => String(n))}
                                                    onChange={(arr) => onVacanciesChange(i, arr)}
                                                    searchable
                                                    placeholder="Vacantes…"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Consejo: usa varios grupos si diferentes vacantes requieren distintos rangos.
                                                </p>
                                            </div>
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
