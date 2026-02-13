'use client';
import { useCompanyID, useCompany } from '@/context/CompanyContext';
import { type FAQPayload, type RoleData, postRoleFAQs } from '@/lib/api';
import { useCandidatesStatsData } from '@/querys/candidates';
import { useCompanyData } from '@/querys/company';
import {
    useChangeRoleActiveMutation,
    useChangeRoleNameMutation,
    useCloneRoleMutation,
    useDeleteRoleMutation,
    useRolesData,
} from '@/querys/roles';
import { Copy, HelpCircle, MessageCircle, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AddRoleDialog } from './add-role-dialog';
import { CompanyInfoFAQsDialog } from './company-info-faqs-dialog';
import { EnhancedRoleCard } from './enhanced-role-card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
export const EnhancedScreeningConfiguration = () => {
    const router = useRouter();
    const companyId = useCompanyID();
    const { isAdmin, isGroupOne } = useCompany();
    const canSeeOptions = !isGroupOne || isAdmin;
    const { data: candidatesStatsData } = useCandidatesStatsData(companyId);
    const { data: companyData, isLoading: isCompanyLoading } =
        useCompanyData(companyId);
    const { data: rolesData, refetch } = useRolesData(companyId);
    const [selectedRole, setSelectedRole] = useState<RoleData | undefined>(
        undefined
    );

    const { mutateAsync: deleteRole } = useDeleteRoleMutation(companyId);

    const { mutateAsync: cloneRole } = useCloneRoleMutation(companyId);

    const { mutateAsync: updateRoleName } =
        useChangeRoleNameMutation(companyId);

    const { mutateAsync: updateRoleActive } =
        useChangeRoleActiveMutation(companyId);

    const deleteRoleHandler = async (roleId: number) => {
        toast.promise(deleteRole(roleId), {
            loading: 'Eliminando rol...',
            success: () => {
                return 'Rol eliminado exitosamente.';
            },
            error: (error) => {
                console.error('Error deleting role:', error);
                return 'Error al eliminar el rol. Por favor, inténtalo de nuevo.';
            },
            position: 'top-center',
        });
    };

    const handleRoleUpdate = async (
        companyId: number,
        roleId: number,
        data: FAQPayload
    ) => {
        toast.promise(postRoleFAQs(companyId, roleId, data), {
            loading: 'Actualizando preguntas frecuentes...',
            success: () => {
                return 'Preguntas frecuentes actualizadas exitosamente.';
            },
            error: (error) => {
                console.error('Error updating role FAQs:', error);
                return 'Error al actualizar las preguntas frecuentes. Por favor, inténtalo de nuevo.';
            },
            position: 'top-center',
        });
    };

    const handleRoleClone = async (roleId: number) => {
        toast.promise(cloneRole(roleId), {
            loading: 'Clonando rol...',
            success: () => {
                return 'Rol clonado exitosamente.';
            },
            error: (error) => {
                console.error('Error cloning role:', error);
                return 'Error al clonar el rol. Por favor, inténtalo de nuevo.';
            },
            position: 'top-center',
        });
    };

    const handleRoleNameChange = async (roleId: number, newName: string) => {
        if (!newName.trim()) {
            toast.error('El nombre del rol no puede estar vacío.');
            return;
        }
        toast.promise(
            updateRoleName({
                newRoleName: newName.trim(),
                roleId,
            }),
            {
                loading: 'Actualizando nombre del rol...',
                success: () => {
                    return 'Nombre del rol actualizado exitosamente.';
                },
                error: (error) => {
                    console.error('Error updating role name:', error);
                    return 'Error al actualizar el nombre del rol. Por favor, inténtalo de nuevo.';
                },
                position: 'top-center',
            }
        );
    };

    const handlerToggleActive = (role: RoleData, newState: boolean) => {
        toast.promise(
            updateRoleActive({
                roleId: role.id,
                active: newState,
            }),
            {
                loading: 'Cambiando estado del rol...',
                success: () => {
                    return 'Rol cambiado exitosamente.';
                },
                error: (error) => {
                    console.error('Error toggling role active:', error);
                    return 'Error al cambiar el estado del rol. Por favor, inténtalo de nuevo.';
                },
                position: 'top-center',
            }
        );
    };

    return (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-200/60 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-baltra-100 rounded-lg">
                        <Settings className="h-5 w-5 text-baltra-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">
                            Configuración de sección
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">
                            Gestione la preselección para cada función,
                            configure su agente de WhatsApp y mantenga
                            actualizadas las preguntas frecuentes.
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:text-slate-700"
                >
                    <HelpCircle className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Active Roles Section */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-600" />
                            <h3 className="font-medium text-slate-800">
                                Roles activos
                            </h3>
                            <Badge
                                variant="outline"
                                className="text-xs bg-slate-50"
                            >
                                {rolesData?.length ?? 0} roles
                            </Badge>
                        </div>
                        <AddRoleDialog
                            key={`role-${selectedRole ? selectedRole : 'DEFAULT-OPEN'}`}
                            role={selectedRole}
                            onSave={(role) => {
                                handleRoleNameChange(
                                    Number(role.id),
                                    role.name
                                );
                                setSelectedRole(undefined);
                            }}
                            onClose={() => setSelectedRole(undefined)}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] md:max-h-[500px] lg:max-h-[300px] overflow-y-auto">
                        {rolesData?.map((role) => (
                            <EnhancedRoleCard
                                key={`role-${role.id}`}
                                role={{
                                    id: role.id,
                                    name: role.name,
                                    questions: role.info.length,
                                    is_active: role.active ?? true,
                                }}
                                onToggleActive={(_, newState) =>
                                    handlerToggleActive(role, newState)
                                }
                                onClone={() => handleRoleClone(Number(role.id))}
                                onDelete={() => {
                                    deleteRoleHandler(Number(role.id));
                                }}
                                onEdit={() => setSelectedRole(role)}
                            />
                        ))}
                    </div>
                </div>

                {/* WhatsApp AI Agent Status */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-baltra-600" />
                        <h3 className="font-medium text-slate-800">
                            Agente de IA en Whatsapp
                        </h3>
                    </div>

                    <Card className="border-baltra-200/60 bg-gradient-to-br from-baltra-50/50 to-emerald-50/30">
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-baltra-100 rounded-full">
                                        <MessageCircle className="h-4 w-4 text-baltra-600" />
                                    </div>
                                    <Badge
                                        // variant="success"
                                        className="bg-baltra-100 text-baltra-800 border-baltra-200 hover:bg-baltra-200 hover:text-baltra-900 flex items-center"
                                    >
                                        <div className="w-2 h-2 bg-baltra-500 rounded-full mr-1.5 animate-pulse" />
                                        Activo
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="p-3 bg-white/60 rounded-lg border border-baltra-200/40">
                                    <div className="text-xs font-medium text-slate-600 mb-1">
                                        Numero de WhatsApp
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-sm font-semibold text-slate-800">
                                            {companyData?.phone || '-'}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-baltra-100"
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="">
                                    <div className="text-center p-2 bg-white/40 rounded-lg">
                                        <div className="text-lg font-bold text-slate-800">
                                            {candidatesStatsData.today_new_candidates ||
                                                '-'}
                                        </div>
                                        <div className="text-xs text-slate-600">
                                            Mensajes de hoy
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Configuration Actions */}
            <div className="border-t border-slate-200/60 pt-6">
                <div className="flex items-center gap-2 mb-4">
                    <Settings className="h-4 w-4 text-slate-600" />
                    <h3 className="font-medium text-slate-800">
                        Configuración
                    </h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {canSeeOptions && (
                        <div className="flex-1">
                            <Button
                                className="w-full bg-baltra-600 text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:bg-baltra-700 active:bg-baltra-800"
                                asChild
                            >
                                <Link href="/screening/questions">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Editar las preguntas de selección
                                </Link>
                            </Button>
                            <p className="text-xs text-slate-500 mt-1">
                                Personalice las preguntas para cada función con
                                una categorización avanzada
                            </p>
                        </div>
                    )}
                    {canSeeOptions && (
                        <div className="flex-1">
                            <CompanyInfoFAQsDialog
                                // defaultRole={selectedRole}
                                deleteDefaultRole={() =>
                                    setSelectedRole(undefined)
                                }
                                savedRole={(data) => {
                                    handleRoleUpdate(companyId, data.id, {
                                        faqs: data.info.map((faq) => ({
                                            question: faq.question,
                                            answer: faq.answer,
                                            index: faq.index,
                                        })),
                                    }).finally(() => {
                                        refetch();
                                    });
                                }}
                                key={
                                    selectedRole
                                        ? `${selectedRole}-faqs-dialog`
                                        : 'DEFAULT-OPEN'
                                }
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Actualizar los datos de la empresa y las
                                preguntas más frecuentes específicas del puesto
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
