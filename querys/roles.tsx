import {
    type QueryClient,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import {
    ChangeRole,
    DeleteRole,
    type RoleData,
    cloneRole,
    getRolesData,
    postRole,
} from '../lib/api';

export const useRolesData = (companyId: number) => {
    return useQuery({
        queryKey: ['roles', companyId],
        queryFn: () => getRolesData(companyId),
    });
};

export const useRolesDataMap = (companyId: number) => {
    return useQuery({
        queryKey: ['roles', companyId],
        queryFn: () => getRolesData(companyId),
        select: (data) => {
            if (!data) return {};
            return data.reduce(
                (acc, role) => {
                    acc[role.id] = role;
                    return acc;
                },
                {} as Record<number, RoleData>
            );
        },
    });
};

export const updateRolesDataCache = (
    queryClient: QueryClient,
    companyId: number,
    updater: (prev: RoleData[]) => RoleData[]
) => {
    queryClient.setQueryData(['roles', companyId], updater);
};

export const useAddRoleMutation = (companyId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (roleName: string) => postRole(companyId, roleName),
        onMutate: async (name) => {
            await queryClient.cancelQueries({ queryKey: ['roles', companyId] });
            const previousData = queryClient.getQueryData<RoleData[]>([
                'roles',
                companyId,
            ]);
            updateRolesDataCache(
                queryClient,
                companyId,
                (prev: RoleData[] = []) => {
                    const newRole: RoleData = {
                        name: name,
                        id: Date.now(),
                        active: true,
                        business_unit_id: companyId,
                        info: [],
                        set_id: new Date().getTime(), // Placeholder for set_id, adjust as needed
                    };

                    return [...prev, newRole];
                }
            );
            return { previousData };
        },
        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['roles', companyId],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ['roles', companyId],
            });
        },
    });
};

export const useDeleteRoleMutation = (companyId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (roleId: number) => DeleteRole(companyId, roleId),
        onMutate: async (roleId) => {
            await queryClient.cancelQueries({ queryKey: ['roles', companyId] });
            const previousData = queryClient.getQueryData<RoleData[]>([
                'roles',
                companyId,
            ]);
            updateRolesDataCache(queryClient, companyId, (prev: RoleData[]) => {
                return prev.filter((role) => role.id !== roleId);
            });
            return { previousData };
        },
        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['roles', companyId],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ['roles', companyId],
            });
        },
    });
};

export const useCloneRoleMutation = (companyId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (roleId: number) => cloneRole(companyId, roleId),
        onMutate: async (roleId) => {
            await queryClient.cancelQueries({ queryKey: ['roles', companyId] });
            const previousData = queryClient.getQueryData([
                'roles',
                companyId,
            ]) as RoleData[];
            updateRolesDataCache(
                queryClient,
                companyId,
                (prev: RoleData[] = []) => {
                    // Find the role to clone
                    const roleToClone = prev.find((role) => role.id === roleId);

                    if (!roleToClone) {
                        throw new Error('Role not found for cloning');
                    }

                    const newRole: RoleData = {
                        name: `${roleToClone.name} (Copia)`,
                        id: Date.now(),
                        active: true,
                        business_unit_id: companyId,
                        info: roleToClone.info,
                        set_id: new Date().getTime(), // Placeholder for set_id, adjust as needed
                    };

                    return [...prev, newRole];
                }
            );
            return { previousData };
        },
        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['roles', companyId],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ['roles', companyId],
            });
        },
    });
};

export const useChangeRoleNameMutation = (companyId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            roleId,
            newRoleName,
        }: {
            roleId: number;
            newRoleName: string;
        }) => ChangeRole(companyId, roleId, { name: newRoleName }),
        onMutate: async ({ roleId, newRoleName }) => {
            await queryClient.cancelQueries({ queryKey: ['roles', companyId] });
            const previousData = queryClient.getQueryData([
                'roles',
                companyId,
            ]) as RoleData[];
            updateRolesDataCache(
                queryClient,
                companyId,
                (prev: RoleData[] = []) => {
                    return prev.map((role) => {
                        if (role.id === roleId) {
                            return {
                                ...role,
                                name: `${newRoleName} (Copia)`,
                            };
                        }
                        return role;
                    });
                }
            );
            return { previousData };
        },
        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['roles', companyId],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ['roles', companyId],
            });
        },
    });
};

export const useMutationRoleEligibilityCriteria = (companyId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            roleId,
            criteria,
        }: {
            roleId: number;
            criteria?: Record<number | string, string>;
        }) => ChangeRole(companyId, roleId, { eligibility_criteria: criteria }),
        onMutate: async ({ roleId, criteria }) => {
            await queryClient.cancelQueries({ queryKey: ['roles', companyId] });
            const previousData = queryClient.getQueryData([
                'roles',
                companyId,
            ]) as RoleData[];

            updateRolesDataCache(
                queryClient,
                companyId,
                (prev: RoleData[] = []) => {
                    return prev.map((role) => {
                        if (role.id === roleId) {
                            return {
                                ...role,
                                eligibility_criteria: criteria,
                            };
                        }
                        return role;
                    });
                }
            );

            return { previousData };
        },
        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['roles', companyId],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ['roles', companyId],
            });
        },
    });
};

export const useChangeRoleActiveMutation = (companyId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ roleId, active }: { roleId: number; active: boolean }) =>
            ChangeRole(companyId, roleId, { active }),
        onMutate: async ({ roleId, active }) => {
            await queryClient.cancelQueries({ queryKey: ['roles', companyId] });
            const previousData = queryClient.getQueryData([
                'roles',
                companyId,
            ]) as RoleData[];
            updateRolesDataCache(
                queryClient,
                companyId,
                (prev: RoleData[] = []) => {
                    return prev.map((role) => {
                        if (role.id === roleId) {
                            return {
                                ...role,
                                active,
                            };
                        }
                        return role;
                    });
                }
            );
            return { previousData };
        },
        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['roles', companyId],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ['roles', companyId],
            });
        },
    });
};
