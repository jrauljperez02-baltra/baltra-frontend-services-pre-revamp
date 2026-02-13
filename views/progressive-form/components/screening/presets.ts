export type GeneralKey =
    | 'welcome'
    | 'name'
    | 'age'
    | 'education'
    | 'shifts'
    | 'select_role'
    | 'select_role_eligibility'
    | 'location_critical'
    | 'location'
    | 'experience'
    | 'references'
    | 'last12months'
    | 'documents'
    | 'bank'
    | 'certifications_general';

export type RoleKey =
    | 'location'
    | 'experience'
    | 'references'
    | 'last12months'
    | 'certifications'
    | 'documents'
    | 'bank'
    | 'education'
    | 'shifts';

export type ScreeningHints = {
    hasDocuments: boolean;
    hasCerts: boolean;
    hasBank: boolean;
};

export type ScreeningPreset = {
    label: string;
    undefinedGroup?: boolean;
    generalOrder: GeneralKey[];
    generalInclude: Partial<Record<GeneralKey, boolean>>;
    roleEnable: Partial<Record<RoleKey, boolean>>;
    welcomeDraft?: string;
};

const BASE_WELCOME =
    '¡Hola! 👋 Gracias por tu interés. Te haremos unas preguntas rápidas para continuar.';

const G_ON_BASE: Partial<Record<GeneralKey, boolean>> = {
    welcome: true,
    name: true,
};

export function getScreeningPreset(
    companyType: string,
    hints: ScreeningHints
): ScreeningPreset {
    switch (companyType) {
        case '2 - Criterios de Elegibilidad parcial': {
            return {
                label: companyType,
                generalOrder: [
                    'welcome',
                    'name',
                    'age',
                    'education',
                    'shifts',
                    'certifications_general',
                    'select_role_eligibility',
                ],
                generalInclude: {
                    ...G_ON_BASE,
                    age: false,
                    education: false,
                    shifts: false,
                    certifications_general: false,
                    select_role_eligibility: false,
                },
                roleEnable: {
                    location: false,
                    experience: false,
                    references: false,
                    last12months: false,
                    documents: hints.hasDocuments ? true : false,
                    bank: hints.hasBank ? true : false,
                },
                welcomeDraft: BASE_WELCOME,
            };
        }
        case '3 - Criterios de Elegibilidad por vacante': {
            return {
                label: companyType,
                generalOrder: [
                    'welcome',
                    'name',
                    'age',
                    'education',
                    'shifts',
                    'last12months',
                    'certifications_general',
                    'location',
                    'experience',
                    'references',
                    'documents',
                    'bank',
                    'select_role_eligibility',
                ],
                generalInclude: {
                    ...G_ON_BASE,
                    age: false,
                    education: false,
                    shifts: false,
                    last12months: false,
                    certifications_general: false,
                    location: false,
                    experience: false,
                    references: false,
                    documents: false,
                    bank: false,
                    select_role_eligibility: false,
                },
                roleEnable: {},
                welcomeDraft: BASE_WELCOME,
            };
        }
        case '4 - Empresas de Manufactura': {
            return {
                label: companyType,
                generalOrder: ['welcome', 'name', 'age', 'education', 'shifts', 'select_role'],
                generalInclude: {
                    ...G_ON_BASE,
                    age: false,
                    education: false,
                    shifts: false,
                    select_role: false,
                },
                roleEnable: {
                    location: false,
                    experience: false,
                    references: false,
                    last12months: false,
                    certifications: hints.hasCerts ? true : false,
                    documents: hints.hasDocuments ? true : false,
                    bank: hints.hasBank ? true : false,
                },
                welcomeDraft: BASE_WELCOME,
            };
        }
        case '5 - Empresas de Limpieza o Seguridad': {
            return {
                label: companyType,
                generalOrder: ['welcome', 'name', 'age', 'location_critical'],
                generalInclude: {
                    ...G_ON_BASE,
                    age: false,
                    location_critical: false,
                },
                roleEnable: {
                    education: false,
                    shifts: false,
                    experience: false,
                    references: false,
                    last12months: false,
                    documents: hints.hasDocuments ? true : false,
                    bank: hints.hasBank ? true : false,
                },
                welcomeDraft:
                    '¡Hola! 🙋‍♀️ Soy del equipo de reclutamiento. Ayúdanos con unas preguntas para continuar.',
            };
        }
        case '1 - Cadena de Retail':
        default: {
            return {
                label: companyType,
                undefinedGroup: true,
                generalOrder: ['welcome', 'name', 'age', 'education', 'shifts'],
                generalInclude: { ...G_ON_BASE, age: false, education: false, shifts: false },
                roleEnable: {},
                welcomeDraft: BASE_WELCOME,
            };
        }
    }
}
