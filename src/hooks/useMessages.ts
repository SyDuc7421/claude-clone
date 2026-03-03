import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/lib/api/messages';
import { CreateMessageRequest, UpdateMessageRequest } from '@/lib/types/api';

export const MESSAGES_QUERY_KEY = ['messages'];

export const useMessages = (conversationId: number | string) => {
    return useQuery({
        queryKey: [MESSAGES_QUERY_KEY, 'conversation', conversationId],
        queryFn: () => messagesApi.getByConversationId(conversationId),
        enabled: !!conversationId,
    });
};

export const useMessage = (id: number | string) => {
    return useQuery({
        queryKey: [MESSAGES_QUERY_KEY, id],
        queryFn: () => messagesApi.getById(id),
        enabled: !!id,
    });
};

export const useCreateMessageMutation = () => {
    return useMutation({
        mutationFn: (data: CreateMessageRequest) => messagesApi.create(data),
    });
};

export const useUpdateMessageMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number | string; data: UpdateMessageRequest }) =>
            messagesApi.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: [MESSAGES_QUERY_KEY, 'conversation', data.conversation_id]
            });
            queryClient.invalidateQueries({ queryKey: [MESSAGES_QUERY_KEY, data.id] });
        },
    });
};

export const useDeleteMessageMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => messagesApi.delete(id),
        onSuccess: () => {
            // Invalidate all message queries since we don't know the conversation ID easily here
            queryClient.invalidateQueries({ queryKey: [MESSAGES_QUERY_KEY] });
        },
    });
};
