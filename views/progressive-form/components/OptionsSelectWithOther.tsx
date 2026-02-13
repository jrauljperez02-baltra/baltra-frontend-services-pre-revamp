'use client';

import { useMemo, useState } from 'react';
import OptionsSelect from './OptionsSelect';

type Opt = { label: string; value: string };

interface Props {
    label: string;
    options: Opt[];
    value: string[] | string | undefined;
    onChange: (val: string[] | string) => void;
    placeholder?: string;
    otherLabel?: string;
}

const OTHER_VALUE = '__other__';

export default function OptionsSelectWithOther({
    label,
    options,
    value,
    onChange,
    placeholder = 'Selecciona...',
    otherLabel = 'Otros',
}: Props) {
    const selected = useMemo<string[]>(
        () => (Array.isArray(value) ? value : value ? [value as string] : []),
        [value]
    );
    const [customInput, setCustomInput] = useState('');

    const optionsPlus = useMemo<Opt[]>(
        () => [...options, { label: otherLabel, value: OTHER_VALUE }],
        [options, otherLabel]
    );

    const hasOtherSelected = selected.includes(OTHER_VALUE);

    const addCustom = () => {
        const t = customInput.trim();
        if (!t) return;
        if (!selected.includes(t)) {
            onChange([...selected, t]); // guardamos el texto plano como valor
        }
        setCustomInput('');
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustom();
        }
    };

    return (
        <div className="space-y-3">
            <OptionsSelect
                label={label}
                options={optionsPlus}
                multiple
                value={selected}
                onChange={(v) => onChange(v)}
                searchable
                placeholder={placeholder}
            />

            {hasOtherSelected && (
                <div className=" border-gray-200 rounded-md py-3">
                    <p className="text-sm font-medium mb-2">Añadir otros beneficios</p>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder="Escribe un beneficio y presiona Enter"
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        />
                        <button
                            type="button"
                            onClick={addCustom}
                            className="px-3 py-2 rounded-md border bg-baltra-600 text-white border-[#005693]"
                        >
                            Agregar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
