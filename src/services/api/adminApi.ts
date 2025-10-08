import { User } from '@types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AdminApiService {
    private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
        const url = `${API_BASE_URL}${endpoint}`;
        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    async makeAdmin(email: string): Promise<{ message: string; user: User }> {
        return this.makeRequest('/users/make-admin', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async removeAdmin(email: string): Promise<{ message: string; user: User }> {
        return this.makeRequest('/users/remove-admin', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async deleteUser(userId: string): Promise<{ message: string; deletedUser: Partial<User> }> {
        return this.makeRequest(`/users/${userId}`, {
            method: 'DELETE',
        });
    }

    async getUsers(): Promise<User[]> {
        return this.makeRequest('/users');
    }

    async getUserById(userId: string): Promise<User> {
        return this.makeRequest(`/users/${userId}`);
    }
}

export const adminApi = new AdminApiService();