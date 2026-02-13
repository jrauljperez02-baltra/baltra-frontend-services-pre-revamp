import DashboardClient from '../DashboardClient';

export default function DashboardCompanyPage({
    params,
}: {
    params: { companyId: string };
}) {
    return <DashboardClient initialStoreId={params.companyId} />;
}
