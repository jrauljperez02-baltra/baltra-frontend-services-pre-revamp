'use client';

import { useId } from 'react';

interface Props {
    label: string;
    value: string;
    onChange: (val: string) => void;
    required?: boolean;
    maxLength?: number;
    placeholder?: string;
}

function normalizePhone(raw: string) {
    let s = raw.replace(/[\s\-().]/g, '');
    if (s.startsWith('00')) s = '+' + s.slice(2);
    return s;
}

export default function InputPhone({
    label,
    value,
    onChange,
    required,
    maxLength = 15,
    placeholder = '+52 555 555 5555',
}: Props) {
    const id = useId();
    return (
        <div>
            <label htmlFor={id} className="block mb-2 text-sm font-medium">
                {label} {required && <span className="text-red-600">*</span>}
            </label>

            <input
                id={id}
                type="tel"
                inputMode="tel"
                placeholder={placeholder}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                onBlur={(e) => onChange(normalizePhone(e.target.value))}
                maxLength={maxLength}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                aria-describedby={`${id}-hint`}
            />

            <p id={`${id}-hint`} className="text-xs text-gray-500 mt-1">
                Formato sugerido E.164 (ej. +525555555555). Se admiten 7 a 15 dígitos.
            </p>
        </div>
    );
}
