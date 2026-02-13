'use client';

import { useEffect, useMemo, useState } from 'react';

export type ReminderChannels = string[];
export type RemindersValue = {
    channels: ReminderChannels;
    schedule: {
        fixed?: {
            nightBefore?: string | null;
            dayOf?: string | null;
        };
        variable?: {
            hoursBefore?: number | null;
        };
    };
};

type Option = { label: string; value: string };

interface Props {
    label: string;
    channelOptions: Option[];
    value?: RemindersValue;
    onChange: (v: RemindersValue) => void;
}

const pillBase =
    'px-3 py-2 rounded-full border transition-colors text-sm select-none';
const pillOn = 'bg-baltra-600 text-white border-black';
const pillOff = 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50';

const row =
    'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3';

export default function RemindersConfigurator({
    label,
    channelOptions, 
    value,
    onChange,
}: Props) {
    const [channels, setChannels] = useState<ReminderChannels>(
        value?.channels ?? []
    );

    const initialMode: 'fixed' | 'variable' = (() => {
        const hasVar = !!value?.schedule?.variable?.hoursBefore;
        const hasFixed =
            !!value?.schedule?.fixed?.nightBefore || !!value?.schedule?.fixed?.dayOf;
        if (hasVar && !hasFixed) return 'variable';
        return 'fixed';
    })();
    const [mode, setMode] = useState<'fixed' | 'variable'>(initialMode);

    const [nightBeforeHour, setNightBeforeHour] = useState<string>(
        value?.schedule?.fixed?.nightBefore || '19:00'
    );
    const [dayOfHour, setDayOfHour] = useState<string>(
        value?.schedule?.fixed?.dayOf || '08:00'
    );

    const initialFixedChoice: 'nightBefore' | 'dayOf' = (() => {
        if (value?.schedule?.fixed?.nightBefore) return 'nightBefore';
        if (value?.schedule?.fixed?.dayOf) return 'dayOf';
        return 'nightBefore';
    })();
    const [fixedChoice, setFixedChoice] =
        useState<'nightBefore' | 'dayOf'>(initialFixedChoice);

    const [hoursBefore, setHoursBefore] = useState<number>(
        value?.schedule?.variable?.hoursBefore ?? 24
    );

    useEffect(() => {
        const fixed =
            mode === 'fixed'
                ? {
                    nightBefore: fixedChoice === 'nightBefore' ? nightBeforeHour : null,
                    dayOf: fixedChoice === 'dayOf' ? dayOfHour : null,
                }
                : { nightBefore: null, dayOf: null };

        const variable =
            mode === 'variable'
                ? { hoursBefore }
                : { hoursBefore: null };

        onChange({
            channels,
            schedule: {
                fixed,
                variable,
            },
        });
    }, [mode, fixedChoice, nightBeforeHour, dayOfHour, hoursBefore, channels, onChange]);

    const summary = useMemo(() => {
        const ch = channels.length ? channels.join(', ') : '—';
        const fx =
            mode === 'fixed'
                ? fixedChoice === 'nightBefore'
                    ? `noche anterior ${nightBeforeHour}`
                    : `día de la entrevista ${dayOfHour}`
                : '—';
        const vb = mode === 'variable' ? `${hoursBefore}h antes` : '—';
        return { ch, fx, vb };
    }, [channels, mode, fixedChoice, nightBeforeHour, dayOfHour, hoursBefore]);

    return (
        <div className="space-y-5">
            <div>
                <label className="block text-sm font-medium">{label}</label>
                <p className="text-xs text-gray-500 mt-1 mb-3">
                    Elige una modalidad y cuándo enviar los recordatorios.
                </p>
            </div>

            <section className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2">Modalidad</h4>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setMode('fixed')}
                        className={`${pillBase} ${mode === 'fixed' ? pillOn : pillOff}`}
                    >
                        Fijo
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('variable')}
                        className={`${pillBase} ${mode === 'variable' ? pillOn : pillOff}`}
                    >
                        Variable
                    </button>
                </div>
            </section>

            {/* Fijo */}
            <section className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-1">Fijo</h4>
                <p className="text-xs text-gray-500 mb-3">
                    Envía a una hora específica la noche anterior o el mismo día.
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                    <button
                        type="button"
                        onClick={() => setFixedChoice('nightBefore')}
                        disabled={mode !== 'fixed'}
                        className={[
                            pillBase,
                            mode !== 'fixed'
                                ? 'opacity-60 cursor-not-allowed'
                                : fixedChoice === 'nightBefore'
                                    ? pillOn
                                    : pillOff,
                        ].join(' ')}
                    >
                        Noche anterior
                    </button>
                    <button
                        type="button"
                        onClick={() => setFixedChoice('dayOf')}
                        disabled={mode !== 'fixed'}
                        className={[
                            pillBase,
                            mode !== 'fixed'
                                ? 'opacity-60 cursor-not-allowed'
                                : fixedChoice === 'dayOf'
                                    ? pillOn
                                    : pillOff,
                        ].join(' ')}
                    >
                        Día de la entrevista
                    </button>
                </div>

                <div className="divide-y divide-gray-200">
                    <div className={row}>
                        <span className="text-sm">Hora (noche anterior)</span>
                        <input
                            type="time"
                            value={nightBeforeHour}
                            onChange={(e) => setNightBeforeHour(e.target.value)}
                            disabled={mode !== 'fixed' || fixedChoice !== 'nightBefore'}
                            className="w-full sm:w-40 border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                        />
                    </div>

                    <div className={row}>
                        <span className="text-sm">Hora (día de la entrevista)</span>
                        <input
                            type="time"
                            value={dayOfHour}
                            onChange={(e) => setDayOfHour(e.target.value)}
                            disabled={mode !== 'fixed' || fixedChoice !== 'dayOf'}
                            className="w-full sm:w-40 border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                        />
                    </div>
                </div>
            </section>

            <section className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-1">Variable</h4>
                <p className="text-xs text-gray-500 mb-3">
                    Envía un recordatorio un número de horas antes de la entrevista.
                </p>

                <div className={row}>
                    <span className="text-sm">Horas antes de la entrevista</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min={1}
                            max={72}
                            step={1}
                            value={hoursBefore}
                            onChange={(e) => setHoursBefore(Number(e.target.value))}
                            disabled={mode !== 'variable'}
                            className="w-24 border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                        />
                        <span className="text-sm text-gray-600">h</span>
                    </div>
                </div>
            </section>
        </div>
    );
}
