import { apiClient } from './client';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../types/api';

export const authApi = {
    login: async (data: LoginRequest) => {
        const response = await apiClient.post<AuthResponse>('/auth/login', data);
        return response.data;
    },

    register: async (data: RegisterRequest) => {
        const response = await apiClient.post('/auth/register', data);
        return response.data;
    },

    logout: async () => {
        const response = await apiClient.post('/auth/logout');
        return response.data;
    },

    getMe: async () => {
        const response = await apiClient.get<User>('/auth/me');
        return response.data;
    }
};
