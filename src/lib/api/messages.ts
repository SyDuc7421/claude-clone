import { apiClient } from './client';
import { Message, CreateMessageRequest, UpdateMessageRequest } from '../types/api';

export const messagesApi = {
    getByConversationId: async (conversationId: number | string) => {
        const response = await apiClient.get<Message[]>('/messages', {
            params: { conversation_id: conversationId }
        });
        return response.data;
    },

    getById: async (id: number | string) => {
        const response = await apiClient.get<Message>(`/messages/${id}`);
        return response.data;
    },

    create: async (data: CreateMessageRequest) => {
        const response = await apiClient.post<Message>('/messages', data);
        return response.data;
    },

    update: async (id: number | string, data: UpdateMessageRequest) => {
        const response = await apiClient.put<Message>(`/messages/${id}`, data);
        return response.data;
    },

    delete: async (id: number | string) => {
        const response = await apiClient.delete(`/messages/${id}`);
        return response.data;
    }
};
