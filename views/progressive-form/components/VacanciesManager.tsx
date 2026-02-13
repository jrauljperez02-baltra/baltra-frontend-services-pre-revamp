'use client';

import { useEffect, useRef, useState } from 'react';
import InputText from '@/views/progressive-form/components/InputText';
import GoogleMapsInput from '@/views/progressive-form/components/GoogleMapsInput';
import type { GoogleMapsAddressValue } from '@/types/progressive-form';

export type Vacancy = {
    roleName: string;
    useCompanyAddress: boolean;
    location?: GoogleMapsAddressValue | null;
    relevantInfo: string;
    aboutRole: string;
};

interface Props {
    value?: Vacancy[];
    onChange: (vacancies: Vacancy[]) => void;
    companyAddress?: GoogleMapsAddressValue;
}

const limits = {
    roleName: 24,
    relevantInfo: 72,
    aboutRole: 200,
};

export default function VacanciesManager({ value, onChange, companyAddress }: Props) {
    const [items, setItems] = useState<Vacancy[]>(
        Array.isArray(value) && value.length
            ? value
            : [
                {
                    roleName: '',
                    useCompanyAddress: !!companyAddress,
                    location: companyAddress ?? null,
                    relevantInfo: '',
                    aboutRole: '',
                },
            ]
    );

    const [openIndex, setOpenIndex] = useState<number>(-1);

    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        onChangeRef.current(items);
    }, [items]);

    const addVacancy = () => {
        setItems((prev) => [
            ...prev,
            {
                roleName: '',
                useCompanyAddress: !!companyAddress,
                location: companyAddress ?? null,
                relevantInfo: '',
                aboutRole: '',
            },
        ]);
        setOpenIndex(-1);
    };

    const removeVacancy = (idx: number) => {
        setItems((prev) => prev.filter((_, i) => i !== idx));
        setOpenIndex((curr) => (curr === idx ? -1 : curr > idx ? curr - 1 : curr));
    };

    const update = <K extends keyof Vacancy>(idx: number, key: K, val: Vacancy[K]) => {
        setItems((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], [key]: val };
            if (key === 'useCompanyAddress') {
                if (val === true) {
                    next[idx].location = companyAddress ?? null;
                }
            }
            return next;
        });
    };

    const companyEnabled = !!companyAddress;

    const toggleOpen = (idx: number) => {
        setOpenIndex((curr) => (curr === idx ? -1 : idx));
    };

    const truncate = (s: string, n: number) => {
        if (!s) return '';
        return s.length > n ? s.slice(0, n - 1) + '…' : s;
    };

    const isComplete = (v: Vacancy) => {
        const hasBasics =
            v.roleName.trim().length > 0 &&
            v.relevantInfo.trim().length > 0 &&
            v.aboutRole.trim().length > 0 &&
            v.roleName.length <= limits.roleName &&
            v.relevantInfo.length <= limits.relevantInfo &&
            v.aboutRole.length <= limits.aboutRole;

        if (!hasBasics) return false;

        if (v.useCompanyAddress) return true;

        const a = v.location;
        return !!(a && a.address && a.latitude && a.longitude);
    };

    const locationSummary = (v: Vacancy) => {
        if (v.useCompanyAddress) return 'Misma que la empresa';
        if (v.location?.address) return truncate(v.location.address, 60);
        return 'Sin dirección';
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {items.map((v, i) => {
                    const opened = openIndex === i;
                    const title = v.roleName?.trim() ? v.roleName : `Vacante #${i + 1}`;
                    const info = v.relevantInfo?.trim()
                        ? truncate(v.relevantInfo, 60)
                        : 'Sin información relevante';
                    const complete = isComplete(v);

                    return (
                        <section key={i} className="border border-gray-200 rounded-md">
                            <div className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold truncate">{title}</span>
                                        <span className="text-xs text-gray-500 shrink-0">#{i + 1}</span>
                                        <span
                                            className={`text-[11px] px-2 py-0.5 rounded-full border ${complete ? 'border-black text-black' : 'border-gray-300 text-gray-600'
                                                }`}
                                            title={complete ? 'Completa' : 'Incompleta'}
                                        >
                                            {complete ? 'Completa' : 'Incompleta'}
                                        </span>
                                    </div>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                                        <span className="truncate">Ubicación: {locationSummary(v)}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span className="truncate">Info: {info}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => toggleOpen(i)}
                                        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                                    >
                                        {opened ? 'Cerrar' : 'Abrir'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeVacancy(i)}
                                        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                                        title="Eliminar vacante"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>

                            {opened && (
                                <div className="border-t border-gray-200 px-4 py-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <InputText
                                                label={`Nombre del rol (máx. ${limits.roleName})`}
                                                value={v.roleName}
                                                onChange={(val) => update(i, 'roleName', val.slice(0, limits.roleName))}
                                                maxLength={limits.roleName}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium">Ubicación</label>

                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={v.useCompanyAddress}
                                                    onChange={(e) => update(i, 'useCompanyAddress', e.target.checked)}
                                                    disabled={!companyEnabled}
                                                />
                                                Usar la misma dirección de la empresa
                                                {!companyEnabled && (
                                                    <span className="text-xs text-gray-500">
                                                        &nbsp;(captura primero la dirección de la empresa)
                                                    </span>
                                                )}
                                            </label>

                                            {v.useCompanyAddress && companyAddress ? (
                                                <div className="border border-gray-200 rounded-md p-3 text-sm">
                                                    <div className="text-gray-800">
                                                        {companyAddress.address || 'Dirección de la empresa seleccionada'}
                                                    </div>
                                                    {companyAddress.maps_link_json?.queryLink && (
                                                        <a
                                                            href={companyAddress.maps_link_json.queryLink}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="underline"
                                                        >
                                                            Ver en Google Maps
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <GoogleMapsInput
                                                    label="Dirección de la vacante"
                                                    value={v.location as any}
                                                    onChange={(addr) => update(i, 'location', addr)}
                                                    required
                                                />
                                            )}
                                        </div>

                                        <div>
                                            <InputText
                                                label={`Información relevante (máx. ${limits.relevantInfo})`}
                                                value={v.relevantInfo}
                                                onChange={(val) =>
                                                    update(i, 'relevantInfo', val.slice(0, limits.relevantInfo))
                                                }
                                                maxLength={limits.relevantInfo}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium">
                                                Acerca del rol (máx. {limits.aboutRole})
                                            </label>
                                            <textarea
                                                value={v.aboutRole}
                                                onChange={(e) =>
                                                    update(i, 'aboutRole', e.target.value.slice(0, limits.aboutRole))
                                                }
                                                rows={5}
                                                maxLength={limits.aboutRole}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                placeholder="Describe responsabilidades, herramientas, seniority, etc."
                                                required
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                {v.aboutRole.length}/{limits.aboutRole}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={addVacancy}
                    className="px-3 py-2 rounded-md bg-baltra-600 text-white border-black"
                >
                    Agregar vacante
                </button>
            </div>
        </div>
    );
}

