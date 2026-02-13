import {
    type QueryClient,
    QueryFilters,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import {
    type CompanyData,
    type CompanyDataEditPayload,
    type ExcludedDatesPayload,
    type FAQPayload,
    type InterviewDaysPayload,
    type InterviewHoursPayload,
    addExcludedDates,
    addInterviewDays,
    addInterviewHours,
    editCompany,
    getCompanyData,
    postCompanyFAQs,
    removeExcludedDates,
    removeInterviewDays,
    removeInterviewHours,
} from '../lib/api';

export const useCompanyData = (companyId: number) => {
    const enabled = Number.isFinite(companyId) && companyId > 0;
    if (!enabled) {
        // eslint-disable-next-line no-console
        console.warn(
            '[querys/company] useCompanyData called with invalid companyId:',
            companyId
        );
    }
    return useQuery({
        queryKey: ['company', companyId],
        queryFn: () => getCompanyData(companyId),
        enabled,
        retry: enabled ? 3 : false,
    });
};

// Helpers
const updateCompanyDataCache = (
    queryClient: QueryClient,
    companyId: number,
    updater: (prev: CompanyData) => CompanyData
) => {
    queryClient.setQueryData(['company', companyId], updater);
};

export const usePostCompanyFAQs = (companyId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: FAQPayload) =>
            postCompanyFAQs(companyId, payload),
        onMutate: async (payload) => {
            //@ts-ignore
            await queryClient.cancelQueries(['company', companyId]);
            const previousData = queryClient.getQueryData([
                'company',
                companyId,
            ]);
            updateCompanyDataCache(queryClient, companyId, (prev) => ({
                ...prev,
                general_faq: payload.faqs,
            }));
            return { previousData };
        },
        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['company', companyId],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            //@ts-ignore
            queryClient.invalidateQueries(['company', companyId]);
        },
    });
};

export const useAddInterviewDays = (companyId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: InterviewDaysPayload) =>
            addInterviewDays(companyId, payload),
        onMutate: async (newDays) => {
            //@ts-ignore
            await queryClient.cancelQueries(['company', companyId]);
            const previousData = queryClient.getQueryData([
                'company',
                companyId,
            ]);
            updateCompanyDataCache(queryClient, companyId, (prev) => ({
                ...prev,
                interview_days: Array.from(
                    new Set([...prev.interview_days, ...newDays.days])
                ),
            }));
            return { previousData };
        },
        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['company', companyId],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            //@ts-ignore
            queryClient.invalidateQueries(['company', companyId]);
        },
    });
};

export const useRemoveInterviewDays = (companyId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: InterviewDaysPayload) =>
            removeInterviewDays(companyId, payload),
        onMutate: async (toRemove) => {
            //@ts-ignore
            await queryClient.cancelQueries(['company', companyId]);
            const previousData = queryClient.getQueryData([
                'company',
                companyId,
            ]);
            updateCompanyDataCache(queryClient, companyId, (prev) => ({
                ...prev,
                interview_days: prev.interview_days.filter(
                    (day: string) => !toRemove.days.includes(day)
                ),
            }));
            return { previousData };
        },
        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['company', companyId],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            //@ts-ignore
            queryClient.invalidateQueries(['company', companyId]);
        },
    });
};

export const useAddInterviewHours = (companyId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: InterviewHoursPayload) =>
            addInterviewHours(companyId, payload),
        onMutate: async (newHours) => {
            //@ts-ignore
            await queryClient.cancelQueries(['company', companyId]);
            const previousData = queryClient.getQueryData([
                'company',
                companyId,
            ]);
            updateCompanyDataCache(queryClient, companyId, (prev) => ({
                ...prev,
                interview_hours: Array.from(
                    new Set([...prev.interview_hours, ...newHours.hours])
                ),
            }));
            return { previousData };
        },
        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['company', companyId],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            //@ts-ignore
            queryClient.invalidateQueries(['company', companyId]);
        },
    });
};

export const useRemoveInterviewHours = (companyId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: InterviewHoursPayload) =>
            removeInterviewHours(companyId, payload),
        onMutate: async (toRemove) => {
            //@ts-ignore
            await queryClient.cancelQueries(['company', companyId]);
            const previousData = queryClient.getQueryData([
                'company',
                companyId,
            ]);
            updateCompanyDataCache(queryClient, companyId, (prev) => ({
                ...prev,
                interview_hours: prev.interview_hours.filter(
                    (hour: string) => !toRemove.hours.includes(hour)
                ),
            }));
            return { previousData };
        },
        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['company', companyId],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            //@ts-ignore
            queryClient.invalidateQueries(['company', companyId]);
        },
    });
};

export const useAddExcludedDates = (companyId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: ExcludedDatesPayload) =>
            addExcludedDates(companyId, payload),
        onMutate: async (newDates) => {
            //@ts-ignore
            await queryClient.cancelQueries(['company', companyId]);
            const previousData = queryClient.getQueryData([
                'company',
                companyId,
            ]);
            updateCompanyDataCache(queryClient, companyId, (prev) => ({
                ...prev,
                interview_excluded_dates: Array.from(
                    new Set([
                        ...prev.interview_excluded_dates,
                        ...newDates.dates,
                    ])
                ),
            }));
            return { previousData };
        },
        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['company', companyId],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            //@ts-ignore
            queryClient.invalidateQueries(['company', companyId]);
        },
    });
};

export const useRemoveExcludedDates = (companyId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: ExcludedDatesPayload) =>
            removeExcludedDates(companyId, payload),
        onMutate: async (toRemove) => {
            //@ts-ignore
            await queryClient.cancelQueries(['company', companyId]);
            const previousData = queryClient.getQueryData([
                'company',
                companyId,
            ]);
            updateCompanyDataCache(queryClient, companyId, (prev) => ({
                ...prev,
                interview_excluded_dates: prev.interview_excluded_dates.filter(
                    (date: string) => !toRemove.dates.includes(date)
                ),
            }));
            return { previousData };
        },
        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['company', companyId],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            //@ts-ignore
            queryClient.invalidateQueries(['company', companyId]);
        },
    });
};

export const useEditCompany = (companyId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (
            payload: Omit<CompanyDataEditPayload, 'interview_addresses'>
        ) => editCompany(companyId, payload),
        onMutate: async (payload) => {
            //@ts-ignore
            await queryClient.cancelQueries(['company', companyId]);
            const previousData = queryClient.getQueryData([
                'company',
                companyId,
            ]);
            updateCompanyDataCache(queryClient, companyId, (prev) => {
                return {
                    ...prev,
                    ...payload,
                };
            });
            return { previousData };
        },
        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['company', companyId],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            //@ts-ignore
            queryClient.invalidateQueries(['company', companyId]);
        },
    });
};

export const useMutationPostCompanyInterviewAddresses = (companyId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (
            payload: Pick<CompanyDataEditPayload, 'interview_addresses'>
        ) => editCompany(companyId, payload),
        onMutate: async (payload) => {
            //@ts-ignore
            await queryClient.cancelQueries(['company', companyId]);
            const previousData = queryClient.getQueryData([
                'company',
                companyId,
            ]);
            updateCompanyDataCache(queryClient, companyId, (prev) => {
                const { interview_addresses, ...rest } = payload;
                if (!interview_addresses) return prev;

                const newAddresses = interview_addresses.map(
                    (address, index) => {
                        return {
                            address,
                            map_link: '',
                            location_id: index,
                        };
                    }
                );

                return {
                    ...prev,
                    interview_addresses: newAddresses,
                };
            });
            return { previousData };
        },
        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['company', companyId],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            //@ts-ignore
            queryClient.invalidateQueries(['company', companyId]);
        },
    });
};
