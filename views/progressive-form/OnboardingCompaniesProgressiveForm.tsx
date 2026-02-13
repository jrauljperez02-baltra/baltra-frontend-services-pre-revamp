'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import Step from './Step';
import ProgressBar from '@/views/progressive-form/ProgressBar';
import type { Answers, FormStep } from '@/types/progressive-form';
import { useLocalStorage } from '@/views/progressive-form/hooks/useLocalStorage';
import { mapAnswersToBackend } from '@/views/progressive-form/utils/mapAnswersToBackend';
import { BACKEND_BASE_URL } from '@/config/env';

type AlertVariant = 'info' | 'danger' | 'success' | 'warning' | 'dark';

function Alert({
    variant,
    title,
    description,
    onDismiss,
    primaryAction,
    primaryLabel
}: {
    variant: AlertVariant;
    title: string;
    description?: string;
    onDismiss?: () => void;
    primaryAction?: () => void;
    primaryLabel?: string;
}) {
    const styles = useMemo(() => {
        if (variant === 'info') return { wrap: 'text-blue-800 border-blue-300 bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-800', solidBtn: 'text-white bg-blue-800 hover:bg-blue-900 focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800', ghostBtn: 'text-blue-800 bg-transparent border border-blue-800 hover:bg-blue-900 hover:text-white focus:ring-blue-200 dark:hover:bg-blue-600 dark:border-blue-600 dark:text-blue-400 dark:hover:text-white dark:focus:ring-blue-800' };
        if (variant === 'danger') return { wrap: 'text-red-800 border-red-300 bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800', solidBtn: 'text-white bg-red-800 hover:bg-red-900 focus:ring-red-300 dark:bg-baltra-600 dark:hover:bg-red-700 dark:focus:ring-red-800', ghostBtn: 'text-red-800 bg-transparent border border-red-800 hover:bg-red-900 hover:text-white focus:ring-red-300 dark:hover:bg-baltra-600 dark:border-baltra dark:text-red-500 dark:hover:text-white dark:focus:ring-red-800' };
        if (variant === 'success') return { wrap: 'text-green-800 border-green-300 bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:border-green-800', solidBtn: 'text-white bg-green-800 hover:bg-green-900 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800', ghostBtn: 'text-green-800 bg-transparent border border-green-800 hover:bg-green-900 hover:text-white focus:ring-green-300 dark:hover:bg-green-600 dark:border-green-600 dark:text-green-400 dark:hover:text-white dark:focus:ring-green-800' };
        if (variant === 'warning') return { wrap: 'text-yellow-800 border-yellow-300 bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 dark:border-yellow-800', solidBtn: 'text-white bg-yellow-800 hover:bg-yellow-900 focus:ring-yellow-300 dark:bg-yellow-300 dark:text-gray-800 dark:hover:bg-yellow-400 dark:focus:ring-yellow-800', ghostBtn: 'text-yellow-800 bg-transparent border border-yellow-800 hover:bg-yellow-900 hover:text-white focus:ring-yellow-300 dark:hover:bg-yellow-300 dark:border-yellow-300 dark:text-yellow-300 dark:hover:text-gray-800 dark:focus:ring-yellow-800' };
        return { wrap: 'border border-gray-300 rounded-lg bg-gray-50 dark:border-gray-600 dark:bg-gray-800 text-gray-800 dark:text-gray-300', solidBtn: 'text-white bg-gray-700 hover:bg-gray-800 focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 dark:focus:ring-gray-800', ghostBtn: 'text-gray-800 bg-transparent border border-gray-700 hover:bg-gray-800 hover:text-white focus:ring-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 dark:focus:ring-gray-800 dark:text-gray-300 dark:hover:text-white' };
    }, [variant]);

    return (
        <div className={`p-4 mb-4 rounded-lg ${styles.wrap}`} role="alert">
            <div className="flex items-center">
                <svg className="shrink-0 w-4 h-4 mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" /></svg>
                <span className="sr-only">Info</span>
                <h3 className="text-lg font-medium">{title}</h3>
            </div>
            {description ? <div className="mt-2 mb-4 text-sm">{description}</div> : null}
            <div className="flex">
                {primaryAction && primaryLabel ? (
                    <button type="button" onClick={primaryAction} className={`${styles.solidBtn} focus:outline-none font-medium rounded-lg text-xs px-3 py-1.5 mr-2 inline-flex items-center`}>
                        <svg className="mr-2 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 14"><path d="M10 0C4.612 0 0 5.336 0 7c0 1.742 3.546 7 10 7 6.454 0 10-5.258 10-7 0-1.664-4.612-7-10-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" /></svg>
                        {primaryLabel}
                    </button>
                ) : null}
                {onDismiss ? (
                    <button type="button" onClick={onDismiss} className={`${styles.ghostBtn} focus:outline-none font-medium rounded-lg text-xs px-3 py-1.5`}>Dismiss</button>
                ) : null}
            </div>
        </div>
    );
}

type OnboardingResponse = {
    company_screenings: number;
    locations: number;
    business_unit_id: string;
    snapshot_id?: string;
};

const LOGO_URL = 'https://photos.wellfound.com/startups/i/10447547-67218e67ef130eddbb30ec39dd0afef8-medium_jpg.jpg?buster=1741572114';
const BASE = (BACKEND_BASE_URL || '').replace(/\/+$/, '');
const ONBOARDING_URL = `${BASE}/api/onboarding/batch`;

async function postOnboarding(payload: unknown, opts?: { token?: string; timeoutMs?: number }): Promise<OnboardingResponse> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 20000);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (opts?.token) headers.Authorization = `Bearer ${opts.token}`;
    const res = await fetch(ONBOARDING_URL, { method: 'POST', headers, body: JSON.stringify(payload), signal: controller.signal, cache: 'no-store' });
    clearTimeout(id);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Request failed with status ${res.status}`);
    }
    return (await res.json()) as OnboardingResponse;
}

interface Props {
    formDefinition: FormStep[];
}

export default function OnboardingCompaniesProgressiveForm({ formDefinition }: Props) {
    const [currentStep, setCurrentStep] = useLocalStorage<number>('pf:step:v1', 0);
    const [answers, setAnswers] = useLocalStorage<Answers>('pf:answers:v1', {});
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState<{ variant: AlertVariant; title: string; description?: string } | null>(null);

    useEffect(() => {
        if (!Array.isArray(formDefinition) || formDefinition.length === 0) return;
        if (currentStep > formDefinition.length - 1) setCurrentStep(formDefinition.length - 1);
    }, [currentStep, formDefinition, setCurrentStep]);

    const isLast = currentStep === formDefinition.length - 1;
    const step = formDefinition[currentStep];

    const handleNext = async (data: Answers) => {
        setAnswers(prev => ({ ...prev, ...data }));
        if (!isLast) {
            setCurrentStep(s => Math.min(s + 1, formDefinition.length - 1));
        } else {
            const final: Answers = { ...answers, ...data };
            const payload = mapAnswersToBackend(final);
            console.log('Final payload to submit:', payload);
            try {
                setSubmitting(true);
                setAlert({ variant: 'info', title: 'Submitting', description: 'Saving company and locations.' });
                const res = await postOnboarding(payload);
                setAlert({ variant: 'success', title: 'Saved', description: `Company ID: ${res.business_unit_id}. Locations: ${res.locations}.` });
                localStorage.removeItem('pf:answers:v1');
                localStorage.removeItem('pf:step:v1');
            } catch (e: any) {
                setAlert({ variant: 'danger', title: 'Failed', description: e?.message || 'Request failed' });
            } finally {
                setSubmitting(false);
            }
        }
    };

    const handleBack = () => {
        if (submitting) return;
        setCurrentStep(s => Math.max(s - 1, 0));
    };

    return (
        <div className="flex flex-col items-center justify-center bg-white text-gray-900 py-12 px-6">
            <div className="w-full max-w-5xl">
                <header className="mb-6 flex items-center justify-center">
                    <Image src={LOGO_URL} alt="Company logo" width={40} height={40} className="h-12 w-24 object-contain" priority />
                    <span className="sr-only">Company Onboarding</span>
                </header>

                {alert ? (
                    <Alert
                        variant={alert.variant}
                        title={alert.title}
                        description={alert.description}
                        onDismiss={() => setAlert(null)}
                    />
                ) : null}

                <ProgressBar current={currentStep} total={formDefinition.length} />

                <Step
                    step={step}
                    currentStep={currentStep}
                    isLast={isLast}
                    onBack={handleBack}
                    onNext={submitting ? () => { } : handleNext}
                    globalAnswers={answers}
                    setGlobalAnswers={setAnswers}
                />
            </div>
        </div>
    );
}
