// lib/user-attributes.ts

/**
 * Utilities to fetch and normalize user attributes from AWS Amplify.
 * This module does NOT need `"use client"` because it dynamically imports
 * `aws-amplify/auth` inside the functions. However, you must only call them
 * from client components/effects.
 */

export type UserAttributes = {
    email: string | null;
    userId: string | null;
    companyId: number | null;
    isSuperadmin: boolean | null;
    isAdmin: boolean | null;
    isGroupOne?: boolean | null;
    companiesIds?: number[] | null;
    emailVerified?: string | null;
};

/**
 * Safely fetches the current user's attributes from Amplify and normalizes them.
 * - Converts `custom:company_id` to a number or null.
 * - Converts `custom:is_superadmin` to a boolean or null.
 * - Handles errors by returning an empty object (with nulls) to avoid breaking the UI.
 */
export async function fetchUserAttributesSafe(): Promise<UserAttributes> {
    try {
        // Dynamic import to avoid marking the whole file as client-side.
        const { fetchUserAttributes, fetchAuthSession } = await import(
            'aws-amplify/auth'
        );
        const attributes = await fetchUserAttributes();

        const email = (attributes as any)?.email ?? null;
        const userId = (attributes as any)?.sub ?? null;

        const companyIdRaw =
            (attributes as any)?.['custom:company_id'] ??
            (attributes as any)?.['company_id']; // expected custom attribute
        let companyId =
            companyIdRaw !== undefined &&
            companyIdRaw !== null &&
            `${companyIdRaw}`.trim() !== '' &&
            !Number.isNaN(Number(companyIdRaw))
                ? Number(companyIdRaw)
                : null;
        // Normalize invalid/placeholder ids (e.g., -1) to null to avoid bad requests
        if (typeof companyId === 'number' && companyId <= 0) {
            companyId = null;
        }

        // Normalize boolean-ish values like "true", "1", "yes", true, 1, etc.
        const toBool = (val: unknown): boolean | null => {
            if (val === undefined || val === null) return null;
            if (typeof val === 'boolean') return val;
            if (typeof val === 'number') return val === 1;
            if (typeof val === 'string') {
                const s = val.trim().toLowerCase();
                // accept common truthy variants, including accented Spanish "sí"
                if (['true', '1', 'yes', 'y', 'si', 'sí'].includes(s))
                    return true;
                if (['false', '0', 'no', 'n'].includes(s)) return false;
            }
            return null;
        };

        // Parse admin flags and companies list
        const parseCompanies = (val: unknown): number[] | null => {
            if (val == null) return null;
            if (Array.isArray(val))
                return val
                    .map((v) => Number(v))
                    .filter((n) => Number.isFinite(n));
            const s = String(val).trim();
            if (!s) return null;
            try {
                const arr = JSON.parse(s);
                if (Array.isArray(arr))
                    return arr
                        .map((v) => Number(v))
                        .filter((n) => Number.isFinite(n));
            } catch {}
            const parts = s
                .replace(/[\[\]]/g, '')
                .split(/[;,\s]+/)
                .filter(Boolean);
            const list = parts
                .map((p) => Number(p))
                .filter((n) => Number.isFinite(n));
            return list.length ? list : null;
        };

        const rawIsAdmin =
            (attributes as any)?.['custom:is_admin'] ??
            (attributes as any)?.['is_admin'];
        let isAdmin: boolean | null = toBool(rawIsAdmin);

        const rawCompanies =
            (attributes as any)?.['custom:companies_ids'] ??
            (attributes as any)?.['companies_ids'];
        let companiesIds: number[] | null = parseCompanies(rawCompanies);

        // Read isSuperadmin from common keys to be robust across login changes.
        const rawIsSuperFromAttrs =
            (attributes as any)?.['custom:is_superadmin'] ??
            (attributes as any)?.['custom:isSuperadmin'] ??
            (attributes as any)?.['is_superadmin'] ??
            (attributes as any)?.['isSuperadmin'];
        let isSuperadmin: boolean | null = toBool(rawIsSuperFromAttrs);

        // Fallback: check Cognito groups from the ID token if available
        try {
            const session = await fetchAuthSession();
            const groups: string[] | undefined = (session as any)?.tokens
                ?.idToken?.payload?.['cognito:groups']; // Amplify v6
            const payload: any = (session as any)?.tokens?.idToken?.payload;
            if (Array.isArray(groups)) {
                if (groups.map((g) => g.toLowerCase()).includes('superadmin')) {
                    isSuperadmin = true;
                }
            }
            // Fallbacks from token payload for custom claims
            if (isAdmin == null && payload) {
                isAdmin = toBool(
                    payload['custom:is_admin'] ?? payload['is_admin']
                );
            }
            if (!companiesIds && payload) {
                companiesIds = parseCompanies(
                    payload['custom:companies_ids'] ?? payload['companies_ids']
                );
            }
            if (companyId == null && payload) {
                const cid =
                    payload['custom:company_id'] ?? payload['company_id'];
                if (cid != null && !Number.isNaN(Number(cid))) {
                    const n = Number(cid);
                    companyId = n > 0 ? n : null;
                }
            }
        } catch (e) {
            // ignore session errors; attribute-based detection will be used
        }

        // If companyId is still null, attempt a short retry loop (up to ~2.5s)
        if (companyId == null) {
            const started = Date.now();
            while (Date.now() - started < 2500 && companyId == null) {
                try {
                    const {
                        fetchUserAttributes: fua2,
                        fetchAuthSession: fas2,
                    } = await import('aws-amplify/auth');
                    const at2 = await fua2();
                    const cid2 =
                        (at2 as any)?.['custom:company_id'] ??
                        (at2 as any)?.['company_id'];
                    if (
                        cid2 != null &&
                        `${cid2}`.trim() !== '' &&
                        !Number.isNaN(Number(cid2))
                    ) {
                        const n = Number(cid2);
                        if (n > 0) {
                            companyId = n;
                            break;
                        }
                    }
                    // fallback to token payload
                    try {
                        const sess2 = await fas2();
                        const payload: any = (sess2 as any)?.tokens?.idToken
                            ?.payload;
                        const cidTok =
                            payload?.['custom:company_id'] ??
                            payload?.['company_id'];
                        if (cidTok != null && !Number.isNaN(Number(cidTok))) {
                            const n = Number(cidTok);
                            if (n > 0) {
                                companyId = n;
                                break;
                            }
                        }
                    } catch {}
                } catch {}
                await new Promise((r) => setTimeout(r, 200));
            }
        }
        const isGroupOne = !!(companyId && companyId >= 12 && companyId <= 150);

        return {
            email,
            userId,
            companyId,
            isSuperadmin,
            isAdmin,
            companiesIds,
            isGroupOne,
        };
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.error('Error fetching user attributes:', err);
        }
        return {
            email: null,
            userId: null,
            companyId: null,
            isSuperadmin: null,
            isAdmin: null,
            companiesIds: null,
            isGroupOne: null,
        };
    }
}

/**
 * Helper to check if there is a valid companyId.
 */
export function hasCompanyId(
    attrs: UserAttributes
): attrs is UserAttributes & { companyId: number } {
    return (
        typeof attrs.companyId === 'number' && Number.isFinite(attrs.companyId)
    );
}

/**
 * Helper to check if the user is a superadmin.
 */
export function isUserSuperadmin(attrs: UserAttributes): boolean {
    return attrs.isSuperadmin === true;
}

/** Helper to check if the user is an admin (custom:is_admin) */
export function isUserAdmin(
    attrs: UserAttributes,
    companyData?: { group_id?: number | null } | null
): boolean {
    // First check: user must have is_admin flag
    if (attrs.isAdmin !== true) {
        return false;
    }

    // If user has multiple companies via companiesIds, grant admin access
    // This allows admins with access to multiple business units to see the admin dashboard
    if (attrs.companiesIds && Array.isArray(attrs.companiesIds) && attrs.companiesIds.length > 0) {
        return true;
    }

    // For single company admins, require company to have a group_id (not null)
    return companyData?.group_id != null;
}

/**
 * Helper to check if the user is a group one user.
 */
export function isGroupOne(attrs: UserAttributes): boolean {
    return attrs.isGroupOne === true;
}
