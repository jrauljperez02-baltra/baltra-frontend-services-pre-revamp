'use client';

import { type ScreeningStatsData, getScreeningStats } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useScreeningStats(
    companyId: number,
    startDate?: string,
    endDate?: string
) {
    return useQuery({
        queryKey: ['screening-stats', companyId, startDate, endDate],
        queryFn: () => getScreeningStats(companyId, startDate, endDate),
        enabled: !!companyId,
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos
        refetchOnWindowFocus: false,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
}

export function useInvalidateScreeningStats() {
    const queryClient = useQueryClient();

    return (companyId: string) => {
        queryClient.invalidateQueries({
            queryKey: ['screening-stats', companyId],
        });
    };
}
