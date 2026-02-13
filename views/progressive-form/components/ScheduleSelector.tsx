'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ScheduleSlot } from '@/types/progressive-form';

type ScheduleSelectorValue = {
    slots: ScheduleSlot[];
    days: string[];
    times: string[];
    excludedDates: string[];
    excludedTimes: string[];
    slotDurationMin: number;
};

type Props =
    | {
        value: ScheduleSlot[] | undefined;
        onChange: (slots: ScheduleSlot[] | ScheduleSelectorValue) => void;
    }
    | {
        value: ScheduleSelectorValue | undefined;
        onChange: (val: ScheduleSelectorValue) => void;
    };

const DAYS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAYS_ABBR = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function generateTimes(start = '07:00', end = '21:00', stepMin = 30): string[] {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    const times: string[] = [];
    let minutes = sH * 60 + sM;
    const endMin = eH * 60 + eM;
    while (minutes <= endMin) {
        const h = Math.floor(minutes / 60).toString().padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        times.push(`${h}:${m}`);
        minutes += stepMin;
    }
    return times;
}

function addMinutes(hhmm: string, delta: number) {
    const [h, m] = hhmm.split(':').map(Number);
    const total = h * 60 + m + delta;
    const H = Math.floor(total / 60);
    const M = total % 60;
    return `${String(H).padStart(2, '0')}:${String(M).padStart(2, '0')}`;
}

export default function ScheduleSelector(props: Props) {
    const value = (props as any).value as ScheduleSlot[] | ScheduleSelectorValue | undefined;
    const onChange = (props as any).onChange as (v: ScheduleSlot[] | ScheduleSelectorValue) => void;

    const DEFAULT_DAYS = useMemo(() => DAYS_FULL.slice(0, 5), []);
    const SLOT_DURATION_MIN = 30;
    const ALL_TIMES = useMemo(() => generateTimes('07:00', '21:00', 30), []);

    const [days, setDays] = useState<string[]>(
        Array.isArray(value) ? DEFAULT_DAYS : value?.days ?? DEFAULT_DAYS
    );
    const [times, setTimes] = useState<string[]>(
        Array.isArray(value) ? [] : value?.times ?? ['09:00', '10:00', '11:00', '13:00', '13:30'] // algunos por defecto como en screenshot
    );
    const [excludedDates, setExcludedDates] = useState<string[]>(
        Array.isArray(value) ? [] : value?.excludedDates ?? []
    );
    const [excludedTimes, setExcludedTimes] = useState<string[]>(
        Array.isArray(value) ? [] : value?.excludedTimes ?? []
    );
    const [dateInput, setDateInput] = useState<string>('');

    const [tab, setTab] = useState<'disponibilidad' | 'exclusiones'>('disponibilidad');

    const resolvedSlots: ScheduleSlot[] = useMemo(() => {
        const selected = new Set(times.filter(t => !excludedTimes.includes(t)));
        const slots: ScheduleSlot[] = [];
        for (const d of days) {
            for (const t of selected) {
                slots.push({
                    day: d,
                    start: t,
                    end: addMinutes(t, SLOT_DURATION_MIN),
                });
            }
        }
        return slots;
    }, [days, times, excludedTimes]);

    useEffect(() => {
        const payload: ScheduleSelectorValue = {
            slots: resolvedSlots,
            days,
            times,
            excludedDates,
            excludedTimes,
            slotDurationMin: SLOT_DURATION_MIN,
        };
        onChange(payload);
    }, [days, times, excludedDates, excludedTimes, resolvedSlots.length]);

    const isDayActive = (d: string) => days.includes(d);
    const toggleDay = (d: string) =>
        setDays(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]));

    const isTimeActive = (t: string) => times.includes(t);
    const toggleTime = (t: string) =>
        setTimes(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));

    const isTimeExcluded = (t: string) => excludedTimes.includes(t);
    const toggleExcludedTime = (t: string) =>
        setExcludedTimes(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));

    const addExcludedDate = () => {
        if (!dateInput) return;
        if (!excludedDates.includes(dateInput)) setExcludedDates(prev => [...prev, dateInput]);
        setDateInput('');
    };

    const removeExcludedDate = (d: string) =>
        setExcludedDates(prev => prev.filter(x => x !== d));

    const pillBase =
        'px-3 py-2 rounded-md border transition-colors text-sm select-none';
    const pillOn = 'bg-baltra-600 text-white border-[#005693]';
    const pillOff = 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50';

    return (
        <div className="w-full">
            <div className="mb-4">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setTab('disponibilidad')}
                        className={`text-sm px-3 py-2 rounded-md border ${tab === 'disponibilidad' ? 'bg-baltra-600 text-white border-[#005693]' : 'bg-white text-gray-800 border-gray-300'
                            }`}
                    >
                        Disponibilidad
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('exclusiones')}
                        className={`text-sm px-3 py-2 rounded-md border ${tab === 'exclusiones' ? 'bg-baltra-600 text-white border-[#005693]' : 'bg-white text-gray-800 border-gray-300'
                            }`}
                    >
                        Exclusiones
                    </button>
                </div>
            </div>

            {tab === 'disponibilidad' && (
                <div className="space-y-6">
                    <section className="border border-gray-200 rounded-md p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            Días Disponibles
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {DAYS_FULL.map((d, i) => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => toggleDay(d)}
                                    className={`${pillBase} ${isDayActive(d) ? pillOn : pillOff}`}
                                >
                                    {DAYS_ABBR[i]}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="border border-gray-200 rounded-md p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            Horarios Disponibles
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {ALL_TIMES.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => toggleTime(t)}
                                    className={`${pillBase} text-center ${isTimeActive(t) ? pillOn : pillOff
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* Resumen (opcional) */}
                        <div className="mt-4 text-sm text-gray-600">
                            <span className="font-medium">Seleccionados:</span>{' '}
                            {times.length ? `${times.length} horarios en ${days.length} día(s)` : '—'}
                        </div>
                    </section>
                </div>
            )}

            {tab === 'exclusiones' && (
                <div className="space-y-6">
                    {/* FECHAS EXCLUIDAS */}
                    <section className="border border-gray-200 rounded-md p-4">
                        <h3 className="font-semibold mb-3">Fechas Excluidas</h3>

                        {/* Chips */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {excludedDates.map(d => (
                                <span
                                    key={d}
                                    className="inline-flex items-center gap-2 text-sm border border-gray-300 rounded-full px-3 py-1"
                                >
                                    {d}
                                    <button
                                        type="button"
                                        className="text-gray-700 hover:underline"
                                        onClick={() => removeExcludedDate(d)}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                            {excludedDates.length === 0 && (
                                <span className="text-sm text-gray-500">No hay fechas excluidas.</span>
                            )}
                        </div>

                        {/* Input fecha + botón agregar */}
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dateInput}
                                onChange={e => setDateInput(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                placeholder="dd/mm/yyyy"
                            />
                            <button
                                type="button"
                                onClick={addExcludedDate}
                                className="px-3 py-2 rounded-md border bg-baltra-600 text-white border-[#005693]"
                                title="Agregar fecha excluida"
                            >
                                +
                            </button>
                        </div>
                    </section>

                    {/* HORARIOS EXCLUIDOS */}
                    <section className="border border-gray-200 rounded-md p-4">
                        <h3 className="font-semibold mb-3">Horarios Excluidos</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {ALL_TIMES.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => toggleExcludedTime(t)}
                                    className={`${pillBase} text-center ${isTimeExcluded(t) ? pillOn : pillOff
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            Los horarios excluidos se eliminarán del cálculo de disponibilidad en todos los días seleccionados.
                        </p>
                    </section>
                </div>
            )}
        </div>
    );
}
