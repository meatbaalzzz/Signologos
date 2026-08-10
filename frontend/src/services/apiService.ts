/**
 * Signologos — API service for REST endpoints.
 */

import { API_URL } from '../utils/constants';
import type { RoomCreatedResponse, RoomInfo, JoinRoomResponse, UserRole } from '../types';

class ApiService {
    private baseUrl: string;

    constructor(baseUrl: string = API_URL) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(path: string, options?: RequestInit): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail || `HTTP ${response.status}`);
        }

        return response.json();
    }

    /** Create a new room */
    async createRoom(): Promise<RoomCreatedResponse> {
        return this.request<RoomCreatedResponse>('/api/rooms', {
            method: 'POST',
        });
    }

    /** Get room info by code */
    async getRoom(code: string): Promise<RoomInfo> {
        return this.request<RoomInfo>(`/api/rooms/${code.toUpperCase()}`);
    }

    /** Join a room with a role */
    async joinRoom(code: string, role: UserRole, userId: string): Promise<JoinRoomResponse> {
        return this.request<JoinRoomResponse>(`/api/rooms/${code.toUpperCase()}/join`, {
            method: 'POST',
            body: JSON.stringify({ role, user_id: userId }),
        });
    }

    /** Health check */
    async health(): Promise<{ status: string }> {
        return this.request('/api/health');
    }
}

export const apiService = new ApiService();
