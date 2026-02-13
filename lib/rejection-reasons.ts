/**
 * Centralized rejection reason maps for different companies
 * This file contains the mapping from English rejection reason codes to Spanish display names
 */

// Default rejection reasons map
export const DEFAULT_REJECTION_REASONS_MAP = {
    screening: 'Evaluación',
    physical_condition: 'Condición física',
    personal_presentation: 'Presentación personal',
    missing_documents: 'Falta de documentos',
    experience: 'Experiencia',
    abscense: 'Falta a entrevista',
    abscense_first_day: 'Falta primer dia',
    post_phone_failed: 'rechazado en llamada',
    other: 'Otras',
} as const;

export const DSW_REJECTION_REASONS_MAP = {
    salary_expectations: 'Expectativas salariales fuera del rango',
    poor_performance: 'Bajo desempeño en entrevistas',
    technical_test_failure: 'Resultados insuficientes en pruebas',
    location_availability: 'Problemas de ubicación',
    start_date_availability: 'Problemas de disponibilidad',
    document_delays: 'Retrasos en entrega de documentos',
    offer_declined: 'Rechaza la oferta o abandona el proceso',
    abscense: 'Falta a entrevista',
    abscense_first_day: 'Falta primer dia',
    post_phone_failed: 'rechazado en llamada',
} as const;

// Razones para Ladrillera (compañía 5)
export const LADRILLERA_REJECTION_REASONS_MAP = {
    no_cumple_perfil: 'No cumple el perfil del puesto',
    declined_technical_area: 'Declinado por área técnica',
    distance_home_work: 'Distancia de casa-trabajo',
    declined_salary: 'Declina por salario',
    abscense: 'Falta a entrevista',
    abscense_first_day: 'Falta primer dia',
    post_phone_failed: 'rechazado en llamada',
    other: 'Otras',
} as const;

// Razones para Tetakawi (compañía 6) - defaults sin presentación personal y veracity examen
export const TETAKAWI_REJECTION_REASONS_MAP = {
    screening: 'Evaluación',
    physical_condition: 'Condición física',
    missing_documents: 'Falta documentos',
    rehiring: 'Reingreso',
    investigation: 'Investigación',
    experience: 'Experiencia',
    abscense: 'Falta a entrevista',
    abscense_first_day: 'Falta primer dia',
    post_phone_failed: 'Rechazado en llamada',
    other: 'Otras',
} as const;

// Razones para Integer (compañías 3 y 10)
export const INTEGER_REJECTIONS_MAP = {
    screening: 'Evaluación',
    physical_condition: 'Condición física',
    personal_presentation: 'Presentación personal',
    missing_documents: 'Falta documentos',
    antidoping_evidence: 'Exámen veracity',
    experience: 'Experiencia',
    abscense: 'Falta a entrevista',
    abscense_first_day: 'Falta primer dia',
    post_phone_failed: 'Rechazado en llamada',
    other: 'Otras',
} as const;

export const CEMEX_REJECTION_REASONS_MAP = {
    no_cumple_perfil: 'No cumple con el perfil',
    no_interesado: 'Dejó de responder / No interesado',
    declined_offer: 'Declinó por oferta',
    distance: 'Distancia',
    rejected_by_client: 'Descartado con cliente',
    out_of_town: 'Foráneo',
    attitude: 'Actitud',
    missing_documents: 'Falta de documentos',
    no_attended_medical: 'No acudió a médicos',
    not_medically_fit: 'No apto en médicos',
    references_investigation: 'Referencias / Investigación',
    abscense: 'Falta a entrevista',
    abscense_first_day: 'Falta a primer dia',
} as const;

// Razones para Tacna
export const TACNA_REJECTION_REASONS_MAP = {
    screening: 'Evaluación',
    physical_condition: 'Condición física',
    personal_presentation: 'Presentación personal',
    missing_documents: 'Falta de documentos',
    experience: 'Experiencia',
    abscense: 'Falta a entrevista',
    abscense_first_day: 'Falta primer dia',
    post_phone_failed: 'rechazado en llamada',
    other: 'Otras',
    ability_test: 'Prueba de Habilidad',
    medical_exam: 'Examen Médico',
} as const;

// Razones para Proboca (compañía 189)
export const PROBOCA_REJECTION_REASONS_MAP = {
    age: 'Edad',
    health: 'Salud',
    location: 'Ubicación',
    salary: 'Sueldos',
    no_cumple_perfil: 'No cumple perfil',
    incomplete_paperwork: 'Papelería incompleta',
    legal_issues: 'Temas legales',
    closed_position_portfolio: 'Vacante cerrada - Cartera',
    abscense: 'Falta a entrevista',
} as const;

export const COMPANY_192_REJECTION_REASONS_MAP = {
    driving_test_theory: 'Examen de Manejo teorico',
    driving_test_practical: 'Examen de Manejo practico',
    distance_home_work: 'Distancia de casa-trabajo',
    anti_doping: 'Examen antidoping',
    license_expiration: 'Vencimiento de licencia',
    abscense: 'Falta a entrevista',
    abscense_first_day: 'Falta primer dia',
    salary: 'Sueldos',
    no_cumple_perfil: 'No cumple perfil',
    incomplete_paperwork: 'Papelería incompleta',
    other: 'Otras',
} as const;

// Type definitions
export type DefaultRejectionReason = keyof typeof DEFAULT_REJECTION_REASONS_MAP;
export type LadrilleraRejectionReason =
    keyof typeof LADRILLERA_REJECTION_REASONS_MAP;
export type TetakawiRejectionReason =
    keyof typeof TETAKAWI_REJECTION_REASONS_MAP;
export type IntegerRejectionReason = keyof typeof INTEGER_REJECTIONS_MAP;
export type DSWRejectionReason = keyof typeof DSW_REJECTION_REASONS_MAP;
export type CemexRejectionReason = keyof typeof CEMEX_REJECTION_REASONS_MAP;
export type TacnaRejectionReason = keyof typeof TACNA_REJECTION_REASONS_MAP;
export type ProbocaRejectionReason = keyof typeof PROBOCA_REJECTION_REASONS_MAP;
export type Company192RejectionReason = keyof typeof COMPANY_192_REJECTION_REASONS_MAP;

export type RejectionReason =
    | DefaultRejectionReason
    | LadrilleraRejectionReason
    | TetakawiRejectionReason
    | IntegerRejectionReason
    | DSWRejectionReason
    | CemexRejectionReason
    | TacnaRejectionReason
    | ProbocaRejectionReason
    | Company192RejectionReason;

/**
 * Get the appropriate rejection reasons map based on company ID
 * @param companyId - The company ID to get rejection reasons for
 * @returns The rejection reasons map for the company
 */
export function getRejectionReasonsMap(companyId: number) {
    // DSW companies (IDs 12-150)
    if (companyId >= 12 && companyId <= 150) {
        return DSW_REJECTION_REASONS_MAP;
    }

    switch (companyId) {
        case 3:
        case 10:
            return INTEGER_REJECTIONS_MAP;
        case 5:
            return LADRILLERA_REJECTION_REASONS_MAP;
        case 6:
        case 172:
        case 171:
        case 170:
        case 169:
        case 168:
        case 167:
        case 166:
            return TETAKAWI_REJECTION_REASONS_MAP;
        case 178:
            return TACNA_REJECTION_REASONS_MAP;
        case 179:
            return CEMEX_REJECTION_REASONS_MAP;
        case 189:
            return PROBOCA_REJECTION_REASONS_MAP;
        case 192:
            return COMPANY_192_REJECTION_REASONS_MAP;
        default:
            return DEFAULT_REJECTION_REASONS_MAP;
    }
}

/**
 * Get the Spanish label for a rejection reason based on company ID
 * @param rejectionReason - The English rejection reason code
 * @param companyId - The company ID to get the correct mapping
 * @returns The Spanish label for the rejection reason, or the original reason if not found
 */
export function getRejectionReasonLabel(
    rejectionReason: string,
    companyId: number
): string {
    const map = getRejectionReasonsMap(companyId);
    return map[rejectionReason as keyof typeof map] || rejectionReason;
}

/**
 * Get all available rejection reasons for a company
 * @param companyId - The company ID
 * @returns Array of rejection reason codes
 */
export function getAvailableRejectionReasons(companyId: number): string[] {
    const map = getRejectionReasonsMap(companyId);
    return Object.keys(map);
}
