import { BACKEND_BASE_URL } from "@/config/env";

export interface CompanyResponse {
    data: CompanyData;
    success: boolean;
}

export interface CompanyData {
    address: string;
    business_unit_id: number;
    interview_days: string[];
    interview_excluded_dates: string[];
    interview_hours: string[];
    latitude: number;
    longitude: number;
    name: string;
    benefits?: string[];
    description: string;
    website: string;
    general_faq: {
        answer: string;
        index: string;
        question: string;
    }[];
    phone: string;
    interview_addresses: {
        address: string;
        map_link: string;
        location_id: number;
    }[];
    group_id: number | null;
    timezone?: string;
    qr_attendance_s3_path?: string | null;
}

// Screening Stats Types
export interface ScreeningStatsResponse {
    data: ScreeningStatsData;
    success: boolean;
}

export interface ScreeningStatsData {
    ad_reach_data: {
        ad_trigger_phrase: string;
        candidates_not_reached_via_ad: number;
        candidates_reached_via_ad: number;
        total_candidates: number;
    };
    churn_data: Record<string, number>;
    multi_user_data: {
        multi_user_message_candidates: number;
        total_screening_candidates: number;
    };
    rejected_candidates: {
        screening_rejections: Record<string, number>;
        manual_rejections: Record<string, number>;
    };
}

const apiUrl = BACKEND_BASE_URL.replace(/\/$/, '');

function assertValidCompanyId(companyId: number) {
    if (!Number.isFinite(companyId) || companyId <= 0) {
        const err = new Error(
            `Invalid companyId provided to API call: ${companyId}`
        );
        // Log a warning with a stack to help track where this comes from during development
        if (typeof console !== 'undefined') {
            // eslint-disable-next-line no-console
            console.warn(
                '[api] Blocked API call due to invalid companyId:',
                companyId,
                err.stack
            );
        }
        throw err;
    }
}

export async function getCompanyData(companyId: number): Promise<CompanyData> {
    assertValidCompanyId(companyId);
    console.log(
        `Attempting to fetch company data from: ${apiUrl}/api/v1/screening/company/${companyId}`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(30000),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching company data:`,
                errorText
            );
            throw new Error(
                `Failed to fetch company data: ${response.status} ${response.statusText}`
            );
        }

        const result = (await response.json()) as CompanyResponse;

        if ('success' in result && !result.success) {
            throw new Error('Failed to fetch company data from API');
        }

        if (!result.data) {
            console.error(
                'Invalid data structure received from company data API:',
                result.data
            );
            throw new Error(
                'Invalid data structure received from company data API'
            );
        }

        // Map company_group_id to group_id for backward compatibility after migration
        // The backend returns company_group_id, but frontend expects group_id
        if ('company_group_id' in result.data && !('group_id' in result.data)) {
            (result.data as any).group_id = (result.data as any).company_group_id;
        }

        return result.data;
    } catch (error) {
        console.error('Error fetching company data:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.error('Request timed out while fetching company data.');
            throw new Error('The request for company data timed out.');
        }
        throw error;
    }
}

export interface ReferralStatsResponse {
    success: boolean;
    data: ReferralStatsData[];
}

export interface ReferralStatsData {
    referred_by: string;
    hired: number;
    onboarding: number;
    interviewed: number;
    rejected: number;
}

export async function getReferralStats(
    companyId: number,
    startDate?: string,
    endDate?: string
): Promise<ReferralStatsData[]> {
    assertValidCompanyId(companyId);
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const url = `${apiUrl}/api/v1/screening/company/${companyId}/candidates/referral-stats${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(
        url,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(30000),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error(
            `API error (${response.status}) fetching referral stats:`,
            errorText
        );
        throw new Error(
            `Failed to fetch referral stats: ${response.status} ${response.statusText}`
        );
    }

    const result: ReferralStatsResponse = await response.json();
    if (!result.success) {
        throw new Error('Failed to fetch referral stats: API returned success=false');
    }

    return result.data;
}

export interface GroupedCandidatesResponse {
    success: boolean;
    data: GroupedCandidatesData[];
}

export interface GroupedCandidatesData {
    hired?: CandidateGroupItem[];
    onboarding?: CandidateGroupItem[];
    interviewed?: CandidateGroupItem[];
    rejected?: CandidateGroupItem[];
}

export interface CandidateGroupItem {
    candidate_id: number;
    phone: string;
    name: string;
    referred_by: string;
    interview_date_time: string | null;
    rejected_reason?: string | null;
    role_name?: string | null;
    education_level?: string | null;
    age?: number | null;
    gender?: string | null;
}

export async function getGroupedCandidatesByState(
    companyId: number,
    startDate?: string,
    endDate?: string
): Promise<GroupedCandidatesData[]> {
    assertValidCompanyId(companyId);
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const url = `${apiUrl}/api/v1/screening/company/${companyId}/candidates/grouped-by-state${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(
        url,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(30000),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error(
            `API error (${response.status}) fetching grouped candidates:`,
            errorText
        );
        throw new Error(
            `Failed to fetch grouped candidates: ${response.status} ${response.statusText}`
        );
    }

    const result: GroupedCandidatesResponse = await response.json();
    if (!result.success) {
        throw new Error('Failed to fetch grouped candidates: API returned success=false');
    }

    return result.data;
}

export async function getScreeningStats(
    companyId: number,
    startDate?: string,
    endDate?: string
): Promise<ScreeningStatsData> {
    assertValidCompanyId(companyId);
    console.log(
        `Attempting to fetch screening stats from: ${apiUrl}/api/v1/screening/company/${companyId}/stats`
    );

    try {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const queryString = params.toString();
        const url = `${apiUrl}/api/v1/screening/company/${companyId}/stats${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching screening stats:`,
                errorText
            );
            throw new Error(
                `Failed to fetch screening stats: ${response.status} ${response.statusText}`
            );
        }

        const result = (await response.json()) as ScreeningStatsResponse;
        console.log('Screening stats API response:', result);

        if ('success' in result && !result.success) {
            throw new Error('Failed to fetch screening stats from API');
        }

        if (!result.data) {
            console.error(
                'Invalid data structure received from screening stats API:',
                result.data
            );
            throw new Error(
                'Invalid data structure received from screening stats API'
            );
        }

        return result.data;
    } catch (error) {
        console.error('Error fetching screening stats:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.error('Request timed out while fetching screening stats.');
            throw new Error('The request for screening stats timed out.');
        }
        throw error;
    }
}

export async function postCompanyFAQs(
    companyId: number,
    payload: FAQPayload
): Promise<ApiResponse> {
    console.log(
        `Attempting to post role FAQs for company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}/faqs`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/faqs`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(30000),
            }
        );

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(
            `Error during post request to ${apiUrl}/api/v1/screening/company/${companyId}/faqs:`,
            error
        );
        return {
            success: false,
            error: 'An error occurred during the request.',
        };
    }
}

// Onboarding types and API helpers
// Use a base URL sanitized only for onboarding to avoid double slashes
const onboardingBase = BACKEND_BASE_URL.replace(/\/$/, '');
export interface OnboardingAnswerItem {
    id: number;
    candidate_id: number;
    created_at: string;
    question: string;
    answer: string;
    survey: 'checklist_1' | 'checklist_2' | 'pulse' | string;
}

export interface OnboardingOverviewData {
    candidate_id: number;
    // Legacy/example field
    candidate_name?: string;
    // New per docs
    candidate?: {
        candidate_id: number;
        name: string;
        phone: string;
        role_name: string;
    };
    checklists: {
        checklist_1: OnboardingAnswerItem[];
        checklist_2: OnboardingAnswerItem[];
        [key: string]: OnboardingAnswerItem[];
    };
    pulse: OnboardingAnswerItem[];
    meta?: {
        limit_per_section: number;
        totals: Record<string, number>;
    };
}

interface OnboardingOverviewResponse {
    success: boolean;
    data: OnboardingOverviewData;
}

interface OnboardingGroupedResponsesResponse {
    success: boolean;
    data: Record<string, OnboardingAnswerItem[]>;
}

interface OnboardingListResponse {
    success: boolean;
    data: OnboardingAnswerItem[];
}

export async function getOnboardingOverview(
    companyId: number,
    candidateId: number,
    limitPerSection?: number
): Promise<OnboardingOverviewData> {
    const params = new URLSearchParams();
    if (typeof limitPerSection === 'number')
        params.set('limit_per_section', String(limitPerSection));
    const qs = params.toString();
    const url = `${onboardingBase}/api/v1/screening/company/${companyId}/candidates/${candidateId}/onboarding/overview${qs ? `?${qs}` : ''}`;
    console.log(`Attempting to fetch onboarding overview from: ${url}`);
    try {
        const response = await fetch(url, {
            method: 'GET',
            // Avoid setting Content-Type on GET to prevent CORS preflight (OPTIONS)
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching onboarding overview:`,
                errorText
            );
            throw new Error(
                `Failed to fetch onboarding overview: ${response.status} ${response.statusText}`
            );
        }
        const result = (await response.json()) as OnboardingOverviewResponse;
        if (!result.success || !result.data) {
            throw new Error('Invalid onboarding overview response');
        }
        return result.data;
    } catch (error) {
        console.error('Error fetching onboarding overview:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('The request for onboarding overview timed out.');
        }
        throw error;
    }
}

export async function getOnboardingResponses(
    companyId: number,
    candidateId: number
): Promise<Record<string, OnboardingAnswerItem[]>> {
    const url = `${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}/onboarding/responses`;
    console.log(
        `Attempting to fetch onboarding grouped responses from: ${url}`
    );
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching onboarding responses:`,
                errorText
            );
            throw new Error(
                `Failed to fetch onboarding responses: ${response.status} ${response.statusText}`
            );
        }
        const result =
            (await response.json()) as OnboardingGroupedResponsesResponse;
        if (!result.success || !result.data) {
            throw new Error('Invalid onboarding responses response');
        }
        return result.data;
    } catch (error) {
        console.error('Error fetching onboarding responses:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('The request for onboarding responses timed out.');
        }
        throw error;
    }
}

export async function getOnboardingPulse(
    companyId: number,
    candidateId: number
): Promise<OnboardingAnswerItem[]> {
    const url = `${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}/onboarding/responses?survey=pulse`;
    console.log(`Attempting to fetch onboarding pulse from: ${url}`);
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching onboarding pulse:`,
                errorText
            );
            throw new Error(
                `Failed to fetch onboarding pulse: ${response.status} ${response.statusText}`
            );
        }
        const result = (await response.json()) as OnboardingListResponse;
        if (!result.success || !result.data) {
            throw new Error('Invalid onboarding pulse response');
        }
        return result.data;
    } catch (error) {
        console.error('Error fetching onboarding pulse:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('The request for onboarding pulse timed out.');
        }
        throw error;
    }
}

export async function getOnboardingChecklist(
    companyId: number,
    candidateId: number,
    checklistNumber: 1 | 2
): Promise<OnboardingAnswerItem[]> {
    const url = `${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}/onboarding/checklist/${checklistNumber}`;
    console.log(
        `Attempting to fetch onboarding checklist ${checklistNumber} from: ${url}`
    );
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching onboarding checklist ${checklistNumber}:`,
                errorText
            );
            throw new Error(
                `Failed to fetch onboarding checklist ${checklistNumber}: ${response.status} ${response.statusText}`
            );
        }
        const result = (await response.json()) as OnboardingListResponse;
        if (!result.success || !result.data) {
            throw new Error('Invalid onboarding checklist response');
        }
        return result.data;
    } catch (error) {
        console.error(
            `Error fetching onboarding checklist ${checklistNumber}:`,
            error
        );
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('The request for onboarding checklist timed out.');
        }
        throw error;
    }
}

// Extended helpers per docs
export interface OnboardingGroupedResult {
    groups: Record<string, OnboardingAnswerItem[]>;
    meta?: {
        limit_per_section: number;
        totals: Record<string, number>;
    };
}

export interface OnboardingPaginated<T> {
    items: T[];
    page: number;
    per_page: number;
    total: number;
}

// Company-level (global) onboarding stats
export interface OnboardingChecklistStat {
    question: string;
    yes: number;
    total: number;
    percentage: number; // 0-100
}

export interface OnboardingPulseWeekStat {
    week: string; // e.g. "2025-W35"
    avg: number; // 1-5
    responses: number;
}

export type OnboardingPulseByQuestion = Array<{
    question: string;
    series: OnboardingPulseWeekStat[];
}>;

export interface OnboardingKPIs {
    employees_in_onboarding: number;
    checklist_1_completed: number;
    checklist_2_completed: number;
    avg_satisfaction: number; // 1-5
}

export async function getOnboardingCompanyStatsChecklist(
    companyId: number,
    checklistNumber: 1 | 2,
    month?: string, // YYYY-MM
    startDate?: string, // YYYY-MM-DD
    endDate?: string // YYYY-MM-DD
): Promise<OnboardingChecklistStat[]> {
    const params = new URLSearchParams();
    if (startDate && endDate) {
        params.set('start_date', startDate);
        params.set('end_date', endDate);
    } else if (month) {
        params.set('month', month);
    }
    const url = `${onboardingBase}/api/v1/screening/company/${companyId}/onboarding/stats/checklist/${checklistNumber}${params.toString() ? `?${params.toString()}` : ''}`;
    console.log(
        `Attempting to fetch company checklist ${checklistNumber} stats from: ${url}`
    );
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching company checklist ${checklistNumber} stats:`,
                errorText
            );
            throw new Error(
                `Failed to fetch company checklist ${checklistNumber} stats: ${response.status} ${response.statusText}`
            );
        }
        const raw = await response.json();
        if (!raw?.success || !Array.isArray(raw?.data))
            throw new Error('Invalid company checklist stats response');
        return raw.data as OnboardingChecklistStat[];
    } catch (error) {
        console.error('Error fetching company checklist stats:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error(
                'The request for company checklist stats timed out.'
            );
        }
        throw error;
    }
}

export async function getOnboardingCompanyStatsPulse(
    companyId: number,
    month?: string, // YYYY-MM
    startDate?: string, // YYYY-MM-DD
    endDate?: string, // YYYY-MM-DD
    opts?: { byQuestion?: boolean }
): Promise<OnboardingPulseWeekStat[] | OnboardingPulseByQuestion> {
    const params = new URLSearchParams();
    if (startDate && endDate) {
        params.set('start_date', startDate);
        params.set('end_date', endDate);
    } else if (month) {
        params.set('month', month);
    }
    if (opts?.byQuestion) params.set('by_question', 'true');
    const url = `${onboardingBase}/api/v1/screening/company/${companyId}/onboarding/stats/pulse${params.toString() ? `?${params.toString()}` : ''}`;
    console.log(`Attempting to fetch company pulse stats from: ${url}`);
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching company pulse stats:`,
                errorText
            );
            throw new Error(
                `Failed to fetch company pulse stats: ${response.status} ${response.statusText}`
            );
        }
        const raw = await response.json();
        if (!raw?.success || !raw?.data)
            throw new Error('Invalid company pulse stats response');
        return raw.data as
            | OnboardingPulseWeekStat[]
            | OnboardingPulseByQuestion;
    } catch (error) {
        console.error('Error fetching company pulse stats:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('The request for company pulse stats timed out.');
        }
        throw error;
    }
}

export async function getOnboardingCompanyKPIs(
    companyId: number,
    month?: string, // YYYY-MM
    startDate?: string, // YYYY-MM-DD
    endDate?: string // YYYY-MM-DD
): Promise<OnboardingKPIs> {
    const params = new URLSearchParams();
    if (startDate && endDate) {
        params.set('start_date', startDate);
        params.set('end_date', endDate);
    } else if (month) {
        params.set('month', month);
    }
    const url = `${onboardingBase}/api/v1/screening/company/${companyId}/onboarding/stats/kpis${params.toString() ? `?${params.toString()}` : ''}`;
    console.log(`Attempting to fetch company onboarding KPIs from: ${url}`);
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching company onboarding KPIs:`,
                errorText
            );
            throw new Error(
                `Failed to fetch company onboarding KPIs: ${response.status} ${response.statusText}`
            );
        }
        const raw = await response.json();
        if (!raw?.success || !raw?.data)
            throw new Error('Invalid company onboarding KPIs response');
        return raw.data as OnboardingKPIs;
    } catch (error) {
        console.error('Error fetching company onboarding KPIs:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error(
                'The request for company onboarding KPIs timed out.'
            );
        }
        throw error;
    }
}

export async function getOnboardingResponsesGrouped(
    companyId: number,
    candidateId: number,
    limitPerSection?: number
): Promise<OnboardingGroupedResult> {
    const params = new URLSearchParams();
    if (typeof limitPerSection === 'number')
        params.set('limit_per_section', String(limitPerSection));
    const qs = params.toString();
    const url = `${onboardingBase}/api/v1/screening/company/${companyId}/candidates/${candidateId}/onboarding/responses${qs ? `?${qs}` : ''}`;
    console.log(
        `Attempting to fetch onboarding grouped responses from: ${url}`
    );
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching onboarding responses:`,
                errorText
            );
            throw new Error(
                `Failed to fetch onboarding responses: ${response.status} ${response.statusText}`
            );
        }
        const raw = await response.json();
        if (!raw?.success || !raw?.data)
            throw new Error('Invalid onboarding responses response');
        const meta = raw.meta as OnboardingGroupedResult['meta'] | undefined;
        return {
            groups: raw.data as Record<string, OnboardingAnswerItem[]>,
            meta,
        };
    } catch (error) {
        console.error('Error fetching onboarding grouped responses:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('The request for onboarding responses timed out.');
        }
        throw error;
    }
}

export async function getOnboardingResponsesSingle(
    companyId: number,
    candidateId: number,
    survey: 'pulse' | 'checklist_1' | 'checklist_2',
    page?: number,
    perPage?: number
): Promise<OnboardingPaginated<OnboardingAnswerItem>> {
    const params = new URLSearchParams({ survey });
    if (typeof page === 'number') params.set('page', String(page));
    if (typeof perPage === 'number') params.set('per_page', String(perPage));
    const url = `${onboardingBase}/api/v1/screening/company/${companyId}/candidates/${candidateId}/onboarding/responses?${params.toString()}`;
    console.log(
        `Attempting to fetch onboarding ${survey} paginated from: ${url}`
    );
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching onboarding ${survey}:`,
                errorText
            );
            throw new Error(
                `Failed to fetch onboarding ${survey}: ${response.status} ${response.statusText}`
            );
        }
        const raw = await response.json();
        if (!raw?.success || !raw?.data)
            throw new Error('Invalid onboarding single response');
        return raw.data as OnboardingPaginated<OnboardingAnswerItem>;
    } catch (error) {
        console.error(`Error fetching onboarding ${survey}:`, error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error(
                'The request for onboarding single responses timed out.'
            );
        }
        throw error;
    }
}

export async function getOnboardingChecklistPage(
    companyId: number,
    candidateId: number,
    checklistNumber: 1 | 2,
    page?: number,
    perPage?: number
): Promise<OnboardingPaginated<OnboardingAnswerItem>> {
    const params = new URLSearchParams();
    if (typeof page === 'number') params.set('page', String(page));
    if (typeof perPage === 'number') params.set('per_page', String(perPage));
    const qs = params.toString();
    const url = `${onboardingBase}/api/v1/screening/company/${companyId}/candidates/${candidateId}/onboarding/checklist/${checklistNumber}${qs ? `?${qs}` : ''}`;
    console.log(
        `Attempting to fetch onboarding checklist ${checklistNumber} paginated from: ${url}`
    );
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching onboarding checklist ${checklistNumber}:`,
                errorText
            );
            throw new Error(
                `Failed to fetch onboarding checklist ${checklistNumber}: ${response.status} ${response.statusText}`
            );
        }
        const raw = await response.json();
        if (!raw?.success || !raw?.data)
            throw new Error('Invalid onboarding checklist response');
        return raw.data as OnboardingPaginated<OnboardingAnswerItem>;
    } catch (error) {
        console.error(
            `Error fetching onboarding checklist ${checklistNumber}:`,
            error
        );
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('The request for onboarding checklist timed out.');
        }
        throw error;
    }
}

export interface OnboardingCandidateLite {
    candidate_id: number;
    name: string;
    phone: string;
    role_name: string;
}

export async function searchOnboardingCandidates(
    companyId: number,
    q: string,
    type: 'name' | 'rfc' | 'curp' = 'name',
    limit = 10
): Promise<OnboardingCandidateLite[]> {
    const params = new URLSearchParams({ q, type, limit: String(limit) });
    const url = `${onboardingBase}/api/v1/screening/company/${companyId}/onboarding/candidates/search?${params.toString()}`;
    console.log(`Attempting to search onboarding candidates from: ${url}`);
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) searching onboarding candidates:`,
                errorText
            );
            throw new Error(
                `Failed to search onboarding candidates: ${response.status} ${response.statusText}`
            );
        }
        const raw = await response.json();
        if (!raw?.success || !Array.isArray(raw?.data))
            throw new Error('Invalid onboarding candidate search response');
        return raw.data as OnboardingCandidateLite[];
    } catch (error) {
        console.error('Error searching onboarding candidates:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error(
                'The request for onboarding candidate search timed out.'
            );
        }
        throw error;
    }
}

export interface ApiResponse {
    success: boolean;
    error?: string;
    details?: string;
}

export interface InterviewDaysPayload {
    days: string[];
}

export interface InterviewHoursPayload {
    hours: string[];
}

export interface ExcludedDatesPayload {
    dates: string[];
}

export interface ExcludedDatesWithActionPayload {
    dates: string[];
}

async function postOrDelete(
    method: 'POST' | 'DELETE',
    url: string,
    payload: object
): Promise<ApiResponse> {
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(30000),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(`Error during ${method} request to ${url}:`, error);
        return {
            success: false,
            error: 'An error occurred during the request.',
        };
    }
}

export function addInterviewDays(
    companyId: number,
    payload: InterviewDaysPayload
): Promise<ApiResponse> {
    console.log(
        `Attempting to add interview days for company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}/interview_days`
    );

    return postOrDelete(
        'POST',
        `${apiUrl}/api/v1/screening/company/${companyId}/interview_days`,
        payload
    );
}

export function removeInterviewDays(
    companyId: number,
    payload: InterviewDaysPayload
): Promise<ApiResponse> {
    console.log(
        `Attempting to remove interview days for company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}/interview_days`
    );
    return postOrDelete(
        'DELETE',
        `${apiUrl}/api/v1/screening/company/${companyId}/interview_days`,
        payload
    );
}

export function addInterviewHours(
    companyId: number,
    payload: InterviewHoursPayload
): Promise<ApiResponse> {
    console.log(
        `Attempting to add interview hours for company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}/interview_hours`
    );
    return postOrDelete(
        'POST',
        `${apiUrl}/api/v1/screening/company/${companyId}/interview_hours`,
        payload
    );
}

export function removeInterviewHours(
    companyId: number,
    payload: InterviewHoursPayload
): Promise<ApiResponse> {
    console.log(
        `Attempting to remove interview hours for company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}/interview_hours`
    );
    return postOrDelete(
        'DELETE',
        `${apiUrl}/api/v1/screening/company/${companyId}/interview_hours`,
        payload
    );
}

export function addExcludedDates(
    companyId: number,
    payload: ExcludedDatesPayload
): Promise<ApiResponse> {
    console.log(
        `Attempting to add excluded dates for company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}/interview_excluded_dates`
    );
    return postOrDelete(
        'POST',
        `${apiUrl}/api/v1/screening/company/${companyId}/interview_excluded_dates`,
        payload
    );
}

export function removeExcludedDates(
    companyId: number,
    payload: ExcludedDatesPayload
): Promise<ApiResponse> {
    console.log(
        `Attempting to remove excluded dates for company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}/interview_excluded_dates`
    );

    return postOrDelete(
        'DELETE',
        `${apiUrl}/api/v1/screening/company/${companyId}/interview_excluded_dates`,
        payload
    );
}

// Test function to verify API connection
export async function testApiConnection(): Promise<CompanyData> {
    console.log(
        `Testing API connection to: ${apiUrl}/api/v1/screening/company/test`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/test`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(30000),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API test error (${response.status}):`, errorText);
            throw new Error(
                `Test API failed: ${response.status} ${response.statusText}`
            );
        }

        const result = (await response.json()) as CompanyResponse;
        console.log('Test API response:', result);

        if (!result.success || !result.data) {
            throw new Error('Invalid response from test API');
        }

        return result.data;
    } catch (error) {
        console.error('Error testing API connection:', error);
        throw error;
    }
}

export interface RoleResponse {
    data: RoleData[];
    success: boolean;
}

export interface RoleData {
    business_unit_id: number;
    id: number;
    info: Info[];
    name: string;
    set_id: number;
    active: boolean;
    eligibility_criteria?: {
        [x: string | number]: string;
    };
}

export interface Info {
    answer: string;
    index: string;
    question: string;
}

export async function getRolesData(companyId: number): Promise<RoleData[]> {
    assertValidCompanyId(companyId);
    console.log(
        `Attempting to fetch role data from: ${apiUrl}/api/v1/screening/company/${companyId}/roles`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/roles`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(30000),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching role data:`,
                errorText
            );
            throw new Error(
                `Failed to fetch role data: ${response.status} ${response.statusText}`
            );
        }

        const result = (await response.json()) as RoleResponse;
        console.log('Role data API response:', result);

        if ('success' in result && !result.success) {
            throw new Error('Failed to fetch role data from API');
        }

        if (!result.data) {
            console.error(
                'Invalid data structure received from role data API:',
                result.data
            );
            throw new Error(
                'Invalid data structure received from role data API'
            );
        }

        return result.data;
    } catch (error) {
        console.error('Error fetching role data:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.error('Request timed out while fetching role data.');
            throw new Error('The request for role data timed out.');
        }
        throw error;
    }
}

export interface FAQPayload {
    faqs: {
        question: string;
        answer: string;
        index: string;
    }[];
}

export async function postRoleFAQs(
    companyId: number,
    roleId: number,
    payload: FAQPayload
): Promise<ApiResponse> {
    console.log(
        `Attempting to post role FAQs for company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}/roles/${roleId}/faqs`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/roles/${roleId}/faqs`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(30000),
            }
        );

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(
            `Error during post request to ${apiUrl}/api/v1/screening/company/${companyId}/roles/${roleId}/faqs:`,
            error
        );
        return {
            success: false,
            error: 'An error occurred during the request.',
        };
    }
}

export interface QuestionsSetResponse {
    data: QuestionSet[];
    success: boolean;
}

export interface QuestionSet {
    end_interview_answer: string;
    example_answer: null | string;
    id: number;
    metadata: null;
    position: number;
    question: string;
    type: string;
    set_id: number;
    is_blocked: boolean;
}

export async function getQuestionsSets(
    companyId: number,
    setId: number
): Promise<QuestionSet[]> {
    console.log(
        `Attempting to fetch questions sets data from: ${apiUrl}/api/v1/screening/company/${companyId}/sets/${setId}/questions`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/sets/${setId}/questions`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(30000),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching questions sets data:`,
                errorText
            );
            throw new Error(
                `Failed to fetch questions sets data: ${response.status} ${response.statusText}`
            );
        }

        const result = (await response.json()) as QuestionsSetResponse;
        console.log('Questions sets data API response:', result);

        if ('success' in result && !result.success) {
            throw new Error('Failed to fetch questions sets data from API');
        }

        // Handle null data as empty array instead of throwing error
        if (result.data === null || result.data === undefined) {
            console.log(
                'No questions found for this set, returning empty array'
            );
            return [];
        }

        if (!Array.isArray(result.data)) {
            console.error(
                'Invalid data structure received from questions sets data API:',
                result.data
            );
            throw new Error(
                'Invalid data structure received from questions sets data API'
            );
        }

        return result.data;
    } catch (error) {
        console.error('Error fetching questions sets data:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.error(
                'Request timed out while fetching questions sets data.'
            );
            throw new Error('The request for questions sets data timed out.');
        }
        throw error;
    }
}

export interface SetsResponse {
    data: Set[];
    success: boolean;
}

export interface Set {
    business_unit_id: number;
    id: number;
    is_active: boolean;
    name: string;
    general_set: boolean;
}

export async function getSets(companyId: number): Promise<Set[]> {
    console.log(
        `Attempting to fetch sets data from: ${apiUrl}/api/v1/screening/company/${companyId}/sets`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/sets`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(30000),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching sets data:`,
                errorText
            );
            throw new Error(
                `Failed to fetch sets data: ${response.status} ${response.statusText}`
            );
        }

        const result = (await response.json()) as SetsResponse;
        console.log('Sets data API response:', result);

        if ('success' in result && !result.success) {
            throw new Error('Failed to fetch sets data from API');
        }

        if (!result.data) {
            console.error(
                'Invalid data structure received from sets data API:',
                result.data
            );
            throw new Error(
                'Invalid data structure received from sets data API'
            );
        }

        return result.data;
    } catch (error) {
        console.error('Error fetching sets data:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.error('Request timed out while fetching sets data.');
            throw new Error('The request for sets data timed out.');
        }
        throw error;
    }
}

export interface GeneralSetResponse {
    data: Set | null;
    success: boolean;
}

export async function getGeneralSet(companyId: number): Promise<Set | null> {
    console.log(
        `Attempting to fetch general set data from: ${apiUrl}/api/v1/screening/company/${companyId}/sets/general_set`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/sets/general_set`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(30000),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching general set data:`,
                errorText
            );
            throw new Error(
                `Failed to fetch general set data: ${response.status} ${response.statusText}`
            );
        }

        const result = (await response.json()) as GeneralSetResponse;
        console.log('General set data API response:', result);

        if ('success' in result && !result.success) {
            throw new Error('Failed to fetch general set data from API');
        }

        // Return null if no general set exists, otherwise return the set data
        return result.data;
    } catch (error) {
        console.error('Error fetching general set data:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.error('Request timed out while fetching general set data.');
            throw new Error('The request for general set data timed out.');
        }
        throw error;
    }
}

export async function postQuestionSets(
    companyId: number,
    setId: number,
    payload: Omit<QuestionSet, 'id' | 'is_blocked'>
): Promise<QuestionSet> {
    console.log(
        `Attempting to post question sets data for company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}/sets/${setId}/questions`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/sets/${setId}/questions`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(30000),
            }
        );

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(
            `Error during post request to ${apiUrl}/api/v1/screening/company/${companyId}/sets/${setId}/questions:`,
            error
        );
        throw error;
    }
}

export async function putQuestionSets(
    companyId: number,
    setId: number,
    payload: QuestionSet[]
): Promise<ApiResponse> {
    console.log(
        `Attempting to put question sets data for company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}/sets/${setId}/questions`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/sets/${setId}/questions`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(30000),
            }
        );

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(
            `Error during put request to ${apiUrl}/api/v1/screening/company/${companyId}/sets/${setId}/questions:`,
            error
        );
        throw error;
    }
}

export async function deleteQuestionSets(
    companyId: number,
    setId: number,
    questionId: number
): Promise<ApiResponse> {
    console.log(
        `Attempting to delete question sets data for company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}/sets/${setId}/questions/${questionId}`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/sets/${setId}/questions/${questionId}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                // body: JSON.stringify(payload),
                signal: AbortSignal.timeout(30000),
            }
        );

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(
            `Error during delete request to ${apiUrl}/api/v1/screening/company/${companyId}/sets/${setId}/questions/${questionId}:`,
            error
        );
        throw error;
    }
}

export interface CandidatesResponse {
    data: Candidate[];
    success: boolean;
}

export interface Candidate {
    id: number;
    name: string;
    role: string;
    phone: string;
    screening_date: string;
    interview_date: string | null;
    recommendation:
        | 'TBD'
        | 'No Recomendado'
        | 'Recomendado'
        | 'Muy Recomendado'
        | 'Rechazado';
    score: string;
    funnel_state: string;
    previous_funnel_state?: string;
    travel_time_minutes?: number;
    created_at: string;
    media_urls: CandidateMedia[];
    rejected_reason?: string;
    rescheduled?: boolean;
    worked_here?: boolean;
}

export async function getCandidatesData(
    companyId: number
): Promise<Candidate[]> {
    assertValidCompanyId(companyId);
    console.log(
        `Attempting to fetch candidates data from: ${apiUrl}/api/v1/screening/company/${companyId}/candidates`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/candidates`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(30000),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching candidates data:`,
                errorText
            );
            throw new Error(
                `Failed to fetch candidates data: ${response.status} ${response.statusText}`
            );
        }

        const result = (await response.json()) as CandidatesResponse;
        console.log('Candidates data API response:', result);

        if ('success' in result && !result.success) {
            throw new Error('Failed to fetch candidates data from API');
        }

        if (!result.data) {
            console.error(
                'Invalid data structure received from candidates data API:',
                result.data
            );
            throw new Error(
                'Invalid data structure received from candidates data API'
            );
        }

        return result.data;
    } catch (error) {
        console.error('Error fetching candidates data:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.error('Request timed out while fetching candidates data.');
            throw new Error('The request for candidates data timed out.');
        }
        throw error;
    }
}

interface CandidatesAnswersResponse {
    success: boolean;
    data: CandidateAnswer[];
}
export interface CandidateAnswer {
    answer_id: number;
    answer_json: AnswerJSON | null;
    answer_raw: string;
    candidate_id: null;
    created_at: string;
    question: string;
    question_id: number;
}

export interface AnswerJSON {
    calculated_at?: string;
    candidate_id?: number;
    company_coordinates?: Coordinates;
    business_unit_id?: number;
    continue?: boolean;
    distance_meters?: number;
    distance_text?: string;
    duration_seconds?: number;
    duration_text?: string;
    employee_coordinates?: Coordinates;
    overall_recomendation?: string;
    primary_travel_mode?: string;
    recommendation_score?: number;
    relationship_to_candidate?: string;
    summary?: string;
    travel_mode?: string;
}

export interface Coordinates {
    latitude: number;
    longitude: number;
}

// /screening/company/1/candidates/150/answers

export async function getCandidatesAnswers(
    companyId: number,
    candidateId: number
): Promise<CandidateAnswer[]> {
    console.log(
        `Attempting to fetch candidates answers data from: ${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}/answers`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}/answers`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(30000),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching candidates answers data:`,
                errorText
            );
            throw new Error(
                `Failed to fetch candidates answers data: ${response.status} ${response.statusText}`
            );
        }

        const result = (await response.json()) as CandidatesAnswersResponse;
        console.log('Candidates data API response:', result);

        if ('success' in result && !result.success) {
            throw new Error('Failed to fetch candidates answers data from API');
        }

        if (!result.data) {
            console.error(
                'Invalid data structure received from candidates answers data API:',
                result.data
            );
            throw new Error(
                'Invalid data structure received from candidates answers data API'
            );
        }

        return result.data;
    } catch (error) {
        console.error('Error fetching candidates answers data:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.error(
                'Request timed out while fetching candidates answers data.'
            );
            throw new Error(
                'The request for candidates answers data timed out.'
            );
        }
        throw error;
    }
}

export interface PostRoleResponse {
    success: boolean;
    data: {
        role_id: number;
    };
}

export async function postRole(
    companyId: number,
    roleName: string
): Promise<PostRoleResponse> {
    console.log(
        `Attempting to post role ${roleName} for company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}/roles`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/roles`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role_name: roleName }),
                signal: AbortSignal.timeout(30000),
            }
        );

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(
            `Error during post request to ${apiUrl}/api/v1/screening/company/${companyId}/roles:`,
            error
        );
        throw error;
    }
}

export async function DeleteRole(companyId: number, roleId: number) {
    console.log(
        `Attempting to delete role with ID ${roleId} via ${apiUrl}/api/v1/screening/company/${companyId}/roles/${roleId}`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/roles/${roleId}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(30000),
            }
        );

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(
            `Error during delete request to ${apiUrl}/api/v1/screening/company/${companyId}/roles/${roleId}:`,
            error
        );
        throw error;
    }
}

export async function deleteCandidate(
    companyId: number,
    candidateId: number
): Promise<ApiResponse> {
    console.log(
        `Attempting to delete candidate with ID ${candidateId} (frontend candidate.id) for company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(30000),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) deleting candidate ${candidateId}:`,
                errorText
            );

            // Parse the error response to get more details
            try {
                const errorResponse = JSON.parse(errorText);
                console.error('Parsed error response:', errorResponse);
                throw new Error(
                    `Failed to delete candidate: ${errorResponse.error || response.statusText}`
                );
            } catch (parseError) {
                throw new Error(
                    `Failed to delete candidate: ${response.status} ${response.statusText}`
                );
            }
        }

        const result = await response.json();
        console.log('Delete candidate API response:', result);

        if ('success' in result && !result.success) {
            throw new Error(
                result.error || 'Failed to delete candidate from API'
            );
        }

        return result;
    } catch (error) {
        console.error(
            `Error during delete request to ${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}:`,
            error
        );
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.error('Request timed out while deleting candidate.');
            throw new Error('The request to delete candidate timed out.');
        }
        throw error;
    }
}

export interface CompanyDataEditPayload {
    name?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    interview_excluded_dates?: string[];
    interview_days?: string[];
    interview_addresses?: string[];
    interview_hours?: string[];
    benefits?: string[];
    website?: string;
    description?: string;
}

export async function editCompany(
    companyId: number,
    payload: CompanyDataEditPayload
): Promise<ApiResponse> {
    console.log(
        `Attempting to edit company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(30000),
            }
        );

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(
            `Error during edit request to ${apiUrl}/api/v1/screening/company/${companyId}:`,
            error
        );
        return {
            success: false,
            error: 'An error occurred during the request.',
        };
    }
}

export interface CandidateMedia {
    media_id: number;
    s3_url: string;
    file_name: string;
    mime_type: string;
    file_size: number;
    upload_timestamp: string | null; // ISO string format
    question_id: number;
}

export type FunnelStates =
    | 'rejected'
    | 'scheduled_interview'
    | 'screening_in_progress'
    | 'hired'
    | 'missed_interview'
    | 'cancelled'
    | 'onboarding'
    | 'expired';

export type RejectPhase = 'pre_screening' | 'post_screening';

export type RejectReason =
    | 'screening'
    | 'physical_condition'
    | 'personal_presentation'
    | 'missing_documents'
    | 'antidoping_evidence'
    | 'experience'
    | 'abscense'
    | 'abscense_first_day'
    | 'declined_technical_area'
    | 'distance_home_work'
    | 'declined_salary'
    | 'other';

export async function changeFunnelState(
    companyId: number,
    candidateId: number,
    newState: FunnelStates,
    reason?: RejectReason,
    startDate?: string
): Promise<ApiResponse> {
    console.log(
        `Attempting to change funnel state for candidate ${candidateId} in company ${companyId} to ${newState} via ${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}/funnel_state`
    );
    try {
        const body: {
            funnel_state: FunnelStates;
            reason?: RejectReason;
            start_date?: string;
        } = { funnel_state: newState };

        if (reason) {
            body.reason = reason;
        }

        if (startDate) {
            body.start_date = startDate;
        }

        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}/funnel_state`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(30000),
            }
        );

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(
            `Error during change funnel state request to ${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}/funnel_state:`,
            error
        );
        return {
            success: false,
            error: 'An error occurred during the request.',
        };
    }
}

export async function cancelInterview(
    companyId: number,
    candidateId: number
): Promise<ApiResponse> {
    console.log(
        `Attempting to cancel interview for candidate ${candidateId} in company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}/cancel_interview`
    );
    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}/cancel_interview`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(30000),
            }
        );

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(
            `Error during cancel interview request to ${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}/cancel_interview:`,
            error
        );
        return {
            success: false,
            error: 'An error occurred during the request.',
        };
    }
}

//company_faqs
export async function cloneRole(
    companyId: number,
    roleId: number
): Promise<ApiResponse> {
    console.log(
        `Attempting to clone role ${roleId} for company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}/roles/${roleId}/clone`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/roles/${roleId}/clone`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(30000),
            }
        );

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(
            `Error during clone request to ${apiUrl}/api/v1/screening/company/${companyId}/roles/${roleId}/clone:`,
            error
        );
        throw error;
    }
}

export async function ChangeRole(
    companyId: number,
    roleId: number,
    data: {
        name?: string;
        eligibility_criteria?: Record<string | number, string>;
        active?: boolean;
    }
): Promise<ApiResponse> {
    try {
        console.log(
            `Attempting to change role ${roleId} in company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}/roles/${roleId}`
        );

        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/roles/${roleId}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(30000),
            }
        );

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(
            `Error during change role name request to ${apiUrl}/api/v1/screening/company/${companyId}/roles/${roleId}:`,
            error
        );
        return {
            success: false,
            error: 'An error occurred during the request.',
        };
    }
}

export interface CandidatesStatsData {
    completed_interviews: number;
    conversion_rate: string;
    hired: number;
    hiring_rate: string;
    interview_cited: number;
    rejected_total: number;
    rejected_pre_screening: number;
    rejected_post_screening: number;
    screening_in_progress: number;
    today_new_candidates: number;
    total_evaluated: number;
    upcoming_interviews: number;
    missed_interviews: number;
    entrevistados: number;
    phone_interview_cited: number;
    phone_interview: number;
    phone_interview_demo: number;
    phone_interview_passed: number;
    phone_interview_failed: number;
    phone_interviews_completed: number;
    ingresados: number;
}

// /screening/company/<int:business_unit_id>/candidates/new
export async function getCandidatesStats(
    companyId: number,
    dateRange?: { startDate?: string; endDate?: string }
): Promise<CandidatesStatsData> {
    assertValidCompanyId(companyId);
    
    const params = new URLSearchParams();
    if (dateRange?.startDate) {
        params.append('start_date', dateRange.startDate);
    }
    if (dateRange?.endDate) {
        params.append('end_date', dateRange.endDate);
    }
    
    const url = `${apiUrl}/api/v1/screening/company/${companyId}/candidates/statistics${params.toString() ? `?${params.toString()}` : ''}`;
    console.log(`Attempting to fetch new candidate data from: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching new candidate data:`,
                errorText
            );
            throw new Error(
                `Failed to fetch new candidate data: ${response.status} ${response.statusText}`
            );
        }

        const result = (await response.json()) as {
            success: boolean;
            data: CandidatesStatsData;
        };

        if (!result.success || !result.data) {
            throw new Error('Invalid response from new candidate data API');
        }

        if (Object.keys(result.data).length === 0) {
            console.error('Invalid response from new candidate data API');
            throw new Error('Invalid response from new candidate data API');
        }

        return result.data;
    } catch (error) {
        console.error('Error fetching new candidate data:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.error(
                'Request timed out while fetching new candidate data.'
            );
            throw new Error('The request for new candidate data timed out.');
        }
        throw error;
    }
}

export interface CandidatesPaginationFilters {
    search?: string;
    role?: string;
    funnel_state?: FunnelStates;
    interview_date?: 'upcoming' | 'completed';
    score?: string | { min?: number; max?: number };
    interview_address?: string;
    interview_date_exact?: string;
    reject_phase?: 'pre_screening' | 'post_screening';
    rejected_reason?: string;
    only_hired_onboarding_expired?: boolean;
    start_date?: string;
    end_date?: string;
}

export interface CandidatesPaginationRequest {
    page?: number;
    per_page?: number;
    filters?: CandidatesPaginationFilters;
}

export interface CandidatesPaginationResponse {
    success: boolean;
    data: {
        candidates: Candidate[];
        pagination: {
            current_page: number;
            per_page: number;
            total_count: number;
            total_pages: number;
        };
    };
    error?: string;
    details?: string;
}

export async function getCandidatesPagination(
    companyId: number,
    options: CandidatesPaginationRequest = {}
): Promise<CandidatesPaginationResponse['data']> {
    const { page = 1, per_page = 10, filters = {} } = options;
    const params = new URLSearchParams();

    params.append('page', page.toString());
    params.append('per_page', per_page.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    if (filters.funnel_state)
        params.append('funnel_state', filters.funnel_state);
    if (filters.interview_date)
        params.append('interview_date', filters.interview_date);

    if (filters.interview_address)
        params.append('interview_address', filters.interview_address);

    if (filters.interview_date_exact)
        params.append('interview_date_exact', filters.interview_date_exact);

    if (filters.score) {
        if (typeof filters.score === 'string') {
            params.append('score', filters.score);
        } else {
            const max = filters.score.max || 100;
            const min = filters.score.min || 0;
            params.append('score', `${min}-${max}`);
        }
    }

    if (filters.reject_phase)
        params.append('reject_phase', filters.reject_phase);

    if (filters.only_hired_onboarding_expired)
        params.append('only_hired_onboarding_expired', 'true');

    if (filters.start_date)
        params.append('start_date', filters.start_date);

    if (filters.end_date)
        params.append('end_date', filters.end_date);

    const url = `${apiUrl}/api/v1/screening/company/${companyId}/candidates/pagination?${params.toString()}`;

    console.log(`Fetching candidates with pagination: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(30000),
        });

        const result = (await response.json()) as CandidatesPaginationResponse;
        return result.data;
    } catch (error) {
        console.error('Error fetching candidates with pagination:', error);
        throw error;
    }
}

type CandidatesAddresses = {
    [name: string]: number;
};

type CandidatesAddressesResponse = {
    success: boolean;
    data: CandidatesAddresses;
};

export async function getInterviewAddresses(
    companyId: number,
    date?: string
): Promise<CandidatesAddresses> {
    const params = new URLSearchParams();

    if (date) {
        params.append('interview_date', date);
    }

    console.log(
        `Attempting to fetch interview addresses for company ${companyId} via ${apiUrl}/api/v1/screening/company/${companyId}/candidates/interview_addresses with params: ${params.toString()}`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/screening/company/${companyId}/candidates/interview_addresses?${params.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(30000),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching interview addresses for company ${companyId}:`,
                errorText
            );
            throw new Error(
                `Failed to fetch interview addresses for company ${companyId}: ${response.status} ${response.statusText}`
            );
        }

        const result = (await response.json()) as CandidatesAddressesResponse;
        console.log('Interview addresses API response:', result);

        if ('success' in result && !result.success) {
            throw new Error('Failed to fetch interview addresses from API');
        }

        if (!result.data) {
            console.error(
                'Invalid data structure received from interview addresses API:',
                result.data
            );
            throw new Error(
                'Invalid data structure received from interview addresses API'
            );
        }

        return result.data;
    } catch (error) {
        console.error('Error fetching interview addresses:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.error(
                'Request timed out while fetching interview addresses.'
            );
            throw new Error('The request for interview addresses timed out.');
        }
        throw error;
    }
}

export interface MessageTemplateResponse {
    data: MessageTemplate[];
    success: boolean;
}

export interface MessageTemplate {
    button_keys: Array<string[]> | null;
    button_trigger: null;
    display_name: null;
    document_link: null;
    filename: null;
    flow_action_data: null;
    flow_cta: null | string;
    flow_keys: null;
    flow_name: null | string;
    footer_text: null | string;
    header_base: null;
    header_content: null | string;
    header_type: null | string;
    id: number;
    interactive_type: null | string;
    keyword: string;
    list_options: null;
    list_section_title: null | string;
    parameters: Parameters | null;
    template: null | string;
    text: string;
    type: string;
    url_keys: null;
    variables: Variables | null;
}

export interface Parameters {
    '{company_name}': string;
}

export interface Variables {
    '{company_name}'?: string;
    '{interview_address}'?: string;
    '{interview_date}'?: string;
    '{name}'?: string;
    '{role}'?: string;
}

export async function getMessageTemplates(
    companyId: number
): Promise<MessageTemplate[]> {
    console.log(
        `Attempting to fetch message templates from: ${apiUrl}/api/v1/message_templates/company/${companyId}`
    );

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/message_templates/company/${companyId}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(30000),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API error (${response.status}) fetching message templates:`,
                errorText
            );
            throw new Error(
                `Failed to fetch message templates: ${response.status} ${response.statusText}`
            );
        }

        const result = (await response.json()) as MessageTemplateResponse;
        console.log('Message templates API response:', result);

        if ('success' in result && !result.success) {
            throw new Error('Failed to fetch message templates from API');
        }

        if (!result.data) {
            console.error(
                'Invalid data structure received from message templates API:',
                result.data
            );
            throw new Error(
                'Invalid data structure received from message templates API'
            );
        }

        return result.data;
    } catch (error) {
        console.error('Error fetching message templates:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.error(
                'Request timed out while fetching message templates.'
            );
            throw new Error('The request for message templates timed out.');
        }
        throw error;
    }
}

// ==================== PHONE INTERVIEWS ====================

export interface PhoneInterviewResponse {
    data: PhoneInterviewData;
    success: boolean;
}

export interface PhoneInterviewsResponse {
    data: {
        candidates: PhoneInterviewCandidate[];
        pagination: {
            current_page: number;
            per_page: number;
            total_count: number;
            total_pages: number;
            has_next: boolean;
            has_prev: boolean;
        };
        filters: {
            search_query?: string;
            call_status?: string;
        };
    };
    success: boolean;
}

export interface PhoneInterviewStatsResponse {
    data: PhoneInterviewStats;
    success: boolean;
}

export interface PhoneInterviewCandidate {
    id: number;
    name: string;
    role: string;
    phone: string;
    interview_id: number;
    vapi_call_id: string;
    call_status: 'completed' | 'failed' | 'scheduled' | 'missed';
    call_status_display: string;
    call_duration: number;
    duration_display: string;
    started_at: string | null;
    ended_at: string | null;
    call_date: string;
    call_time: string;
    ai_score: number | null;
    ai_recommendation: 'recommended' | 'not_recommended' | 'pending_review';
    recommendation_display: string;
    summary: string | null;
    created_at: string;
    media_urls: CandidateMedia[];
    age?: number;
    gender?: string;
    education_level?: string;
    funnel_state?: string;
    rejected_reason?: string | null;
}

export interface PhoneInterviewData extends PhoneInterviewCandidate {
    transcript: string | null;
}

export interface PhoneInterviewStats {
    total_candidates: number;
    completed: number;
    failed: number;
    scheduled: number;
    missed: number;
    avg_score: number | null;
    recommended: number;
    not_recommended: number;
}

export async function getPhoneInterviewCandidates(
    companyId: number,
    page: number = 1,
    perPage: number = 50,
    search?: string,
    status?: string,
    funnelBucket?: string,
    month?: string,
    startDate?: string,
    endDate?: string
): Promise<PhoneInterviewsResponse['data']> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('per_page', perPage.toString());
    if (search) queryParams.append('search', search);
    if (status && status !== 'all') queryParams.append('status', status);
    if (funnelBucket) queryParams.append('funnel_bucket', funnelBucket);
    if (month) queryParams.append('month', month);
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);

    const response = await fetch(
        `${apiUrl}/api/v1/screening/company/${companyId}/phone-interviews?${queryParams}`,
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        throw new Error(
            `Failed to fetch phone interview candidates: ${response.statusText}`
        );
    }

    const result: PhoneInterviewsResponse = await response.json();

    if (!result.success) {
        throw new Error(
            (result.data as any) || 'Failed to fetch phone interview candidates'
        );
    }

    return result.data;
}

export async function getCandidatePhoneInterview(
    companyId: number,
    candidateId: number
): Promise<PhoneInterviewData> {
    const response = await fetch(
        `${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}/phone-interview`,
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        throw new Error(
            `Failed to fetch candidate phone interview: ${response.statusText}`
        );
    }

    const result: PhoneInterviewResponse = await response.json();

    if (!result.success) {
        throw new Error(
            (result.data as any) || 'Failed to fetch candidate phone interview'
        );
    }

    return result.data;
}

export async function getPhoneInterviewStats(
    companyId: number
): Promise<PhoneInterviewStats> {
    const response = await fetch(
        `${apiUrl}/api/v1/screening/company/${companyId}/phone-interviews/stats`,
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        throw new Error(
            `Failed to fetch phone interview stats: ${response.statusText}`
        );
    }

    const result: PhoneInterviewStatsResponse = await response.json();

    if (!result.success) {
        throw new Error(
            (result.data as any) || 'Failed to fetch phone interview stats'
        );
    }

    return result.data;
}

// ==================== PHONE INTERVIEW QUESTIONS ====================

export interface PhoneInterviewQuestion {
    id: number;
    position: number;
    question: string;
    role_id: number | null;
}

export async function getPhoneInterviewQuestions(
    companyId: number,
    roleId?: number
): Promise<PhoneInterviewQuestion[]> {
    const params = new URLSearchParams();
    if (roleId) params.append('role_id', String(roleId));

    const response = await fetch(
        `${apiUrl}/api/v1/screening/company/${companyId}/phone-interview-questions?${params.toString()}`,
        {
            headers: { 'Content-Type': 'application/json' },
        }
    );
    if (!response.ok) {
        throw new Error(
            `Failed to fetch phone interview questions: ${response.statusText}`
        );
    }
    const result = await response.json();
    return result.data || [];
}

export async function putPhoneInterviewQuestions(
    companyId: number,
    questions: Array<{ position: number; question: string }>,
    roleId?: number
): Promise<ApiResponse> {
    const response = await fetch(
        `${apiUrl}/api/v1/screening/company/${companyId}/phone-interview-questions`,
        {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role_id: roleId, questions }),
        }
    );
    return response.json();
}

export async function startPhoneInterview(
    companyId: number,
    candidateId: number,
    roleId?: number
): Promise<{ vapi_call_id: string }> {
    const response = await fetch(
        `${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}/phone-interview/start`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role_id: roleId }),
        }
    );
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to start phone interview: ${text}`);
    }
    const result = await response.json();
    return result.data;
}

// ==================== EXPORT INTERVIEW CANDIDATES CSV ====================

export async function downloadInterviewCandidatesCSV(
    companyId: number,
    startDate?: string,
    endDate?: string,
    fileName?: string
): Promise<void> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const url = `${apiUrl}/api/v1/screening/company/${companyId}/candidates/export${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Accept: 'text/csv',
        },
        signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(
            `Error al descargar CSV: ${response.status} ${response.statusText} - ${text}`
        );
    }
    // Read as text to prepend BOM for proper Excel UTF-8 accent handling
    const csvText = await response.text();
    const BOM = '\uFEFF';
    const blob = new Blob([BOM, csvText], { type: 'text/csv;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    const defaultName =
        fileName ||
        `candidatos_entrevistas_${companyId}${startDate || endDate ? `_${startDate || ''}_${endDate || ''}` : ''}.csv`;
    a.download = defaultName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(downloadUrl);
}

// ==================== DOCUMENT VERIFICATION ====================

export interface DocumentVerification {
    media_id: number;
    media_subtype: 'RFC' | 'INE' | 'CURP' | 'NSS';
    verified: boolean;
    upload_timestamp: string | null;
    verification_result: any;
    s3_url: string | null;
    file_name: string | null;
    string_submission: string | null;
    media_type: string;
    status: 'verified' | 'pending' | 'rejected';
    status_message: string;
}

export interface DocumentVerificationData {
    candidate_id: number;
    group_id: number;
    documents: {
        RFC: DocumentVerification | null;
        INE: DocumentVerification[];
        CURP: DocumentVerification | null;
        NSS: DocumentVerification | null;
    };
    overall_status: {
        status: 'verified' | 'pending' | 'rejected';
        message: string;
        verified_count: number;
        pending_count: number;
        rejected_count: number;
        total_required: number;
    };
}
//
// export interface DocumentVerificationResponse {
//   data: DocumentVerificationData;
//   success: boolean;
// }
//
// export async function getCandidateDocumentVerification(
//   companyId: number,
//   candidateId: number
// ): Promise<DocumentVerificationData> {
//   const response = await fetch(
//     `${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}/document-verification`,
//     {
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     }
//   );
//
//   if (!response.ok) {
//     if (response.status === 404) {
//       throw new Error('Document verification not available for this candidate or company');
//     }
//     throw new Error(`Failed to fetch candidate document verification: ${response.statusText}`);
//   }
//
//   const result: DocumentVerificationResponse = await response.json();
//
//   if (!result.success) {
//     throw new Error(result.data as any || 'Failed to fetch candidate document verification');
//   }
//
//   return result.data;
// }

// ... existing code ...

export interface DocumentVerificationResponse {
    data: DocumentVerificationData;
    success: boolean;
}

export async function getCandidateDocumentVerification(
    companyId: number,
    candidateId: number
): Promise<DocumentVerificationData> {
    const response = await fetch(
        `${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}/document-verification`,
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(
                'Document verification not available for this candidate or company'
            );
        }
        throw new Error(
            `Failed to fetch candidate document verification: ${response.statusText}`
        );
    }

    const result: DocumentVerificationResponse = await response.json();

    if (!result.success) {
        throw new Error(
            (result.data as any) ||
                'Failed to fetch candidate document verification'
        );
    }

    return result.data;
}

// ... existing code ...

// ==================== UPLOAD & VERIFY DOCUMENTS ====================

export interface UploadMediaResponse {
    success: boolean;
    data: {
        processed_count: number;
        failed_count: number;
        media_ids: number[];
        errors: Array<{ file_name?: string; message: string }>;
    };
}

export async function uploadCandidateMedia(
    companyId: number,
    candidateId: number,
    files: File[],
    mediaType: 'image' | 'document' = 'image',
    flowToken?: Record<string, any> | string,
    logicalMediaType?: 'INE' | 'RFC' | 'CURP' | 'NSS' | string
): Promise<UploadMediaResponse> {
    const form = new FormData();
    for (const f of files) form.append('files', f);
    form.append('media_type', mediaType);
    if (flowToken) {
        form.append(
            'flow_token',
            typeof flowToken === 'string'
                ? flowToken
                : JSON.stringify(flowToken)
        );
    }
    if (logicalMediaType) {
        form.append('logical_media_type', logicalMediaType);
    }

    const res = await fetch(
        `${apiUrl}/api/v1/screening/company/${companyId}/candidates/${candidateId}/media/upload`,
        {
            method: 'POST',
            body: form,
        }
    );

    if (!res.ok && res.status !== 207) {
        const text = await res.text();
        throw new Error(
            `Error al subir archivos: ${res.status} ${res.statusText} - ${text}`
        );
    }

    return res.json();
}

export interface VerifyDocumentResponse {
    success: boolean;
    data: {
        candidate_id: number;
        verification_type: 'INE' | 'RFC' | 'CURP';
        verified: boolean;
        validation_message: string;
        media_ids?: number[];
        verification_result?: any;
        nss_status?: 'initiated' | 'pending' | 'completed' | 'failed';
    };
}

export async function verifyDocumentINE(
    candidateId: number,
    mediaIds: number[]
): Promise<VerifyDocumentResponse> {
    const res = await fetch(`${apiUrl}/api/v1/screening/verify-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            candidate_id: candidateId,
            media_ids: mediaIds,
            verification_type: 'INE',
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(
            `Error al validar INE: ${res.status} ${res.statusText} - ${text}`
        );
    }
    return res.json();
}

export async function verifyDocumentRFC(
    candidateId: number,
    rfc: string
): Promise<VerifyDocumentResponse> {
    const res = await fetch(
        `${apiUrl}/api/v1/screening/document-verification`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                candidate_id: candidateId,
                verification_type: 'RFC',
                string_submission: rfc.trim().toUpperCase(),
            }),
        }
    );
    if (!res.ok) {
        const text = await res.text();
        throw new Error(
            `Error al validar RFC: ${res.status} ${res.statusText} - ${text}`
        );
    }
    return res.json();
}

export async function verifyDocumentCURP(
    candidateId: number,
    curp: string
): Promise<VerifyDocumentResponse> {
    const res = await fetch(
        `${apiUrl}/api/v1/screening/document-verification`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                candidate_id: candidateId,
                verification_type: 'CURP',
                string_submission: curp.trim().toUpperCase(),
            }),
        }
    );
    if (!res.ok) {
        const text = await res.text();
        throw new Error(
            `Error al validar CURP: ${res.status} ${res.statusText} - ${text}`
        );
    }
    return res.json();
}

// ==================== EXTERNAL NOTIFICATIONS (LOCAL SERVICE) ====================

export async function notifyIneExternal(
    candidateId: number,
    frontMediaId: number,
    backMediaId: number
): Promise<any> {
    const res = await fetch(`${apiUrl}/api/v1/document-verification/ine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            candidate_id: candidateId,
            front_media_id: frontMediaId,
            back_media_id: backMediaId,
        }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
            `Error en notificación externa de INE: ${res.status} ${res.statusText} - ${text}`
        );
    }
    // Try to parse JSON if available; otherwise return raw text
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        try {
            return await res.json();
        } catch (_) {
            return null as any;
        }
    }
    const raw = await res.text().catch(() => '');
    try {
        return JSON.parse(raw);
    } catch (_) {
        return { raw } as any;
    }
}

export async function notifyCurpExternal(
    candidateId: number,
    curp: string
): Promise<void> {
    const res = await fetch(`${apiUrl}/api/v1/document-verification/curp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            candidate_id: candidateId,
            curp: curp.trim().toUpperCase(),
        }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
            `Error en notificación externa de CURP: ${res.status} ${res.statusText} - ${text}`
        );
    }
}
