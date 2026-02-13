import type React from 'react';

interface CompanyAccessProps {
    children: React.ReactNode;
    companyId: number;
    allowedCompanies: number[];
}

export const CompanyAccess: React.FC<CompanyAccessProps> = ({
    children,
    companyId,
    allowedCompanies,
}) => {
    if (!allowedCompanies.includes(Number(companyId))) {
        console.warn(`Company ${companyId} no está autorizado `);
        return null;
    }
    return <>{children}</>;
};
