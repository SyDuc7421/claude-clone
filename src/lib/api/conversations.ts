import { apiClient } from './client';
import { Conversation, CreateConversationRequest, UpdateConversationRequest } from '../types/api';

export const conversationsApi = {
    getAll: async () => {
        const response = await apiClient.get<Conversation[]>('/conversations');
        return response.data;
    },

    getById: async (id: number | string) => {
        const response = await apiClient.get<Conversation>(`/conversations/${id}`);
        return response.data;
    },

    create: async (data: CreateConversationRequest) => {
        const response = await apiClient.post<Conversation>('/conversations', data);
        return response.data;
    },

    update: async (id: number | string, data: UpdateConversationRequest) => {
        const response = await apiClient.put<Conversation>(`/conversations/${id}`, data);
        return response.data;
    },

    delete: async (id: number | string) => {
        const response = await apiClient.delete(`/conversations/${id}`);
        return response.data;
    }
};
