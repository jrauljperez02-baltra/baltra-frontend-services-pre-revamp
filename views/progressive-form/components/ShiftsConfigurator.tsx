'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import InputText from '@/views/progressive-form/components/InputText';
import OptionsSelect from '@/views/progressive-form/components/OptionsSelect';
import type { Vacancy, ShiftGroup } from '@/types/progressive-form';
import Tooltip from '@/views/progressive-form/tools/Tooltip';

interface Props {
    vacancies: Vacancy[];
    value?: ShiftGroup[];
    onChange: (groups: ShiftGroup[]) => void;
}

type ExtendedShiftGroup = ShiftGroup & {
    breaksNote?: string;
    discardIfCannotWorkShift?: boolean | null;
};

const defaultGroup = (): ExtendedShiftGroup => ({
    shift: '',
    includeBreaks: true,
    appliesToAll: false,
    vacancyIndexes: [],
    breaksNote: '',
    discardIfCannotWorkShift: null,
});

export default function ShiftsConfigurator({ vacancies, value, onChange }: Props) {
    const initial: ExtendedShiftGroup[] =
        Array.isArray(value) && value.length
            ? value.map(v => ({ ...defaultGroup(), ...v }))
            : [defaultGroup()];

    const [groups, setGroups] = useState<ExtendedShiftGroup[]>(initial);
    const [openIndex, setOpenIndex] = useState<number>(0);

    const onChangeRef = useRef(onChange);
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
    useEffect(() => { onChangeRef.current(groups as unknown as ShiftGroup[]); }, [groups]);

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

    const setGroup = <K extends keyof ExtendedShiftGroup>(idx: number, key: K, val: ExtendedShiftGroup[K]) => {
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

    const summary = (g: ExtendedShiftGroup) => {
        const s = g.shift?.trim() ? g.shift : 'Turno sin definir';
        const breaks = `descansos: ${g.includeBreaks ? 'sí' : 'no'}`;
        const discard =
            typeof g.discardIfCannotWorkShift === 'boolean'
                ? ` · descartar si no puede: ${g.discardIfCannotWorkShift ? 'sí' : 'no'}`
                : '';
        return `${s} · ${breaks}${discard} ${g.appliesToAll ? '(todas)' : `(${g.vacancyIndexes.length} vacante/s)`}`;
    };

    return (
        <div className="space-y-4">
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
                                        {/* Aplica a todas */}
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={g.appliesToAll}
                                                onChange={(e) => setGroup(i, 'appliesToAll', e.target.checked)}
                                            />
                                            ¿Esta configuración aplica a <b>todas</b> las vacantes?
                                        </label>

                                        {/* Turno */}
                                        <div>
                                            <InputText
                                                label="¿Cuál es el turno?"
                                                value={g.shift}
                                                onChange={(val) => setGroup(i, 'shift', val)}
                                                maxLength={120}
                                                required
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Ejemplos: “12 horas rotativo”, “Fijo matutino 8h”, “Rotativo 6x1”, etc.
                                            </p>
                                        </div>

                                        {/* Descansos */}
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">¿Cómo funcionan los descansos?</p>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setGroup(i, 'includeBreaks', true)}
                                                    className={[
                                                        'px-3 py-2 rounded-md border text-sm select-none transition-colors',
                                                        g.includeBreaks
                                                            ? 'bg-baltra-600 text-white border-baltra'
                                                            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50',
                                                    ].join(' ')}
                                                >
                                                    Incluye descansos (Sí)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setGroup(i, 'includeBreaks', false)}
                                                    className={[
                                                        'px-3 py-2 rounded-md border text-sm select-none transition-colors',
                                                        !g.includeBreaks
                                                            ? 'bg-baltra-600 text-white border-baltra'
                                                            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50',
                                                    ].join(' ')}
                                                >
                                                    No incluye descansos (No)
                                                </button>
                                            </div>

                                            {/* NUEVO: Detalles de descansos */}
                                            {g.includeBreaks && (
                                                <div className="mt-2">
                                                    <InputText
                                                        label="Detalles de los descansos"
                                                        value={g.breaksNote ?? ''}
                                                        onChange={(val) => setGroup(i, 'breaksNote', val)}
                                                        maxLength={160}
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Ej.: “Un día de descanso entre semana”, “30 min cada 4 horas”, etc.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* NUEVO: Descarte por incompatibilidad de turno */}
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">¿Descartar candidato si no puede trabajar este turno?</p>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setGroup(i, 'discardIfCannotWorkShift', true)}
                                                    className={[
                                                        'px-3 py-2 rounded-md border text-sm select-none transition-colors',
                                                        g.discardIfCannotWorkShift === true
                                                            ? 'bg-baltra-600 text-white border-baltra'
                                                            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50',
                                                    ].join(' ')}
                                                >
                                                    Sí
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setGroup(i, 'discardIfCannotWorkShift', false)}
                                                    className={[
                                                        'px-3 py-2 rounded-md border text-sm select-none transition-colors',
                                                        g.discardIfCannotWorkShift === false
                                                            ? 'bg-baltra-600 text-white border-baltra'
                                                            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50',
                                                    ].join(' ')}
                                                >
                                                    No
                                                </button>
                                            </div>
                                            {g.discardIfCannotWorkShift === true && (
                                                <p className="text-xs text-gray-600">
                                                    Se <b>descartará</b> al candidato si declara que no puede cubrir este horario.
                                                </p>
                                            )}
                                        </div>

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
