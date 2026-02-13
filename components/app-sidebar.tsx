'use client';

import {
    ClipboardListIcon,
    DatabaseIcon,
    FileIcon,
    LayoutDashboardIcon,
    MessageSquareIcon,
    PhoneIcon,
    UserCheckIcon,
    UsersIcon,
    VideoIcon,
    CheckCircle2,
} from 'lucide-react';
import * as React from 'react';

import { NavDocuments } from '@/components/nav-documents';
import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { BaltraLogo } from './baltra-logo';
import { NavAdmin } from './nav-admin';
import { NavUserSkeleton } from './nav-user-skeleton';
import { Separator } from './ui/separator';

import { useCompanyData } from '@/querys/company';

import {
    fetchUserAttributesSafe,
    isUserAdmin,
    type UserAttributes,
} from '@/lib/user-attributes';
import { useCompany } from '@/context/CompanyContext';
import { useRouter } from 'next/navigation';

export function AppSidebar({
    isAdmin: isAdminProp,
    ...props
}: React.ComponentProps<typeof Sidebar> & { isAdmin?: boolean }) {
    const [attrs, setAttrs] = React.useState<UserAttributes>({
        email: null,
        userId: null,
        companyId: null,
        isSuperadmin: null,
        isAdmin: null,
        emailVerified: null,
        companiesIds: null,
    });
    const [loadingAttrs, setLoadingAttrs] = React.useState(true);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            const a = await fetchUserAttributesSafe();
            if (mounted) {
                setAttrs(a);
                setLoadingAttrs(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // Use effective companyId from CompanyContext (respects impersonation)
    const { companyId: effectiveCompanyId, isImpersonating } = useCompany();
    // Avoid forcing a -1 default; if companyId is not available yet, pass 0 to prevent requests
    const { data: companyData } = useCompanyData(effectiveCompanyId ?? 0);

    const effectiveIsAdmin = isAdminProp ?? isUserAdmin(attrs, companyData ?? undefined);
    // Determine company-specific flags based on effective (possibly impersonated) company id
    const companyIdCheck = effectiveCompanyId ?? attrs.companyId;
    const isCompany2 = companyIdCheck === 2;
    const isCompany179 = companyIdCheck === 179;
    const hasOnboardingFeature = companyData?.group_id === 1;

    const data = {
        user: {
            name: 'shadcn',
            email: 'm@example.com',
            avatar: '/avatars/shadcn.jpg',
        },
        navMain: [
            {
                title: 'Panel de Control',
                url: '/dashboard',
                icon: LayoutDashboardIcon,
            },
            { title: 'Generación de Leads', url: '/leads', icon: UsersIcon },
            {
                title: 'Filtro de Candidatos',
                url: '/screening',
                icon: UserCheckIcon,
            },
            ...(isCompany179
                ? [{ title: 'Llamadas', url: '/calls', icon: PhoneIcon }]
                : []),
            { title: 'Citado Entrevista', url: '/interview', icon: VideoIcon },
            ...(isCompany2
                ? [{ title: 'Llamadas', url: '/calls', icon: PhoneIcon }]
                : []),
            {
                title: 'Atendio Entrevista',
                url: '/contratados',
                icon: CheckCircle2,
            },
            ...(hasOnboardingFeature
                ? [
                      {
                          title: 'Onboarding',
                          url: '/onboarding',
                          icon: MessageSquareIcon,
                      },
                  ]
                : []),
        ],
        navSecondary: [],
        documents: [
            { name: 'Data Library', url: '#', icon: DatabaseIcon },
            { name: 'Reports', url: '#', icon: ClipboardListIcon },
            { name: 'Word Assistant', url: '#', icon: FileIcon },
        ],
        navAdmin: [{ title: 'Usuarios', url: '/users', icon: UsersIcon }],
    };

    const { clearImpersonation } = useCompany();
    const router = useRouter();

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:!p-1.5"
                        >
                            <Link href="/leads">
                                <BaltraLogo className="h-6 w-6 sm:h-8 sm:w-8 text-primary hidden sm:block" />
                                <span className="text-base font-semibold">
                                    Baltra
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    {isImpersonating && (
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={() => {
                                    clearImpersonation();
                                    router.push('/dashboard?tab=stores');
                                }}
                            >
                                Volver al Admin
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarHeader>

            <Separator className="my-2" />

            <SidebarContent>
                <NavMain items={data.navMain} />
                {effectiveIsAdmin && !isImpersonating && (
                    <NavAdmin items={data.navAdmin} />
                )}
                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <Separator className="mt-2" />

            <SidebarFooter>
                {!loadingAttrs && (
                    <NavUser
                        user={{
                            avatar: '/baltra-logo.png',
                            name: attrs.email ?? 'Baltra',
                            email: attrs.email ?? 'm@example.com',
                        }}
                    />
                )}
                {loadingAttrs && <NavUserSkeleton />}
            </SidebarFooter>
        </Sidebar>
    );
}
