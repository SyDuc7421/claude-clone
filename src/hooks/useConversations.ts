import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsApi } from '@/lib/api/conversations';
import { CreateConversationRequest, UpdateConversationRequest } from '@/lib/types/api';

export const CONVERSATIONS_QUERY_KEY = ['conversations'];

export const useConversations = () => {
    return useQuery({
        queryKey: CONVERSATIONS_QUERY_KEY,
        queryFn: () => conversationsApi.getAll(),
    });
};

export const useConversation = (id: number | string) => {
    return useQuery({
        queryKey: [...CONVERSATIONS_QUERY_KEY, id],
        queryFn: () => conversationsApi.getById(id),
        enabled: !!id,
    });
};

export const useCreateConversationMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateConversationRequest) => conversationsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
        },
    });
};

export const useUpdateConversationMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number | string; data: UpdateConversationRequest }) =>
            conversationsApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: [...CONVERSATIONS_QUERY_KEY, variables.id] });
        },
    });
};

export const useDeleteConversationMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => conversationsApi.delete(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
            queryClient.removeQueries({ queryKey: [...CONVERSATIONS_QUERY_KEY, id] });
        },
    });
};
