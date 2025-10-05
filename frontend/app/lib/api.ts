const API_BASE_URL = 'https://todo-app-zeb7.onrender.com/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    
    if (!response.ok) {
      // 認証エラーの場合は自動的にログアウト
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // 認証ページにリダイレクト
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
      }
      return { error: data.error || 'An error occurred' };
    }
    
    return { data, message: data.message };
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(body)
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(body)
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  }
}

export const apiClient = new ApiClient();

// Types
export interface User {
  id: string;
  email: string;
  name?: string;
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type Status = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Group {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdBy: string;
  creator: User;
  members: GroupMember[];
  todos: Todo[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: GroupRole;
  joinedAt: string;
  user: User;
  group: Group;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean; // 既存の互換性のため残す
  status: Status;
  priority: Priority;
  createdBy: string; // 作成者
  assignedTo?: string; // 担当者（任意）
  groupId: string; // 所属グループ
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

// Auth API
export const authApi = {
  register: async (data: { email: string; password: string; name?: string }) => {
    return apiClient.post<AuthResponse>('/auth/register', data);
  },

  login: async (data: { email: string; password: string }) => {
    return apiClient.post<AuthResponse>('/auth/login', data);
  },

  logout: async () => {
    return apiClient.post('/auth/logout');
  }
};

// Group API
export const groupApi = {
  getAll: async () => {
    return apiClient.get<Group[]>('/groups');
  },

  getById: async (id: string) => {
    return apiClient.get<Group>(`/groups/${id}`);
  },

  create: async (data: { name: string; description?: string; color?: string }) => {
    return apiClient.post<Group>('/groups', data);
  },

  update: async (id: string, data: { name?: string; description?: string; color?: string }) => {
    return apiClient.put<Group>(`/groups/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete(`/groups/${id}`);
  },

  inviteMember: async (groupId: string, data: { email: string; role?: GroupRole }) => {
    return apiClient.post<GroupMember>(`/groups/${groupId}/invite`, data);
  },

  removeMember: async (groupId: string, memberId: string) => {
    return apiClient.delete(`/groups/${groupId}/members/${memberId}`);
  },

  updateMemberRole: async (groupId: string, memberId: string, role: GroupRole) => {
    return apiClient.put<GroupMember>(`/groups/${groupId}/members/${memberId}`, { role });
  }
};

// Todo API
export const todoApi = {
  getAll: async () => {
    return apiClient.get<Todo[]>('/todos');
  },

  create: async (data: { title: string; description?: string; priority?: Priority; status?: Status; groupId?: string; assignedTo?: string }) => {
    return apiClient.post<Todo>('/todos', data);
  },

  update: async (id: string, data: { title?: string; description?: string; completed?: boolean; priority?: Priority; status?: Status; assignedTo?: string }) => {
    return apiClient.put<Todo>(`/todos/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete(`/todos/${id}`);
  }
};
