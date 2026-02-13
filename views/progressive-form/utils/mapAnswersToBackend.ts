'use client';

import type { Answers } from '@/types/progressive-form';

const K = {
    COMPANY_NAME: 'Nombre de la empresa',
    COMPANY_TYPE: 'Tipo de empresa',
    COMPANY_WEBSITE: 'Sitio web de la empresa',
    COMPANY_DESCRIPTION: 'Descripción de la empresa',
    COMPANY_ADDRESS: 'Dirección de la empresa',
    INTERVIEW_SLOTS: 'Selecciona los horarios disponibles para entrevistas.',
    INTERVIEW_REMINDERS: 'Selecciona los recordatorios para entrevistas.',
    COMPANY_BENEFITS: 'Selecciona los beneficios generales que ofrece la empresa.',
    HR_NAME: 'Nombre de la persona de Recursos Humanos',
    HR_PHONE: 'Teléfono de la persona de Recursos Humanos',
    VACANCIES: 'Registra las vacantes de la empresa.',
    DEMOGRAPHICS: 'Configura los datos demográficos por vacante.',
    SALARY: 'Configura el salario por vacante.',
    SHIFTS: 'Configura los turnos por vacante.',
    DOCUMENTS: 'Configura los documentos requeridos por vacante.',
    TRANSPORT_CERTS_EXTRAS: 'Configura transporte, certificaciones y preguntas extra.',
    INTERVIEWS: 'Entrevistas',
    QUESTIONS_DISPLAY: 'Define cómo se mostrarán las preguntas al candidato.',
};

type BackendAddress = {
    address_line?: string;
    latitude?: number | null;
    longitude?: number | null;
    place_id?: string | null;
    formatted_address?: string | null;
    route?: string | null;
    neighborhood?: string | null;
    locality?: string | null;
    admin_area_level_1?: string | null;
    country?: string | null;
    google_maps_query_link?: string | null;
    google_maps_latlng_link?: string | null;
};

type BackendVacancy = {
    role_name: string;
    use_company_address: boolean;
    location?: BackendAddress | null;
    relevant_info?: string | null;
    about_role?: string | null;
};

type QuestionFlowGeneral = {
    order: string[];
    include: Record<string, boolean>;
    templates: Record<string, string>;
    welcomeDraft?: string | null;
};

type QuestionFlowPerRole = {
    vacancyIndexes: number[];
    questions: Record<
        string,
        {
            enabled: boolean;
            template: string;
        }
    >;
};

type CandidateQuestionFlow = {
    companyType?: string | number | null;
    general: QuestionFlowGeneral;
    perRole: QuestionFlowPerRole[];
    bookingTemplate?: string | null;
};

export type BackendPayload = {
    company_name?: string;
    company_type?: string | number;
    company_type_id?: number | null;
    company_type_label?: string | null;
    company_website?: string | null;
    company_description?: string | null;
    company_address?: BackendAddress | null;
    interview_availability?: any;
    interview_reminders?: any;
    company_benefits?: string[];
    hr_contact_name?: string | null;
    hr_contact_phone?: string | null;
    vacancies?: BackendVacancy[];
    demographics_groups?: any[];
    salary_groups?: any[];
    shift_groups?: any[];
    document_groups?: any[];
    transport_certs_extras_groups?: any[];
    interviews_groups?: any[];
    candidate_question_flow?: CandidateQuestionFlow;
};

const t = (v: unknown) => (typeof v === 'string' ? v.trim() : v);

function parseCompanyType(raw: unknown): {
    type: string | number | undefined;
    id: number | null;
    label: string | null;
} {
    if (typeof raw !== 'string') return { type: raw as any, id: null, label: null };
    const m = raw.match(/^\s*(\d+)\s*-\s*(.*)$/);
    if (m) {
        const id = Number(m[1]);
        const label = m[2].trim() || null;
        return { type: id, id, label };
    }
    return { type: raw, id: null, label: raw || null };
}

function mapAddress(raw: any): BackendAddress | null {
    if (!raw || typeof raw !== 'object') return null;
    const place = raw.interview_address_json || {};
    const comps = place.components || {};
    const maps = raw.maps_link_json || {};
    return {
        address_line: raw.address ?? null,
        latitude: raw.latitude ?? null,
        longitude: raw.longitude ?? null,
        place_id: place.place_id ?? null,
        formatted_address: place.formatted_address ?? null,
        route: comps.route ?? null,
        neighborhood: comps.neighborhood ?? null,
        locality: comps.locality ?? null,
        admin_area_level_1: comps.admin_area_level_1 ?? null,
        country: comps.country ?? null,
        google_maps_query_link: maps.queryLink ?? null,
        google_maps_latlng_link: maps.latLngLink ?? null,
    };
}

function mapVacancies(raw: any[]): BackendVacancy[] {
    return (Array.isArray(raw) ? raw : []).map((v) => ({
        role_name: String(v?.roleName ?? '').trim(),
        use_company_address: !!v?.useCompanyAddress,
        location: v?.location ? mapAddress(v.location) : null,
        relevant_info: v?.relevantInfo ?? null,
        about_role: v?.aboutRole ?? null,
    }));
}

function mapQuestionFlow(raw: any): CandidateQuestionFlow | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const gf = raw.general || {};
    const order = Array.isArray(gf.order) ? gf.order.map((s: any) => String(s)) : [];
    const include = gf.include && typeof gf.include === 'object' ? Object.fromEntries(Object.entries(gf.include).map(([k, v]) => [k, !!v])) : {};
    const templates = gf.templates && typeof gf.templates === 'object' ? Object.fromEntries(Object.entries(gf.templates).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : ''])) : {};
    const perRoleRaw = Array.isArray(raw.perRole) ? raw.perRole : [];
    const perRole: QuestionFlowPerRole[] = perRoleRaw.map((pr: any) => {
        const idxs = Array.isArray(pr?.vacancyIndexes) ? pr.vacancyIndexes.map((n: any) => Number(n)) : [];
        const qs = pr?.questions && typeof pr.questions === 'object' ? pr.questions : {};
        const normQs: QuestionFlowPerRole['questions'] = {};
        for (const key of Object.keys(qs)) {
            const q = qs[key] || {};
            normQs[key] = { enabled: !!q.enabled, template: typeof q.template === 'string' ? q.template.trim() : '' };
        }
        return { vacancyIndexes: idxs, questions: normQs };
    });
    return {
        companyType: raw.companyType ?? null,
        general: {
            order,
            include,
            templates,
            welcomeDraft: typeof gf.welcomeDraft === 'string' ? gf.welcomeDraft.trim() : null,
        },
        perRole,
        bookingTemplate: typeof raw.bookingTemplate === 'string' ? raw.bookingTemplate.trim() : null,
    };
}

export function mapAnswersToBackend(answers: Answers): BackendPayload {
    const payload: BackendPayload = {};

    payload.company_name = (t(answers[K.COMPANY_NAME]) as string) || undefined;

    const { type, id, label } = parseCompanyType(answers[K.COMPANY_TYPE]);
    payload.company_type = type as any;
    payload.company_type_id = id;
    payload.company_type_label = label;

    payload.company_website = (t(answers[K.COMPANY_WEBSITE]) as string) || null;
    payload.company_description = (t(answers[K.COMPANY_DESCRIPTION]) as string) || null;

    payload.company_address = mapAddress(answers[K.COMPANY_ADDRESS]);

    payload.interview_availability = answers[K.INTERVIEW_SLOTS] ?? undefined;
    payload.interview_reminders = answers[K.INTERVIEW_REMINDERS] ?? undefined;

    payload.company_benefits = Array.isArray(answers[K.COMPANY_BENEFITS])
        ? (answers[K.COMPANY_BENEFITS] as string[])
        : [];

    payload.hr_contact_name = (t(answers[K.HR_NAME]) as string) || null;
    payload.hr_contact_phone = (t(answers[K.HR_PHONE]) as string) || null;

    payload.vacancies = mapVacancies(answers[K.VACANCIES] as any[]);

    payload.demographics_groups = (answers[K.DEMOGRAPHICS] as any[]) ?? [];
    payload.salary_groups = (answers[K.SALARY] as any[]) ?? [];
    payload.shift_groups = (answers[K.SHIFTS] as any[]) ?? [];
    payload.document_groups = (answers[K.DOCUMENTS] as any[]) ?? [];
    payload.transport_certs_extras_groups = (answers[K.TRANSPORT_CERTS_EXTRAS] as any[]) ?? [];
    payload.interviews_groups = (answers[K.INTERVIEWS] as any[]) ?? [];

    payload.candidate_question_flow = mapQuestionFlow(answers[K.QUESTIONS_DISPLAY]);

    return payload;
}
