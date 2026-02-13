'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Opt = { label: string; value: string };

interface Props {
    label: string;
    options: Opt[];
    multiple?: boolean;
    value: string | string[] | undefined;
    onChange: (val: string | string[]) => void;
    searchable?: boolean;
    placeholder?: string;
    portal?: boolean;
    /** Cómo indicar el ítem seleccionado (sin el “puntito”). */
    indicator?: 'check-right' | 'checkbox-left' | 'border-left' | 'none';
}

function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
    const ref = useRef<T | null>(null);
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!(e.target instanceof Node)) return;
            if (!ref.current.contains(e.target)) onOutside();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onOutside]);
    return ref;
}

export default function OptionsSelect({
    label,
    options,
    multiple = false,
    value,
    onChange,
    searchable = false,
    placeholder = 'Selecciona...',
    portal = false,
    indicator = 'check-right',
}: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const wrapperRef = useClickOutside<HTMLDivElement>(() => setOpen(false));
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});

    const selectedArray = useMemo<string[]>(
        () => (multiple ? (Array.isArray(value) ? value : []) : value ? [value as string] : []),
        [value, multiple]
    );

    const selectedLabels = useMemo<string[]>(
        () => selectedArray.map(v => options.find(o => o.value === v)?.label ?? v),
        [selectedArray, options]
    );

    const filtered = useMemo(() => {
        if (!searchable || !query.trim()) return options;
        const q = query.toLowerCase();
        return options.filter(o => o.label.toLowerCase().includes(q));
    }, [options, searchable, query]);

    const toggleValue = (v: string) => {
        if (!multiple) {
            onChange(v);
            setOpen(false);
            return;
        }
        const current = new Set(selectedArray);
        if (current.has(v)) current.delete(v);
        else current.add(v);
        onChange(Array.from(current));
    };

    const removeChip = (v: string) => {
        if (!multiple) {
            onChange('');
        } else {
            onChange((selectedArray || []).filter(x => x !== v));
        }
    };

    useEffect(() => {
        if (!portal || !open || !triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setPortalStyle({
            position: 'fixed',
            top: rect.bottom + 8,
            left: rect.left,
            width: rect.width,
            zIndex: 50,
        });
    }, [open, portal]);

    const Dropdown = (
        <div
            className={
                portal
                    ? 'border border-gray-300 rounded-md bg-white max-h-60 overflow-auto shadow-none'
                    : 'absolute inset-x-0 mt-2 w-full border border-gray-300 rounded-md bg-white max-h-60 overflow-auto z-20'
            }
            style={portal ? portalStyle : undefined}
        >
            {searchable && (
                <div className="p-2 border-b border-gray-200">
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Buscar..."
                        className="w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                </div>
            )}

            <ul className="py-1">
                {filtered.length === 0 && (
                    <li className="px-3 py-2 text-sm text-gray-500">Sin resultados</li>
                )}
                {filtered.map(opt => {
                    const active = selectedArray.includes(opt.value);

                    // Clases base del <li> + variantes visuales
                    const base =
                        'px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2';
                    const withBorder =
                        indicator === 'border-left'
                            ? active
                                ? ' border-l-2 border-black pl-2'
                                : ' border-l-2 border-transparent pl-2'
                            : '';
                    const withEmphasis = indicator === 'none' && active ? ' font-medium' : '';

                    return (
                        <li
                            key={opt.value}
                            onClick={() => toggleValue(opt.value)}
                            className={base + withBorder + withEmphasis}
                        >
                            {/* Indicador opcional a la izquierda */}
                            {indicator === 'checkbox-left' && (
                                <input
                                    readOnly
                                    type="checkbox"
                                    checked={active}
                                    className="pointer-events-none"
                                />
                            )}

                            {/* Etiqueta */}
                            <span className="whitespace-normal break-words flex-1">{opt.label}</span>

                            {/* Indicador a la derecha */}
                            {indicator === 'check-right' && active && (
                                <span className="ml-2" aria-hidden>
                                    ✓
                                </span>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );

    return (
        <div ref={wrapperRef} className="relative max-w-full">
            <label className="block mb-2 text-sm font-medium">{label}</label>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full min-h-[2.5rem] border border-gray-300 rounded-md px-3 py-2 text-left focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
                {multiple ? (
                    <div className="flex items-center gap-2 flex-wrap">
                        {selectedArray.length === 0 && (
                            <span className="text-gray-500">{placeholder}</span>
                        )}
                        {selectedArray.map(v => {
                            const lab = options.find(o => o.value === v)?.label ?? v;
                            return (
                                <span
                                    key={v}
                                    className="max-w-full inline-flex items-center gap-1 text-sm border border-gray-300 rounded-full px-2 py-0.5"
                                >
                                    <span className="max-w-[14rem] truncate">{lab}</span>
                                    <span
                                        role="button"
                                        aria-label={`Quitar ${lab}`}
                                        onClick={e => {
                                            e.stopPropagation();
                                            removeChip(v);
                                        }}
                                        className="cursor-pointer select-none"
                                    >
                                        ×
                                    </span>
                                </span>
                            );
                        })}
                    </div>
                ) : (
                    <span className={`block truncate ${selectedArray.length ? '' : 'text-gray-500'}`}>
                        {selectedLabels[0] ?? placeholder}
                    </span>
                )}
            </button>

            {open && !portal && Dropdown}
            {open && portal && Dropdown}
        </div>
    );
}
