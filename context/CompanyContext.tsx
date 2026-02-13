'use client';
import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import {
    fetchUserAttributesSafe,
    isUserAdmin,
    type UserAttributes,
    isGroupOne,
} from '@/lib/user-attributes';
import { useCompanyData } from '@/querys/company';

export interface CompanyContextType {
    baseCompanyId: number | null; // company id from login attributes
    companyId: number; // effective company id used for queries
    isAdmin: boolean; // whether user is admin according to attributes
    isGroupOne: boolean; // whether user is group one according to attributes
    isImpersonating: boolean; // effective companyId differs from baseCompanyId
    isLoadingCompanyData: boolean; // whether company data is still loading
    impersonate: (companyId: number) => void; // switch to a company id
    clearImpersonation: () => void; // return to base admin scope/company
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyRuntimeProvider({ children }: { children: ReactNode }) {
    const [attrs, setAttrs] = useState<UserAttributes | null>(null);
    const [impersonatedId, setImpersonatedId] = useState<number | null>(null);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            const a = await fetchUserAttributesSafe();
            if (mounted) setAttrs(a);
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const baseCompanyId = attrs?.companyId ?? null;
    const companyId = useMemo(() => {
        if (impersonatedId != null) return impersonatedId;
        // if no base company yet, default to 0 to avoid bad requests
        return typeof baseCompanyId === 'number' &&
            Number.isFinite(baseCompanyId)
            ? baseCompanyId
            : 0;
    }, [impersonatedId, baseCompanyId]);

    // Get company data for admin validation (use baseCompanyId, not impersonated)
    const baseCompanyIdForData = typeof baseCompanyId === 'number' && Number.isFinite(baseCompanyId) ? baseCompanyId : 0;
    const { data: companyData, isLoading: isLoadingCompanyData, error: companyDataError } = useCompanyData(baseCompanyIdForData);

    // Debug: log company data
    React.useEffect(() => {
        console.log('[CompanyContext] Company Data Debug:', {
            baseCompanyId,
            baseCompanyIdForData,
            companyData,
            isLoadingCompanyData,
            companyDataError,
            group_id: companyData?.group_id,
            attrs: {
                companyId: attrs?.companyId,
                isAdmin: attrs?.isAdmin,
                isSuperadmin: attrs?.isSuperadmin,
                companiesIds: attrs?.companiesIds,
                companiesIdsLength: attrs?.companiesIds?.length ?? 0,
            },
        });
    }, [baseCompanyId, baseCompanyIdForData, companyData, isLoadingCompanyData, companyDataError, attrs]);

    const isAdmin = useMemo(
        () =>
            attrs ? isUserAdmin(attrs, companyData ?? undefined) || attrs.isSuperadmin === true : false,
        [attrs, companyData]
    );
    const isGroupOneAdmin = useMemo(
        () => (attrs ? isGroupOne(attrs) : false),
        [attrs]
    );

    const value = useMemo<CompanyContextType>(
        () => ({
            baseCompanyId,
            companyId,
            isAdmin,
            isGroupOne: isGroupOneAdmin,
            isImpersonating: impersonatedId != null,
            isLoadingCompanyData: isLoadingCompanyData,
            impersonate: (id: number) => setImpersonatedId(id),
            clearImpersonation: () => setImpersonatedId(null),
        }),
        [baseCompanyId, companyId, isAdmin, isGroupOneAdmin, impersonatedId, isLoadingCompanyData]
    );

    return (
        <CompanyContext.Provider value={value}>
            {children}
        </CompanyContext.Provider>
    );
}

export const useCompanyID = (): number => {
    const context = useContext(CompanyContext);
    if (context === undefined) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context.companyId;
};

export const useCompany = (): CompanyContextType => {
    const context = useContext(CompanyContext);
    if (context === undefined) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
};
