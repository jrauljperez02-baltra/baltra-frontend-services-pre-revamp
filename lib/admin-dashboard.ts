'use client';

import { fetchAuthSession } from 'aws-amplify/auth';
import { BACKEND_BASE_URL } from '@/config/env';

const API_ROOT = `${BACKEND_BASE_URL.replace(/\/$/, '')}/api/v1`;

type QueryValue = string | number | boolean | null | undefined;

async function adminGet<T>(
    path: string,
    params?: Record<string, QueryValue>
): Promise<{ success: boolean; data: T; meta?: any }> {
    const url = new URL(`${API_ROOT}${path}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            const str = String(value);
            if (str.length > 0) {
                url.searchParams.set(key, str);
            }
        });
    }

    let authHeader: Record<string, string> = {};
    try {
        const session = await fetchAuthSession();
        const token = session?.tokens?.idToken?.toString();
        if (token) {
            authHeader = { Authorization: `Bearer ${token}` };
        }
    } catch {
        authHeader = {};
    }

    const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...authHeader,
        },
        signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(
            `GET ${url.pathname} failed: ${res.status} ${res.statusText} ${body}`
        );
    }

    return (await res.json()) as { success: boolean; data: T; meta?: any };
}

export interface PhoneFunnelCompanyBreakdown {
    id: number | string | null;
    count: number;
}

export interface PhoneFunnelState {
    state: string;
    count: number;
    percent?: number;
    companies?: PhoneFunnelCompanyBreakdown[];
}

export interface PhoneFunnelResult {
    states: PhoneFunnelState[];
    total: number;
    meta?: Record<string, any>;
}

export async function fetchPhoneFunnel(
    companyId: number,
    opts: {
        month?: string;
        start_date?: string;
        end_date?: string;
        scope?: 'all' | 'own';
        company_ids?: Array<string | number>;
        include_percent?: boolean;
    } = {}
): Promise<PhoneFunnelResult> {
    const params: Record<string, QueryValue> = {};
    if (opts.month) params.month = opts.month;
    if (opts.start_date) params.start_date = opts.start_date;
    if (opts.end_date) params.end_date = opts.end_date;
    if (opts.scope) params.scope = opts.scope;
    if (opts.include_percent !== undefined)
        params.include_percent = opts.include_percent ? 'true' : 'false';
    if (opts.company_ids && opts.company_ids.length > 0) {
        params.company_ids = opts.company_ids.join(',');
    }

    const payload = await adminGet<PhoneFunnelState[]>(
        `/admin/company/${companyId}/dashboard/phone-funnel`,
        params
    );
    const total = Number(payload.meta?.total ?? 0) || 0;

    return {
        states: Array.isArray(payload.data) ? payload.data : [],
        total,
        meta: payload.meta,
    };
}

export async function fetchPhoneFunnelByQuery(
    companyId: number,
    opts: {
        month?: string;
        start_date?: string;
        end_date?: string;
        scope?: 'all' | 'own';
        company_ids?: Array<string | number>;
        include_percent?: boolean;
    } = {}
): Promise<PhoneFunnelResult> {
    const params: Record<string, QueryValue> = {};
    params.business_unit_id = companyId;
    if (opts.month) params.month = opts.month;
    if (opts.start_date) params.start_date = opts.start_date;
    if (opts.end_date) params.end_date = opts.end_date;
    if (opts.scope) params.scope = opts.scope;
    if (opts.include_percent !== undefined)
        params.include_percent = opts.include_percent ? 'true' : 'false';
    if (opts.company_ids && opts.company_ids.length > 0) {
        params.company_ids = opts.company_ids.join(',');
    }

    const payload = await adminGet<PhoneFunnelState[]>(
        `/admin/dashboard/phone-funnel`,
        params
    );
    const total = Number(payload.meta?.total ?? 0) || 0;

    return {
        states: Array.isArray(payload.data) ? payload.data : [],
        total,
        meta: payload.meta,
    };
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
    search?: string,
    active: 'true' | 'false' | 'all' = 'all',
    opts: {
        month?: string;
        start_date?: string;
        end_date?: string;
        scope?: 'all' | 'own';
        company_ids?: Array<string | number>;
    } = {}
): Promise<StoreItem[]> {
    const params: Record<string, QueryValue> = {};
    if (search) params.search = search;
    if (active) params.active = active;
    if (opts.month) params.month = opts.month;
    if (opts.start_date) params.start_date = opts.start_date;
    if (opts.end_date) params.end_date = opts.end_date;
    if (opts.scope) params.scope = opts.scope;
    if (opts.company_ids && opts.company_ids.length > 0) {
        params.company_ids = opts.company_ids.join(',');
    }

    const payload = await adminGet<StoreItem[]>(
        `/admin/company/${companyId}/stores`,
        params
    );

    return Array.isArray(payload.data) ? payload.data : [];
}