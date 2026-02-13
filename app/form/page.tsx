'use client';

import OnboardingCompaniesProgressiveForm from '@/views/progressive-form/OnboardingCompaniesProgressiveForm';
import formDefinition from '@/views/progressive-form/data/onboarding-questions';

export default function FormPage() {
    return (
        <div className="w-4/5 mx-auto py-12">
            <OnboardingCompaniesProgressiveForm formDefinition={formDefinition} />
        </div>
    );
}
