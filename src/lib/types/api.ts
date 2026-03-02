export interface Conversation {
    id: number;
    title: string;
    user_id?: number;
    created_at?: string;
    updated_at?: string;
    messages?: Message[];
    user?: User;
}

export interface Message {
    id: number;
    conversation_id: number;
    role: "user" | "assistant" | "system";
    content: string;
    created_at?: string;
    updated_at?: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    created_at?: string;
    updated_at?: string;
    conversations?: Conversation[];
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
}

export interface CreateConversationRequest {
    title: string;
}

export interface CreateMessageRequest {
    content: string;
    conversation_id: number;
    role: "user" | "assistant" | "system";
}

export interface LoginRequest {
    email: string;
    password?: string;
}

export interface RefreshRequest {
    refresh_token: string;
}

export interface RegisterRequest {
    email: string;
    name: string;
    password?: string;
}

export interface UpdateConversationRequest {
    title: string;
}

export interface UpdateMessageRequest {
    content: string;
}
