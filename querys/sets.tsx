import {
    type QueryClient,
    QueryFilters,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import {
    type QuestionSet,
    type Set as SetData,
    getQuestionsSets,
    getSets,
    getGeneralSet,
} from '../lib/api';

export const useSetsData = (companyId: number) => {
    return useQuery({
        queryKey: ['sets', companyId],
        queryFn: () => getSets(companyId),
    });
};

export const useGeneralSetData = (companyId: number) => {
    return useQuery({
        queryKey: ['generalSet', companyId],
        queryFn: () => getGeneralSet(companyId),
        enabled: !!companyId, // Only run query if companyId exists
        retry: 2,
    });
};

export const useQuestionsSetsData = (companyId: number, setId: number) => {
    return useQuery({
        queryKey: ['questionsSets', companyId, setId],
        queryFn: () => getQuestionsSets(companyId, setId),
        enabled: !!setId && !!companyId, // Only run query if both setId and companyId exist
        retry: (failureCount, error) => {
            // Don't retry if it's a "no questions found" scenario
            if (error?.message?.includes('Invalid data structure')) {
                return false;
            }
            return failureCount < 2;
        },
    });
};

const updateQuestionsSetsDataCache = (
    queryClient: QueryClient,
    companyId: number,
    setId: number,
    updater: (prev: SetData[]) => SetData[]
) => {
    queryClient.setQueryData(['questionsSets', companyId, setId], updater);
};
const updateSetsDataCache = (
    queryClient: QueryClient,
    companyId: number,
    updater: (prev: QuestionSet[]) => QuestionSet[]
) => {
    queryClient.setQueryData(['sets', companyId], updater);
};
