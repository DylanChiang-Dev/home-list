// API配置管理
export interface ApiEndpoint {
  name: string;
  baseUrl: string;
  priority: number;
  healthCheck: string;
  timeout: number;
  retries: number;
}

// API端点配置（按优先级排序）
export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    name: 'Local Development',
    baseUrl: 'http://localhost:3001',
    priority: 1,
    healthCheck: '/health',
    timeout: 5000,
    retries: 2
  },
  {
    name: 'Cloudflare Workers (Primary)',
    baseUrl: 'https://home-list-api.zhangkaishen.workers.dev',
    priority: 2,
    healthCheck: '/health',
    timeout: 10000,
    retries: 3
  },
  {
    name: 'Mock Server',
    baseUrl: 'http://localhost:3002',
    priority: 3,
    healthCheck: '/health',
    timeout: 3000,
    retries: 1
  }
];

// 当前活跃的API端点
let currentEndpoint: ApiEndpoint = API_ENDPOINTS[0];
let endpointHealthStatus = new Map<string, boolean>();

// 健康检查函数
export async function checkEndpointHealth(endpoint: ApiEndpoint): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);
    
    const response = await fetch(`${endpoint.baseUrl}${endpoint.healthCheck}`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    const isHealthy = response.ok;
    endpointHealthStatus.set(endpoint.name, isHealthy);
    
    console.log(`[API Config] ${endpoint.name} 健康检查: ${isHealthy ? '✅' : '❌'}`);
    return isHealthy;
  } catch (error) {
    console.warn(`[API Config] ${endpoint.name} 健康检查失败:`, error);
    endpointHealthStatus.set(endpoint.name, false);
    return false;
  }
}

// 自动选择最佳端点
export async function selectBestEndpoint(): Promise<ApiEndpoint> {
  console.log('[API Config] 开始选择最佳API端点...');
  
  // 按优先级测试端点
  for (const endpoint of API_ENDPOINTS) {
    const isHealthy = await checkEndpointHealth(endpoint);
    if (isHealthy) {
      currentEndpoint = endpoint;
      console.log(`[API Config] 选择端点: ${endpoint.name} (${endpoint.baseUrl})`);
      return endpoint;
    }
  }
  
  // 如果所有端点都不可用，使用第一个作为默认值
  console.warn('[API Config] 所有端点都不可用，使用默认端点');
  currentEndpoint = API_ENDPOINTS[0];
  return currentEndpoint;
}

// 获取当前端点
export function getCurrentEndpoint(): ApiEndpoint {
  return currentEndpoint;
}

// 获取当前API基础URL
export function getCurrentApiBase(): string {
  return currentEndpoint.baseUrl;
}

// 切换到下一个可用端点
export async function switchToNextEndpoint(): Promise<ApiEndpoint> {
  console.log('[API Config] 切换到下一个端点...');
  
  const currentIndex = API_ENDPOINTS.findIndex(ep => ep.name === currentEndpoint.name);
  const remainingEndpoints = API_ENDPOINTS.slice(currentIndex + 1);
  
  for (const endpoint of remainingEndpoints) {
    const isHealthy = await checkEndpointHealth(endpoint);
    if (isHealthy) {
      currentEndpoint = endpoint;
      console.log(`[API Config] 切换到端点: ${endpoint.name}`);
      return endpoint;
    }
  }
  
  console.warn('[API Config] 没有可用的备用端点');
  return currentEndpoint;
}

// 获取端点健康状态
export function getHealthStatus(): Map<string, boolean> {
  return new Map(endpointHealthStatus);
}

// 重置端点健康状态
export function resetHealthStatus(): void {
  endpointHealthStatus.clear();
  console.log('[API Config] 端点健康状态已重置');
}

// 初始化API配置
export async function initializeApiConfig(): Promise<void> {
  console.log('[API Config] 初始化API配置...');
  await selectBestEndpoint();
}

// 导出默认配置
export default {
  endpoints: API_ENDPOINTS,
  getCurrentEndpoint,
  getCurrentApiBase,
  selectBestEndpoint
};