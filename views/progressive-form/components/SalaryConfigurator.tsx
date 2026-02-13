'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import OptionsSelect from '@/views/progressive-form/components/OptionsSelect';
import OptionsSelectWithOther from '@/views/progressive-form/components/OptionsSelectWithOther';
import type {
    Vacancy,
    SalaryGroup,
    SalaryPayType,
    PayFrequency,
    CandidateBankRule,
} from '@/types/progressive-form';
import Tooltip from '@/views/progressive-form/tools/Tooltip';

interface Props {
    vacancies: Vacancy[];
    value?: SalaryGroup[];
    onChange: (groups: SalaryGroup[]) => void;
}

const PAY_TYPE_OPTS: { label: string; value: SalaryPayType }[] = [
    { label: 'Bruto', value: 'Bruto' },
    { label: 'Neto', value: 'Neto' },
];

const FREQUENCY_OPTS: { label: string; value: PayFrequency }[] = [
    { label: 'Semanal', value: 'Semanal' },
    { label: 'Quincenal', value: 'Quincenal' },
    { label: 'Mensual', value: 'Mensual' },
];

const BANKS = [
    'BBVA',
    'Citibanamex',
    'Banorte',
    'Santander',
    'HSBC',
    'Scotiabank',
    'Banco Azteca',
    'Inbursa',
].map((b) => ({ label: b, value: b }));

const defaultGroup = (): SalaryGroup => ({
    payType: 'Bruto',
    bank: '',
    frequency: 'Quincenal',
    notes: '',
    candidateBankRule: 'allow_any',
    candidateExcludeBanks: [],
    appliesToAll: false,
    vacancyIndexes: [],
    amount: undefined, // NUEVO
});

export default function SalaryConfigurator({ vacancies, value, onChange }: Props) {
    const [groups, setGroups] = useState<SalaryGroup[]>(
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

    const setGroup = <K extends keyof SalaryGroup>(idx: number, key: K, val: SalaryGroup[K]) => {
        setGroups(prev => {
            const next = [...prev];
            let g = { ...next[idx], [key]: val };

            if (key === 'appliesToAll' && val === true) {
                g.vacancyIndexes = [];
                next.splice(0, next.length, g);
                return next;
            }

            if (key === 'candidateBankRule' && val !== 'exclude_banks') {
                g.candidateExcludeBanks = [];
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

    const onExcludeBanksChange = (idx: number, arr: string | string[]) => {
        const vals = Array.isArray(arr) ? arr : [arr];
        setGroup(idx, 'candidateExcludeBanks', vals.map(String));
    };

    const formatMoney = (n?: number) =>
        typeof n === 'number' && n > 0
            ? n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
            : '—';

    const summary = (g: SalaryGroup) => {
        const bankTxt = g.bank?.trim() ? g.bank : 'Banco sin definir';
        const freqTxt = g.frequency || '—';
        const amountTxt = formatMoney(g.amount);
        let rule = 'candidato: cualquier banco';
        if (g.candidateBankRule === 'must_match_pay_bank') {
            rule = `candidato: debe tener ${bankTxt}`;
        } else if (g.candidateBankRule === 'exclude_banks') {
            const n = g.candidateExcludeBanks?.length || 0;
            rule = `candidato: excluir ${n} banco(s)`;
        }
        return `${g.payType} · ${amountTxt}/${freqTxt} · ${bankTxt} · ${rule} ${
            g.appliesToAll ? '(todas)' : `(${g.vacancyIndexes.length} vacante/s)`
        }`;
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

                                        <div>
                                            <label className="block mb-2 text-sm font-medium">Salario</label>
                                            <OptionsSelect
                                                label=""
                                                options={PAY_TYPE_OPTS}
                                                multiple={false}
                                                value={g.payType}
                                                onChange={(v) => setGroup(i, 'payType', String(v) as SalaryPayType)}
                                                placeholder="Bruto o Neto"
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium">¿En qué banco se paga?</label>
                                            <OptionsSelectWithOther
                                                label=""
                                                options={BANKS}
                                                value={g.bank}
                                                onChange={(val) => setGroup(i, 'bank', String(val))}
                                                otherLabel="Otro"
                                                placeholder="Selecciona o escribe un banco"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium">Monto</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600">$</span>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step={100}
                                                        value={typeof g.amount === 'number' ? g.amount : 0}
                                                        onChange={(e) =>
                                                            setGroup(i, 'amount', Number(e.target.value) || 0)
                                                        }
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                        placeholder="Ej. 12000"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Monto en MXN.</p>
                                            </div>

                                            <div>
                                                <label className="block mb-2 text-sm font-medium">¿Con qué frecuencia se paga?</label>
                                                <OptionsSelect
                                                    label=""
                                                    options={FREQUENCY_OPTS}
                                                    multiple={false}
                                                    value={g.frequency}
                                                    onChange={(v) => setGroup(i, 'frequency', String(v) as PayFrequency)}
                                                    placeholder="Selecciona una frecuencia"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium">Comentarios adicionales</label>
                                            <textarea
                                                value={g.notes || ''}
                                                onChange={(e) => setGroup(i, 'notes', e.target.value)}
                                                rows={4}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                placeholder="Detalles, consideraciones, incentivos, etc."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">¿Descartar candidato por no poder recibir pagos en {g.bank || 'ese banco'}?</p>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setGroup(i, 'candidateBankRule', 'must_match_pay_bank')}
                                                    className={[
                                                        'px-3 py-2 rounded-md  text-sm select-none transition-colors',
                                                        g.candidateBankRule === 'must_match_pay_bank'
                                                            ? 'bg-baltra-600 text-white -black'
                                                            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50',
                                                    ].join(' ')}
                                                >
                                                    Sí
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setGroup(i, 'candidateBankRule', 'allow_any')}
                                                    className={[
                                                        'px-3 py-2 rounded-md  text-sm select-none transition-colors',
                                                        g.candidateBankRule === 'allow_any'
                                                            ? 'bg-baltra-600 text-white border-black'
                                                            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50',
                                                    ].join(' ')}
                                                >
                                                    No
                                                </button>
                                            </div>

                                            {g.candidateBankRule === 'must_match_pay_bank' && (
                                                <p className="text-xs text-gray-600">
                                                    Se <b>descartará</b> al candidato si su banco <b>no es</b> <i>{g.bank || '—'}</i>.
                                                </p>
                                            )}
                                        </div>

                                        {!g.appliesToAll && (
                                            <div>
                                                <OptionsSelect
                                                    label="Selecciona las vacantes a las que aplica este grupo"
                                                    options={vacancyOptions}
                                                    multiple
                                                    value={g.vacancyIndexes.map(n => String(n))}
                                                    onChange={(arr) => onVacanciesChange(i, arr)}
                                                    searchable
                                                    placeholder="Vacantes…"
                                                />
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
