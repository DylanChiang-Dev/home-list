import { getCurrentApiBase, switchToNextEndpoint, getCurrentEndpoint } from './apiConfig';

// API配置（现在从配置管理器获取）
function getApiBase(): string {
  return getCurrentApiBase();
}

export const API_BASE_URL = getApiBase();

// API端点（只包含路径，不包含base URL）
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    PROFILE: '/api/auth/profile',
    UPDATE: '/api/auth/profile',
  },
  // 任务相关
  TASKS: {
    LIST: '/api/tasks',
    CREATE: '/api/tasks',
    DETAIL: (id: string) => `/api/tasks/${id}`,
    UPDATE: (id: string) => `/api/tasks/${id}`,
    DELETE: (id: string) => `/api/tasks/${id}`,
    COMPLETE: (id: string) => `/api/tasks/${id}/complete`,
  },
  // 家庭管理相关
  FAMILY: {
    CREATE: '/api/family',
    JOIN: '/api/family/join',
    MEMBERS: '/api/family/members',
    INVITE: '/api/family/invite',
    LEAVE: '/api/family/leave',
    INVITES: '/api/family/invites',
    DELETE_INVITE: (id: string) => `/api/family/invites/${id}`,
  },
  // 数据迁移
  MIGRATION: {
    IMPORT: '/api/migration/import',
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

// 用户信息类型
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  familyId: string;
  role: 'member' | 'admin';
  avatar?: string;
  createdAt: string;
}

// 登录响应类型
export interface LoginResponse {
  user: ApiUser;
  token: string;
}

// 注册响应类型
export interface RegisterResponse {
  user: ApiUser;
  token: string;
}

// 用户信息响应类型
export interface UserMeResponse {
  user: ApiUser;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

// 重试配置
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  timeout: number;
  enableEndpointSwitching?: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1秒
  maxDelay: 10000, // 10秒
  timeout: 30000, // 30秒超时
  enableEndpointSwitching: true,
};

// 延迟函数
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 计算重试延迟（指数退避）
const calculateRetryDelay = (attempt: number, baseDelay: number, maxDelay: number): number => {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // 添加10%的随机抖动
  return Math.min(exponentialDelay + jitter, maxDelay);
};

// 检查是否应该重试
const shouldRetry = (error: any, attempt: number, maxRetries: number): boolean => {
  if (attempt >= maxRetries) return false;
  
  // 网络错误应该重试
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return true;
  }
  
  // AbortError（超时）应该重试
  if (error.name === 'AbortError') {
    return true;
  }
  
  // 5xx服务器错误应该重试
  if (error.status >= 500) {
    return true;
  }
  
  // 429 Too Many Requests应该重试
  if (error.status === 429) {
    return true;
  }
  
  return false;
};

// 带重试的API请求封装（带端点切换）
export const apiRequest = async <T>(
  url: string,
  options: RequestInit = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<ApiResponse<T>> => {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: any;
  let hasTriedEndpointSwitch = false;
  
  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      const currentEndpoint = getCurrentEndpoint();
      console.log(`=== API Request Debug (Attempt ${attempt}) ===`);
      console.log('Making API request to:', url);
      console.log('Using current endpoint:', currentEndpoint.name);
      console.log('Current API base:', getApiBase());
      console.log('Environment VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
      console.log('Request options:', options);
      console.log('Request headers:', getAuthHeaders());
      
      // 创建AbortController用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`Request timeout after ${config.timeout}ms`);
        controller.abort();
      }, config.timeout);
      
      const response = await fetch(url, {
        headers: getAuthHeaders(),
        signal: controller.signal,
        ...options,
      });
      
      clearTimeout(timeoutId);

      // 检查响应内容类型
      const contentType = response.headers.get('content-type');
      console.log('Response content-type:', contentType);
      console.log('Response status:', response.status);
      console.log('Response URL:', response.url);
      
      // 如果不是JSON响应，说明可能是HTML页面
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received non-JSON response:', text.substring(0, 200));
        return { 
          success: false, 
          error: `API端点返回了HTML页面而不是JSON。请检查API URL配置: ${url}`, 
          status: response.status 
        };
      }

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Request successful on attempt ${attempt}`);
        return { success: true, data, status: response.status };
      } else {
        const errorResponse = { 
          success: false, 
          error: data.message || data.error || '请求失败', 
          status: response.status 
        };
        
        // 检查是否应该重试
        if (shouldRetry({ status: response.status }, attempt, config.maxRetries)) {
          console.log(`⚠️ Request failed with status ${response.status}, will retry...`);
          lastError = errorResponse;
          continue;
        }
        
        return errorResponse;
      }
    } catch (error) {
      console.error(`❌ API request failed on attempt ${attempt}:`, error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        url: url
      });
      
      lastError = error;
      
      const isNetworkError = error.name === 'AbortError' || 
                            error.message.includes('Failed to fetch') ||
                            error.message.includes('ENOTFOUND');
      
      // 如果是网络错误且启用端点切换，尝试切换端点
      if (config.enableEndpointSwitching && isNetworkError && !hasTriedEndpointSwitch && attempt < config.maxRetries + 1) {
        console.log('[API] 检测到网络错误，尝试切换端点...');
        try {
          await switchToNextEndpoint();
          hasTriedEndpointSwitch = true;
          console.log(`[API] 已切换到新端点: ${getApiBase()}`);
          // 重新构建URL
          const newUrl = url.replace(/^https?:\/\/[^\/]+/, getApiBase());
          url = newUrl;
          // 给新端点一个机会，不增加attempt计数
          attempt = Math.max(1, attempt - 1);
          continue;
        } catch (switchError) {
          console.warn('[API] 端点切换失败:', switchError);
        }
      }
      
      // 检查是否应该重试
      if (shouldRetry(error, attempt, config.maxRetries)) {
        const retryDelay = calculateRetryDelay(attempt, config.baseDelay, config.maxDelay);
        console.log(`🔄 Retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${config.maxRetries + 1})`);
        await delay(retryDelay);
        continue;
      }
      
      // 不重试，返回错误
      if (error.name === 'AbortError') {
        return { 
          success: false, 
          error: `请求超时（${config.timeout / 1000}秒）。请检查网络连接或稍后重试。`, 
          status: 0 
        };
      }
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: `网络连接失败，无法访问API服务器。请检查网络连接或稍后重试。URL: ${url}`, 
          status: 0 
        };
      }
      
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return { success: false, error: 'API返回了无效的JSON响应，可能是HTML页面', status: 0 };
      }
      
      return { 
        success: false, 
        error: `网络错误：${error.message}。请稍后重试。`, 
        status: 0 
      };
    }
  }
  
  // 所有重试都失败了
  console.error(`💥 All ${config.maxRetries + 1} attempts failed`);
  
  if (lastError instanceof Error) {
    if (lastError.name === 'AbortError') {
      return { 
        success: false, 
        error: `请求超时，已重试${config.maxRetries}次。请检查网络连接。`, 
        status: 0 
      };
    }
    
    if (lastError.message.includes('Failed to fetch')) {
      return { 
        success: false, 
        error: `网络连接失败，已重试${config.maxRetries}次。请检查网络连接或稍后重试。`, 
        status: 0 
      };
    }
  }
  
  return { 
    success: false, 
    error: `请求失败，已重试${config.maxRetries}次。请稍后重试。`, 
    status: lastError?.status || 0 
  };
};

// 快速重试配置（用于关键API调用）
const FAST_RETRY_CONFIG: Partial<RetryConfig> = {
  maxRetries: 2,
  baseDelay: 500,
  timeout: 15000, // 15秒超时
  enableEndpointSwitching: true,
};

// 慢速重试配置（用于非关键API调用）
const SLOW_RETRY_CONFIG: Partial<RetryConfig> = {
  maxRetries: 1,
  baseDelay: 2000,
  timeout: 45000, // 45秒超时
  enableEndpointSwitching: true,
};

export const apiGet = async <T>(
  endpoint: string, 
  options: { fast?: boolean } = {}
): Promise<ApiResponse<T>> => {
  const url = `${getApiBase()}${endpoint}`;
  const retryConfig = options.fast ? FAST_RETRY_CONFIG : DEFAULT_RETRY_CONFIG;
  return apiRequest<T>(url, { method: 'GET' }, retryConfig);
};

export const apiPost = async <T>(
  endpoint: string,
  data?: any,
  options: { fast?: boolean } = {}
): Promise<ApiResponse<T>> => {
  const url = `${getApiBase()}${endpoint}`;
  const retryConfig = options.fast ? FAST_RETRY_CONFIG : DEFAULT_RETRY_CONFIG;
  return apiRequest<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  }, retryConfig);
};

export const apiPut = async <T>(
  endpoint: string,
  data?: any,
  options: { fast?: boolean } = {}
): Promise<ApiResponse<T>> => {
  const url = `${getApiBase()}${endpoint}`;
  const retryConfig = options.fast ? FAST_RETRY_CONFIG : DEFAULT_RETRY_CONFIG;
  return apiRequest<T>(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  }, retryConfig);
};

export const apiDelete = async <T>(
  endpoint: string,
  options: { fast?: boolean } = {}
): Promise<ApiResponse<T>> => {
  const url = `${getApiBase()}${endpoint}`;
  const retryConfig = options.fast ? FAST_RETRY_CONFIG : DEFAULT_RETRY_CONFIG;
  return apiRequest<T>(url, { method: 'DELETE' }, retryConfig);
};

// 健康检查API（用于测试连接）
export const apiHealthCheck = async (): Promise<ApiResponse<{ status: string }>> => {
  try {
    const response = await apiGet<{ status: string }>('/', { fast: true });
    return response;
  } catch (error) {
    return {
      success: false,
      error: 'API健康检查失败',
      status: 0
    };
  }
};

// 批量API调用（带错误恢复）
export const apiBatch = async <T>(
  requests: Array<() => Promise<ApiResponse<T>>>
): Promise<Array<ApiResponse<T>>> => {
  const results: Array<ApiResponse<T>> = [];
  
  for (const request of requests) {
    try {
      const result = await request();
      results.push(result);
      
      // 如果请求失败，添加延迟避免过快的后续请求
      if (!result.success) {
        await delay(1000);
      }
    } catch (error) {
      results.push({
        success: false,
        error: `批量请求失败: ${error.message}`,
        status: 0
      });
    }
  }
  
  return results;
};