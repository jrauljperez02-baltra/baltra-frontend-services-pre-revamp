// lib/admin-api.ts
'use client';

import { fetchAuthSession } from 'aws-amplify/auth';
import { BACKEND_BASE_URL } from '@/config/env';

const base = BACKEND_BASE_URL.replace(/\/$/, '');
const API_V1 = `${base}/api/v1`;

async function authHeaders() {
    try {
        const session = await fetchAuthSession();
        const token = session?.tokens?.idToken?.toString();
        return token
            ? {
                  Authorization: `Bearer ${token}`,
              }
            : {};
    } catch {
        return {};
    }
}

async function getJson<T>(
    path: string,
    params?: Record<string, string | number | undefined>
): Promise<T> {
    const url = new URL(`${API_V1}${path}`);
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && `${v}` !== '')
                url.searchParams.set(k, String(v));
        });
    }
    const headers = {
        'Content-Type': 'application/json',
        ...(await authHeaders()),
    } as Record<string, string>;
    const res = await fetch(url.toString(), {
        headers,
        method: 'GET',
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(
            `GET ${url.pathname} failed: ${res.status} ${res.statusText} ${txt}`
        );
    }
    return (await res.json()) as T;
}

async function patchJson<T>(path: string, body: unknown): Promise<T> {
    const url = `${API_V1}${path}`;
    const headers = {
        'Content-Type': 'application/json',
        ...(await authHeaders()),
    } as Record<string, string>;
    const res = await fetch(url, {
        headers,
        method: 'PATCH',
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(
            `PATCH ${url} failed: ${res.status} ${res.statusText} ${txt}`
        );
    }
    return (await res.json()) as T;
}

async function putJson<T>(path: string, body: unknown): Promise<T> {
    const url = `${API_V1}${path}`;
    const headers = {
        'Content-Type': 'application/json',
        ...(await authHeaders()),
    } as Record<string, string>;
    const res = await fetch(url, {
        headers,
        method: 'PUT',
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(
            `PUT ${url} failed: ${res.status} ${res.statusText} ${txt}`
        );
    }
    return (await res.json()) as T;
}

// Types
type ApiEnvelope<T> = { success: boolean; data: T; meta?: any };

export type FunnelPoint = { state: string; count: number; percent?: number };
export type FunnelResponse = { data: FunnelPoint[]; meta?: any };
export async function fetchFunnel(
    companyId: number,
    opts?: {
        start_date: string;
        end_date: string;
        company_ids: (number | string)[];
    }
) {
    const p: Record<string, string> = {};
    if (opts.month) p.month = opts.month;
    if (opts.start_date) p.start_date = opts.start_date;
    if (opts.end_date) p.end_date = opts.end_date;
    if (opts.scope) p.scope = opts.scope;
    // Backend expects 'business_unit_ids' not 'company_ids'
    if (opts.company_ids)
        p.business_unit_ids = Array.isArray(opts.company_ids)
            ? opts.company_ids.join(',')
            : String(opts.company_ids);
    const res = await getJson<ApiEnvelope<FunnelPoint[]>>(
        `/admin/company/${companyId}/dashboard/funnel`,
        p
    );
    return { data: res.data, meta: (res as any).meta } as FunnelResponse;
}

export async function fetchCandidateStatusSummary(
  companyId: number,
  opts: {
    month?: string;
    start_date?: string;
    end_date?: string;
    scope?: 'all' | 'own';
    company_ids?: string | number[];
  } = {}
) {
  const p: Record<string, string> = {};
  if (opts.month) p.month = opts.month;
  if (opts.start_date) p.start_date = opts.start_date;
  if (opts.end_date) p.end_date = opts.end_date;
  if (opts.scope) p.scope = opts.scope;
  // Backend expects 'business_unit_ids' not 'company_ids'
  if (opts.company_ids)
    p.business_unit_ids = Array.isArray(opts.company_ids)
      ? opts.company_ids.join(',')
      : String(opts.company_ids);

  const res = await getJson<ApiEnvelope<any[]>>(
    `/admin/company/${companyId}/dashboard/candidate_status_summary`,
    p
  );
  return res; // { success, data, meta? }
}



export type OriginEvaluated = {
    source: string;
    evaluated: number;
    percentage?: number;
};
export async function fetchOriginsEvaluated(
    companyId: number,
    opts: {
        month?: string;
        start_date?: string;
        end_date?: string;
        scope?: 'all' | 'own';
        company_ids?: string | number[];
    } = {}
) {
    const p: Record<string, string> = {};
    if (opts.month) p.month = opts.month;
    if (opts.start_date) p.start_date = opts.start_date;
    if (opts.end_date) p.end_date = opts.end_date;
    if (opts.scope) p.scope = opts.scope;
    // Backend expects 'business_unit_ids' not 'company_ids'
    if (opts.company_ids)
        p.business_unit_ids = Array.isArray(opts.company_ids)
            ? opts.company_ids.join(',')
            : String(opts.company_ids);
    const res = await getJson<ApiEnvelope<OriginEvaluated[]>>(
        `/admin/company/${companyId}/dashboard/origins-evaluated`,
        p
    );
    return res.data;
}

export async function fetchTimeToHire(
    companyId: number,
    opts: {
        month?: string;
        start_date?: string;
        end_date?: string;
        scope?: 'all' | 'own';
        company_ids?: string | number[];
    } = {}
) {
    const p: Record<string, string> = {};
    if (opts.month) p.month = opts.month;
    if (opts.start_date) p.start_date = opts.start_date;
    if (opts.end_date) p.end_date = opts.end_date;
    if (opts.scope) p.scope = opts.scope;
    // Backend expects 'business_unit_ids' not 'company_ids'
    if (opts.company_ids)
        p.business_unit_ids = Array.isArray(opts.company_ids)
            ? opts.company_ids.join(',')
            : String(opts.company_ids);
    const res = await getJson<
        ApiEnvelope<{
            samples: number;
            avg_hours: number;
            median_hours: number;
        }>
    >(`/admin/company/${companyId}/dashboard/time-to-hire`, p);
    return res.data;
}

export async function fetchHiresByRole(
    companyId: number,
    opts: {
        month?: string;
        start_date?: string;
        end_date?: string;
        scope?: 'all' | 'own';
        company_ids?: string | number[];
    } = {}
) {
    const p: Record<string, string> = {};
    if (opts.month) p.month = opts.month;
    if (opts.start_date) p.start_date = opts.start_date;
    if (opts.end_date) p.end_date = opts.end_date;
    if (opts.scope) p.scope = opts.scope;
    // Backend expects 'business_unit_ids' not 'company_ids'
    if (opts.company_ids)
        p.business_unit_ids = Array.isArray(opts.company_ids)
            ? opts.company_ids.join(',')
            : String(opts.company_ids);
    const res = await getJson<
        ApiEnvelope<{ role_name: string; count: number }[]>
    >(`/admin/company/${companyId}/dashboard/hires-by-role`, p);
    return res.data;
}

export async function fetchScreeningQuestions(
    companyId: number,
    opts: {
        month?: string;
        start_date?: string;
        end_date?: string;
        scope?: 'all' | 'own';
        company_ids?: string | number[];
    } = {}
) {
    const p: Record<string, string> = {};
    if (opts.month) p.month = opts.month;
    if (opts.start_date) p.start_date = opts.start_date;
    if (opts.end_date) p.end_date = opts.end_date;
    if (opts.scope) p.scope = opts.scope;
    // Backend expects 'business_unit_ids' not 'company_ids'
    if (opts.company_ids)
        p.business_unit_ids = Array.isArray(opts.company_ids)
            ? opts.company_ids.join(',')
            : String(opts.company_ids);

    // The response can be { data: ScreeningQuestion[] } or { data: { items: ScreeningQuestion[] } }
    const res = await getJson<
        ApiEnvelope<ScreeningQuestion[] | { items: ScreeningQuestion[] }>
    >(`/admin/company/${companyId}/dashboard/screening/questions`, p);

    if (Array.isArray(res.data)) {
        return res.data;
    }
    if (res.data && 'items' in res.data) {
        return res.data.items;
    }
    return [];
}

export type ScreeningQuestion = {
    id: number;
    short_title: string;
    full_question: string; // For non-interactive, this is the text. For interactive, it's the keyword.
    response_type: string;
    total_responses: number;
    step_index?: number;
    final_position?: number; // Server-provided final ordering position
    editable?: boolean;
    template_text?: string; // For interactive questions, the text the user sees.
    options?: [string, string][]; // For interactive questions, the options.
};

export async function updateScreeningQuestion(
    questionId: number,
    data: Partial<ScreeningQuestion>
) {
    const res = await putJson<ApiEnvelope<ScreeningQuestion>>(
        `/admin/screening/questions/${questionId}`,
        data
    );
    return res.data;
}

export type RejectionItem = {
    reason: string;
    count: number;
    percentage?: number;
};
export async function fetchRejections(
    companyId: number,
    src: 'chat' | 'manual',
    opts: {
        month?: string;
        start_date?: string;
        end_date?: string;
        scope?: 'all' | 'own';
        company_ids?: string | number[];
    } = {}
) {
    const p: Record<string, string> = { source: src };
    if (opts.month) p.month = opts.month;
    if (opts.start_date) p.start_date = opts.start_date;
    if (opts.end_date) p.end_date = opts.end_date;
    if (opts.scope) p.scope = opts.scope;
    // Backend expects 'business_unit_ids' not 'company_ids'
    if (opts.company_ids)
        p.business_unit_ids = Array.isArray(opts.company_ids)
            ? opts.company_ids.join(',')
            : String(opts.company_ids);
    const res = await getJson<ApiEnvelope<RejectionItem[]>>(
        `/admin/company/${companyId}/dashboard/rejections`,
        p
    );
    return res.data;
}

export type OnboardingSummary = {
    employees_in_onboarding: number;
    change_from_last_week: number;
    checklist1_completion: number;
    checklist1_employees: number;
    checklist2_completion: number;
    checklist2_employees: number;
    average_satisfaction: number;
    satisfaction_change: number;
};
export async function fetchOnboardingSummary(
    companyId: number,
    opts: {
        month?: string;
        start_date?: string;
        end_date?: string;
        scope?: 'all' | 'own';
        company_ids?: string | number[];
    } = {}
) {
    const p: Record<string, string> = {};
    if (opts.month) p.month = opts.month;
    if (opts.start_date) p.start_date = opts.start_date;
    if (opts.end_date) p.end_date = opts.end_date;
    if (opts.scope) p.scope = opts.scope;
    // Backend expects 'business_unit_ids' not 'company_ids'
    if (opts.company_ids)
        p.business_unit_ids = Array.isArray(opts.company_ids)
            ? opts.company_ids.join(',')
            : String(opts.company_ids);
    const res = await getJson<ApiEnvelope<OnboardingSummary>>(
        `/admin/company/${companyId}/dashboard/onboarding/summary`,
        p
    );
    return res.data;
}

export type ChecklistItem = { item: string; completion: number };
export async function fetchOnboardingChecklists(
    companyId: number,
    opts: {
        month?: string;
        start_date?: string;
        end_date?: string;
        scope?: 'all' | 'own';
        company_ids?: string | number[];
    } = {}
) {
    const p: Record<string, string> = {};
    if (opts.month) p.month = opts.month;
    if (opts.start_date) p.start_date = opts.start_date;
    if (opts.end_date) p.end_date = opts.end_date;
    if (opts.scope) p.scope = opts.scope;
    // Backend expects 'business_unit_ids' not 'company_ids'
    if (opts.company_ids)
        p.business_unit_ids = Array.isArray(opts.company_ids)
            ? opts.company_ids.join(',')
            : String(opts.company_ids);
    const res = await getJson<
        ApiEnvelope<
            | { checklist?: number; items: ChecklistItem[] }
            | { checklist: number; items: ChecklistItem[] }[]
        >
    >(`/admin/company/${companyId}/dashboard/onboarding/checklists`, p);
    return res.data;
}

export type DocumentsSummary = {
    total_hired: number;
    waiting: number;
    verified: number;
    rejected: number;
    verification_rate: number;
    failure_rate: number;
};
export async function fetchDocumentsSummary(
    companyId: number,
    opts: {
        month?: string;
        start_date?: string;
        end_date?: string;
        scope?: 'all' | 'own';
        company_ids?: string | number[];
    } = {}
) {
    const p: Record<string, string> = {};
    if (opts.month) p.month = opts.month;
    if (opts.start_date) p.start_date = opts.start_date;
    if (opts.end_date) p.end_date = opts.end_date;
    if (opts.scope) p.scope = opts.scope;
    // Backend expects 'business_unit_ids' not 'company_ids'
    if (opts.company_ids)
        p.business_unit_ids = Array.isArray(opts.company_ids)
            ? opts.company_ids.join(',')
            : String(opts.company_ids);
    const res = await getJson<ApiEnvelope<DocumentsSummary>>(
        `/admin/company/${companyId}/dashboard/documents/summary`,
        p
    );
    return res.data;
}

export type DocumentTypeBreakdown = {
    type: string;
    waiting: number;
    verified: number;
    rejected: number;
    total: number;
};
export async function fetchDocumentsTypes(
    companyId: number,
    opts: {
        month?: string;
        start_date?: string;
        end_date?: string;
        scope?: 'all' | 'own';
        company_ids?: string | number[];
    } = {}
) {
    const p: Record<string, string> = {};
    if (opts.month) p.month = opts.month;
    if (opts.start_date) p.start_date = opts.start_date;
    if (opts.end_date) p.end_date = opts.end_date;
    if (opts.scope) p.scope = opts.scope;
    // Backend expects 'business_unit_ids' not 'company_ids'
    if (opts.company_ids)
        p.business_unit_ids = Array.isArray(opts.company_ids)
            ? opts.company_ids.join(',')
            : String(opts.company_ids);
    const res = await getJson<ApiEnvelope<DocumentTypeBreakdown[]>>(
        `/admin/company/${companyId}/dashboard/documents/types`,
        p
    );
    return res.data;
}

export type StoreItem = {
    id: string | number;
    business_unit_id: string | number;
    name: string;
    location?: string;
    hires?: number;
    active_recruitment?: number;
    conversion_rate?: number;
    is_active?: boolean;
};
export async function fetchStores(
    companyId: number,
    q?: string,
    active?: 'true' | 'false' | 'all',
    opts: {
        month?: string;
        start_date?: string;
        end_date?: string;
        scope?: 'all' | 'own';
        company_ids?: string | number[];
    } = {}
) {
    const p: Record<string, string> = {
        ...(q ? { search: q } : {}),
        ...(active ? { active } : {}),
    };
    if (opts.month) p.month = opts.month;
    if (opts.start_date) p.start_date = opts.start_date;
    if (opts.end_date) p.end_date = opts.end_date;
    if (opts.scope) p.scope = opts.scope;
    // Backend expects 'business_unit_ids' not 'company_ids'
    if (opts.company_ids)
        p.business_unit_ids = Array.isArray(opts.company_ids)
            ? opts.company_ids.join(',')
            : String(opts.company_ids);
    const res = await getJson<ApiEnvelope<StoreItem[]>>(
        `/admin/company/${companyId}/stores`,
        p
    );
    return res.data;
}

export type SourceItem = { source: string; count: number };
export async function fetchSources(
    companyId: number,
    opts: {
        month?: string;
        start_date?: string;
        end_date?: string;
        scope?: 'all' | 'own';
        company_ids?: string | number[];
    } = {}
) {
    const p: Record<string, string> = {};
    if (opts.month) p.month = opts.month;
    if (opts.start_date) p.start_date = opts.start_date;
    if (opts.end_date) p.end_date = opts.end_date;
    if (opts.scope) p.scope = opts.scope;
    // Backend expects 'business_unit_ids' not 'company_ids'
    if (opts.company_ids)
        p.business_unit_ids = Array.isArray(opts.company_ids)
            ? opts.company_ids.join(',')
            : String(opts.company_ids);
    const res = await getJson<ApiEnvelope<SourceItem[]>>(
        `/admin/company/${companyId}/dashboard/sources`,
        p
    );
    return res.data;
}

export async function toggleStoreActive(
    companyId: number,
    storeId: string | number,
    is_active: boolean
) {
    const res = await patchJson<ApiEnvelope<{}>>(
        `/admin/company/${companyId}/stores/${storeId}`,
        { is_active }
    );
    return res.success;
}

// Lambda Health Check Types
export type LambdaError = {
    timestamp: string;
    message: string;
    logStream: string | null;
};

export type LambdaHealthStatus = {
    function: string;
    hasErrors: boolean;
    errorCount: number;
    status: 'healthy' | 'unhealthy' | 'error';
    recentErrors: LambdaError[];
};

export async function fetchLambdaHealth(
    opts?: {
        window?: string; // e.g., '5m', '15m', '1h'
        functions?: string; // comma-separated list of function names
    }
): Promise<LambdaHealthStatus[]> {
    // Note: This endpoint is at /api/lambdas/log-health (not /api/v1)
    const base = BACKEND_BASE_URL.replace(/\/$/, '');
    const url = new URL(`${base}/api/lambdas/log-health`);
    
    if (opts?.window) {
        url.searchParams.set('window', opts.window);
    }
    if (opts?.functions) {
        url.searchParams.set('functions', opts.functions);
    }
    
    const headers = {
        'Content-Type': 'application/json',
        ...(await authHeaders()),
    } as Record<string, string>;
    
    const res = await fetch(url.toString(), {
        headers,
        method: 'GET',
        signal: AbortSignal.timeout(60000), // 60 seconds timeout for CloudWatch queries
    });
    
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(
            `GET ${url.pathname} failed: ${res.status} ${res.statusText} ${txt}`
        );
    }
    
    return (await res.json()) as LambdaHealthStatus[];
}