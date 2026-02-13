import {
    type QueryClient,
    type QueryFilters,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import {
    type Candidate,
    type CandidatesPaginationFilters,
    type FunnelStates,
    type RejectReason,
    changeFunnelState,
    getCandidatesAnswers,
    getCandidatesData,
    getCandidatesPagination,
    getCandidatesStats,
    getInterviewAddresses,
} from '../lib/api';

export const useCandidatesData = (candidateId: number) => {
    return useQuery({
        queryKey: ['candidates', candidateId],
        queryFn: () => getCandidatesData(candidateId),
    });
};

export const useCandidatesStatsData = (
    companyId: number,
    dateRange?: { startDate?: string; endDate?: string }
) => {
    return useQuery({
        queryKey: ['candidates-new', companyId, dateRange?.startDate, dateRange?.endDate],
        queryFn: () => getCandidatesStats(companyId, dateRange),
        refetchInterval: 1000 * 60 * 5,
        initialData: {
            completed_interviews: 0,
            screening_in_progress: 0,
            conversion_rate: '0%',
            hired: 0,
            hiring_rate: '0%',
            interview_cited: 0,
            rejected_total: 0,
            rejected_pre_screening: 0,
            rejected_post_screening: 0,
            today_new_candidates: 0,
            total_evaluated: 0,
            upcoming_interviews: 0,
            missed_interviews: 0,
            entrevistados: 0,
            phone_interview_cited: 0,
            phone_interview: 0,
            phone_interview_demo: 0,
            phone_interview_passed: 0,
            phone_interview_failed: 0,
            phone_interviews_completed: 0,
            ingresados: 0,
        },
    });
};

export const useCandidatesAnswersData = (
    companyId: number,
    candidateId: number,
    disabled = false
) => {
    return useQuery({
        queryKey: ['candidates-answers', companyId, candidateId],
        queryFn: () => getCandidatesAnswers(companyId, candidateId),
        enabled: !disabled,
    });
};

const updateCandidatesDataCache = (
    queryClient: QueryClient,
    companyId: number,
    updater: (prev: Candidate[]) => Candidate[]
) => {
    queryClient.setQueryData(['candidates', companyId], updater);
};

const states_map = {
    rejected: 'Rechazado',
    scheduled_interview: 'Entrevista Agendada',
    screening_in_progress: 'En Progreso',
    hired: 'Contratado',
    missed_interview: 'Faltó a Entrevista',
    cancelled: 'Cancelado',
    onboarding: 'En Onboarding',
    expired: 'Expirado',
} as Record<FunnelStates, string>;

export const useChangeFunnelStateMutation = (companyId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            candidateId,
            newState,
            reason,
            startDate,
        }: {
            candidateId: number;
            newState: FunnelStates;
            reason?: RejectReason;
            startDate?: string;
        }) =>
            changeFunnelState(
                companyId,
                candidateId,
                newState,
                reason,
                startDate
            ),
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ['candidates-pagination', companyId],
                exact: false,
            });
        },
    });
};

export const useInfiniteCandidatesPagination = (
    companyId: number,
    {
        page,
        per_page,
        ...filter
    }: CandidatesPaginationFilters & {
        page?: number;
        per_page?: number;
    } = {},
    options?: {
        enabled?: boolean;
    }
) => {
    return useInfiniteQuery({
        initialPageParam: 1,
        queryKey: ['candidates-pagination', companyId, page, per_page, filter],
        queryFn: async ({ pageParam }) => {
            const data = await getCandidatesPagination(companyId, {
                page: page ?? pageParam,
                per_page: per_page,
                filters: {
                    ...filter,
                },
            });
            return data;
        },
        getNextPageParam: (lastPage) => {
            if (
                (lastPage?.pagination?.current_page ?? 1) >=
                (lastPage?.pagination?.total_pages ?? 1)
            ) {
                return undefined;
            }
            return lastPage?.pagination.current_page + 1;
        },
        getPreviousPageParam: (firstPage) => {
            if ((firstPage?.pagination?.current_page ?? 1) <= 1) {
                return undefined;
            }
            return firstPage?.pagination?.current_page - 1;
        },
        select: (data) => {
            return data.pages.flatMap((page) => page.candidates);
        },
        enabled: options?.enabled ?? true,
    });
};

export const useInvalidateCandidatesQuery = (companyId: number) => {
    const queryClient = useQueryClient();

    const invalidatePagination = () => {
        queryClient.invalidateQueries({
            queryKey: ['candidates-pagination', companyId],
            exact: false,
        });
    };

    return invalidatePagination;
};

export const useInterviewAddresses = (companyId: number, date?: string) => {
    return useQuery({
        queryKey: ['candidates-addresses', companyId, date],
        queryFn: () => getInterviewAddresses(companyId, date),
        enabled: !!companyId && !!date, // Only run query if both companyId and date exist
        retry: (failureCount, error) => {
            // Don't retry if it's a "no questions found" scenario
            if (error?.message?.includes('Invalid data structure')) {
                return false;
            }
            return failureCount < 2;
        },
    });
};
