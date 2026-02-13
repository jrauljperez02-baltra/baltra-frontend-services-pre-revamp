'use client';

import InputText from '@/views/progressive-form/components/InputText';
import InputUrl from '@/views/progressive-form/components/InputUrl';
import OptionsSelect from '@/views/progressive-form/components/OptionsSelect';
import OptionsSelectWithOther from '@/views/progressive-form/components/OptionsSelectWithOther';
import GoogleMapsInput from '@/views/progressive-form/components/GoogleMapsInput';
import ScheduleSelector from '@/views/progressive-form/components/ScheduleSelector';
import InputPhone from '@/views/progressive-form/components/InputPhone';
import VacanciesManager from '@/views/progressive-form/components/VacanciesManager';
import DemographicsConfigurator from '@/views/progressive-form/components/DemographicsConfigurator';
import RemindersConfigurator, { RemindersValue } from '@/views/progressive-form/components/RemindersConfigurator';
import SalaryConfigurator from '@/views/progressive-form/components/SalaryConfigurator';
import ShiftsConfigurator from '@/views/progressive-form/components/ShiftsConfigurator';
import DocumentsConfigurator from '@/views/progressive-form/components/DocumentsConfigurator';
import TransportCertsExtras, { TransportCertsExtrasGroup } from '@/views/progressive-form/components/TransportCertsExtras';
import InterviewsConfigurator from '@/views/progressive-form/components/InterviewsConfigurator';
import ScreeningConfigurator, { ScreeningPlan } from '@/views/progressive-form/components/ScreeningConfigurator';

import type {
    Option,
    Question,
    Answers,
    GoogleMapsAddressValue,
    Vacancy
} from '@/types/progressive-form';

interface Props {
    question: Question;
    value: any;
    onChange: (question: string, value: any) => void;
    globalAnswers?: Answers;
}

function toOptions(options?: Option[]) {
    if (!options) return [];
    return options.map(opt =>
        typeof opt === 'string'
            ? { label: opt, value: opt }
            : { label: opt.label, value: opt.value }
    );
}

function inferMultiple(question: Question): boolean {
    if (typeof (question as any).allowMultiple === 'boolean') return (question as any).allowMultiple;
    const txt = question.question.toLowerCase();
    if (txt.includes('beneficio') || txt.includes('seleccione') || txt.includes('selecciona')) {
        return true;
    }
    return false;
}

function getVacanciesFromAnswers(globalAnswers?: Answers): Vacancy[] {
    if (!globalAnswers) return [];
    const commonKey = 'Registra las vacantes de la empresa.';
    const direct = (globalAnswers as any)[commonKey];
    if (Array.isArray(direct)) return direct as Vacancy[];
    for (const val of Object.values(globalAnswers)) {
        if (Array.isArray(val) && val.length > 0) {
            const first = val[0] as any;
            if (first && typeof first === 'object' && 'roleName' in first && 'useCompanyAddress' in first) {
                return val as Vacancy[];
            }
        }
    }
    return [];
}

export default function QuestionRenderer({ question, value, onChange, globalAnswers }: Props) {
    const qTextLC = question.question.toLowerCase();
    const componentKind = (question as any).componentKind as string | undefined;

    const isReminders = qTextLC.includes('recordatorio');
    if (isReminders) {
        const incoming = toOptions((question as any).options);
        const channelOptions =
            incoming.length > 0
                ? incoming
                : [
                    { label: 'Recordatorio por correo electrónico', value: 'email' },
                    { label: 'Recordatorio por SMS', value: 'sms' },
                ];
        const v: RemindersValue = value ?? { channels: [], schedule: {} as any };
        return (
            <RemindersConfigurator
                label={question.question}
                channelOptions={channelOptions}
                value={v}
                onChange={(val) => onChange(question.question, val)}
            />
        );
    }

    if (componentKind === 'demographics') {
        const vacancies = getVacanciesFromAnswers(globalAnswers);
        return (
            <DemographicsConfigurator
                vacancies={vacancies}
                value={Array.isArray(value) ? value : []}
                onChange={(groups) => onChange(question.question, groups)}
            />
        );
    }

    if (componentKind === 'vacancies') {
        const companyAddress = globalAnswers?.['Dirección de la empresa'] as GoogleMapsAddressValue | undefined;
        return (
            <VacanciesManager
                value={Array.isArray(value) ? value : []}
                onChange={(v) => onChange(question.question, v)}
                companyAddress={companyAddress}
            />
        );
    }

    if (componentKind === 'salary') {
        const vacancies = getVacanciesFromAnswers(globalAnswers);
        return (
            <SalaryConfigurator
                vacancies={vacancies}
                value={Array.isArray(value) ? value : []}
                onChange={(v) => onChange(question.question, v)}
            />
        );
    }

    if (componentKind === 'shifts') {
        const vacancies = getVacanciesFromAnswers(globalAnswers);
        return (
            <ShiftsConfigurator
                vacancies={vacancies}
                value={Array.isArray(value) ? value : []}
                onChange={(v) => onChange(question.question, v)}
            />
        );
    }

    if (componentKind === 'documents') {
        const vacancies = getVacanciesFromAnswers(globalAnswers);
        return (
            <DocumentsConfigurator
                vacancies={vacancies}
                value={Array.isArray(value) ? value : []}
                onChange={(v) => onChange(question.question, v)}
            />
        );
    }

    if (componentKind === 'transport') {
        const vacancies = getVacanciesFromAnswers(globalAnswers);
        const v: TransportCertsExtrasGroup[] = Array.isArray(value) ? value : [];
        return (
            <TransportCertsExtras
                vacancies={vacancies}
                value={v}
                onChange={(val) => onChange(question.question, val)}
            />
        );
    }

    if (componentKind === 'interviews') {
        const vacancies = (globalAnswers?.['Registra las vacantes de la empresa.'] as any) ?? [];
        return (
            <InterviewsConfigurator
                vacancies={Array.isArray(vacancies) ? vacancies : []}
                value={Array.isArray(value) ? value : []}
                onChange={(v) => onChange(question.question, v)}
            />
        );
    }

    if (componentKind === 'screening_wa') {
        const vacancies = getVacanciesFromAnswers(globalAnswers);
        const companyType = String(globalAnswers?.['Tipo de empresa'] ?? '2 - Criterios de Elegibilidad parcial');
        return (
            <ScreeningConfigurator
                vacancies={vacancies}
                companyType={companyType}
                globalAnswers={globalAnswers || {}}
                value={value as ScreeningPlan | undefined}
                onChange={(v) => onChange(question.question, v)}
            />
        );
    }

    switch (question.type) {
        case 'text':
            return (
                <InputText
                    label={question.question}
                    value={value || ''}
                    onChange={v => onChange(question.question, v)}
                    maxLength={question.restrictions?.max_length}
                    required={question.required}
                />
            );

        case 'url':
            return (
                <InputUrl
                    label={question.question}
                    value={value || ''}
                    onChange={v => onChange(question.question, v)}
                    required={question.required}
                />
            );

        case 'phone_number':
            return (
                <InputPhone
                    label={question.question}
                    value={value || ''}
                    onChange={(v) => onChange(question.question, v)}
                    required={question.required}
                    maxLength={question.restrictions?.max_length}
                />
            );

        case 'options': {
            const opts = toOptions((question as any).options);
            const multiple = inferMultiple(question);
            const wantsCustom = (question as any).allowCustom === true || qTextLC.includes('beneficio');
            if (wantsCustom) {
                return (
                    <OptionsSelectWithOther
                        label={question.question}
                        options={opts}
                        value={value}
                        onChange={(v) => onChange(question.question, v)}
                        otherLabel="Otros"
                        placeholder="Selecciona..."
                    />
                );
            }
            return (
                <OptionsSelect
                    label={question.question}
                    options={opts}
                    multiple={multiple}
                    value={value}
                    onChange={v => onChange(question.question, v)}
                    searchable
                    placeholder="Selecciona..."
                />
            );
        }

        case 'google_maps':
            return (
                <GoogleMapsInput
                    label={question.question}
                    value={value || ''}
                    onChange={v => onChange(question.question, v)}
                    required={question.required}
                />
            );

        case 'component':
            return (
                <ScheduleSelector
                    value={Array.isArray(value) ? value : (value?.slots ?? [])}
                    onChange={(v: any) => onChange(question.question, v)}
                />
            );

        default:
            return <p className="text-gray-500">Tipo de pregunta no soportado</p>;
    }
}
