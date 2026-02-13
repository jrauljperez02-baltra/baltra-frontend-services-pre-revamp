import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type MessageTemplate, getMessageTemplates } from '../lib/api';

export const useMessageTemplates = (companyId: number) => {
    return useQuery({
        queryKey: ['message_templates'],
        queryFn: () => getMessageTemplates(companyId),
    });
};

export const useMapMessageTemplates = (companyId: number) => {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: ['message_templates'],
        queryFn: () => getMessageTemplates(companyId),
        initialData: [],
        select: (data) => {
            if (!data) return {};
            return data.reduce(
                (acc, template) => {
                    acc[template.keyword] = template;
                    return acc;
                },
                {} as Record<string, MessageTemplate>
            );
        },
    });
};
