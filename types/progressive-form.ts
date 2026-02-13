export type Restriction = {
    max_length?: number;
    [key: string]: any;
};

export type PrimitiveOption = string;
export type ObjectOption = { label: string; value: string };
export type Option = PrimitiveOption | ObjectOption;

export type Question = {
    question: string;
    type: 'text' | 'url' | 'options' | 'google_maps' | 'component' | 'phone_number';
    required: boolean;
    restrictions?: Restriction;
    options?: Option[];
    allowMultiple?: boolean;

    componentKind?: 'vacancies' | string;
    allowCustom?: boolean;
};

export type FormStep = {
    'step-id': number;
    section_name: string;
    questions: Question[];
};

export type Answers = Record<string, any>;

export type ScheduleSlot = {
    day: string;
    start: string;
    end: string;
};

export type MapsLinkJson = {
    queryLink: string;
    latLngLink: string;
};

export type InterviewAddressJson = {
    place_id?: string;
    formatted_address?: string;
    components: {
        street_number?: string;
        route?: string;
        neighborhood?: string;
        locality?: string;
        admin_area_level_1?: string;
        country?: string;
        postal_code?: string;
    };
};

export type GoogleMapsAddressValue = {
    latitude: number;
    longitude: number;
    address: string;
    interview_address_json: InterviewAddressJson;
    maps_link_json: MapsLinkJson;
};

export type Vacancy = {
    roleName: string;
    useCompanyAddress: boolean;
    location?: GoogleMapsAddressValue | null;
    relevantInfo: string;
    aboutRole: string;
};


export type EducationLevel =
    | 'Primaria'
    | 'Secundaria'
    | 'Preparatoria'
    | 'Técnico'
    | 'Licenciatura'
    | 'Maestría'
    | 'Doctorado';

export type DemographicGroup = {
    minAge: number;
    maxAge: number;
    appliesToAll: boolean;
    vacancyIndexes: number[];
    education: EducationLevel;
};

export type SalaryPayType = 'Bruto' | 'Neto';
export type PayFrequency = 'Semanal' | 'Quincenal' | 'Mensual';

export type CandidateBankRule = 'allow_any' | 'must_match_pay_bank' | 'exclude_banks';

export type SalaryGroup = {
    payType: SalaryPayType;
    bank: string;
    frequency: PayFrequency;
    notes?: string;
    candidateBankRule: CandidateBankRule;
    candidateExcludeBanks?: string[];
    appliesToAll: boolean;
    vacancyIndexes: number[];
    amount?: number;
};

export type ShiftGroup = {
    shift: string;
    includeBreaks: boolean;
    appliesToAll: boolean;
    vacancyIndexes: number[];
    breaksNote?: string;
    discardIfCannotWorkShift?: boolean | null;
};

export type DocRequirement = 'none' | 'reminder' | 'required';

export type DocumentsGroup = {
    appliesToAll: boolean;
    vacancyIndexes: number[];
    items: Record<string, DocRequirement>;
    discardIfMissing: boolean;
};