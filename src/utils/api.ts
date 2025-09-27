// API配置
export const API_BASE_URL = 'https://home-list-api.dylan-chiang.workers.dev';

// API端点
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    ME: `${API_BASE_URL}/api/auth/me`,
    PROFILE: `${API_BASE_URL}/api/auth/profile`,
  },
  // 任务相关
  TASKS: {
    LIST: `${API_BASE_URL}/api/tasks`,
    CREATE: `${API_BASE_URL}/api/tasks`,
    DETAIL: (id: string) => `${API_BASE_URL}/api/tasks/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/tasks/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/tasks/${id}`,
    COMPLETE: (id: string) => `${API_BASE_URL}/api/tasks/${id}/complete`,
  },
  // 家庭管理相关
  FAMILY: {
    CREATE: `${API_BASE_URL}/api/family/create`,
    JOIN: `${API_BASE_URL}/api/family/join`,
    MEMBERS: `${API_BASE_URL}/api/family/members`,
    INVITE: `${API_BASE_URL}/api/family/invite`,
    LEAVE: `${API_BASE_URL}/api/family/leave`,
  },
  // 数据迁移
  MIGRATION: {
    IMPORT: `${API_BASE_URL}/api/migration/import`,
  },
};

// 获取认证头
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

// API请求封装
export const apiRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      ...options,
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data, status: response.status };
    } else {
      return { success: false, error: data.message || data.error || '请求失败', status: response.status };
    }
  } catch (error) {
    console.error('API request failed:', error);
    return { success: false, error: '网络错误，请稍后重试', status: 0 };
  }
};

// GET请求
export const apiGet = <T>(url: string): Promise<ApiResponse<T>> => {
  return apiRequest<T>(url, { method: 'GET' });
};

// POST请求
export const apiPost = <T>(
  url: string,
  body?: any
): Promise<ApiResponse<T>> => {
  return apiRequest<T>(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
};

// PUT请求
export const apiPut = <T>(
  url: string,
  body?: any
): Promise<ApiResponse<T>> => {
  return apiRequest<T>(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
};

// DELETE请求
export const apiDelete = <T>(url: string): Promise<ApiResponse<T>> => {
  return apiRequest<T>(url, { method: 'DELETE' });
};