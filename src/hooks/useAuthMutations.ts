import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { LoginRequest, RegisterRequest } from '@/lib/types/api';

export const useLoginMutation = () => {
    return useMutation({
        mutationFn: (data: LoginRequest) => authApi.login(data),
    });
};

export const useRegisterMutation = () => {
    return useMutation({
        mutationFn: (data: RegisterRequest) => authApi.register(data),
    });
};

export const useLogoutMutation = () => {
    return useMutation({
        mutationFn: () => authApi.logout(),
    });
};
