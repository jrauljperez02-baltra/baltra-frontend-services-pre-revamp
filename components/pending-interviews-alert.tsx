'use client';

import { useCompanyID } from '@/context/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { getGroupedCandidatesByState } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';

export function PendingInterviewsAlert() {
    const companyId = useCompanyID();

    const { data: groupedCandidates, isLoading } = useQuery({
        queryKey: ['grouped-candidates', companyId],
        queryFn: () => getGroupedCandidatesByState(companyId ?? 0),
        enabled: !!companyId && companyId > 0,
    });

    // Check if there are interviewed candidates
    const interviewedCount = useMemo(() => {
        if (!groupedCandidates || groupedCandidates.length === 0) {
            return 0;
        }

        const flattened: {
            interviewed?: Array<{ candidate_id: number }>;
        } = {};
        
        groupedCandidates.forEach((item) => {
            if (item.interviewed) flattened.interviewed = item.interviewed;
        });

        return flattened.interviewed?.length || 0;
    }, [groupedCandidates]);

    if (isLoading || interviewedCount === 0) {
        return null;
    }

    return (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-200">
                Candidatos Pendientes por Actualizar
            </AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                Tienes <span className="font-semibold">{interviewedCount}</span> candidato{interviewedCount !== 1 ? 's' : ''} entrevistado{interviewedCount !== 1 ? 's' : ''} pendiente{interviewedCount !== 1 ? 's' : ''} de actualizar su estado.
                <Link href="/contratados">
                    <Button
                        variant="link"
                        className="ml-2 h-auto p-0 text-yellow-700 dark:text-yellow-300 underline font-semibold"
                    >
                        Ir a Contrataciones
                    </Button>
                </Link>
            </AlertDescription>
        </Alert>
    );
}

