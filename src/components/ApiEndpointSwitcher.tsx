import React, { useState, useEffect } from 'react';
import { Settings, Wifi, WifiOff, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { getCurrentEndpoint, switchToNextEndpoint, getHealthStatus, initializeApiConfig, API_ENDPOINTS } from '../utils/apiConfig';
import type { ApiEndpoint } from '../utils/apiConfig';

interface ApiEndpointSwitcherProps {
  className?: string;
}

export const ApiEndpointSwitcher: React.FC<ApiEndpointSwitcherProps> = ({ className = '' }) => {
  const [currentEndpoint, setCurrentEndpoint] = useState<ApiEndpoint | null>(null);
  const [healthStatus, setHealthStatus] = useState<Record<string, boolean>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // 加载当前端点和健康状态
  const loadStatus = async () => {
    try {
      const endpoint = getCurrentEndpoint();
      setCurrentEndpoint(endpoint);
      
      const status = getHealthStatus();
      setHealthStatus(status);
      
      // 获取最后检查时间
      const lastCheckTime = localStorage.getItem('api_last_health_check');
      if (lastCheckTime) {
        setLastCheck(new Date(lastCheckTime));
      }
    } catch (error) {
      console.error('加载API状态失败:', error);
    }
  };

  // 检查所有端点健康状态
  const checkAllEndpoints = async () => {
    setIsChecking(true);
    try {
      await initializeApiConfig();
      await loadStatus();
      setLastCheck(new Date());
    } catch (error) {
      console.error('检查端点健康状态失败:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // 切换端点
  const handleSwitchEndpoint = async () => {
    try {
      await switchToNextEndpoint();
      await loadStatus();
      setIsOpen(false);
      
      // 刷新页面以应用新的API端点
      window.location.reload();
    } catch (error) {
      console.error('切换端点失败:', error);
    }
  };

  // 获取端点状态图标
  const getStatusIcon = (endpointName: string) => {
    const isHealthy = healthStatus[endpointName];
    if (isHealthy === undefined) {
      return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
    return isHealthy ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  // 获取端点状态文本
  const getStatusText = (endpointName: string) => {
    const isHealthy = healthStatus[endpointName];
    if (isHealthy === undefined) return '未知';
    return isHealthy ? '正常' : '异常';
  };

  // 获取端点状态颜色
  const getStatusColor = (endpointName: string) => {
    const isHealthy = healthStatus[endpointName];
    if (isHealthy === undefined) return 'text-gray-500';
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };

  // 组件挂载时加载状态
  useEffect(() => {
    loadStatus();
  }, []);

  if (!currentEndpoint) {
    return null;
  }

  const currentIsHealthy = healthStatus[currentEndpoint.name];

  return (
    <div className={`relative ${className}`}>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
          currentIsHealthy 
            ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
            : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
        }`}
        title={`当前API端点: ${currentEndpoint.name} (${getStatusText(currentEndpoint.name)})`}
      >
        {currentIsHealthy ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        <span className="text-sm font-medium">{currentEndpoint.name}</span>
        <Settings className="w-4 h-4" />
      </button>

      {/* 下拉面板 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* 头部 */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">API端点管理</h3>
              <button
                onClick={checkAllEndpoints}
                disabled={isChecking}
                className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                title="检查所有端点健康状态"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? '检查中...' : '刷新'}
              </button>
            </div>
            {lastCheck && (
              <p className="text-xs text-gray-500 mt-1">
                最后检查: {lastCheck.toLocaleString()}
              </p>
            )}
          </div>

          {/* 端点列表 */}
          <div className="p-2">
            {API_ENDPOINTS.map((endpoint) => {
              const isActive = endpoint.name === currentEndpoint.name;
              const isHealthy = healthStatus[endpoint.name];
              
              return (
                <button
                  key={endpoint.name}
                  onClick={() => handleSwitchEndpoint()}
                  disabled={isActive}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  {/* 状态图标 */}
                  <div className="flex-shrink-0">
                    {getStatusIcon(endpoint.name)}
                  </div>
                  
                  {/* 端点信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${
                        isActive ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {endpoint.name}
                      </span>
                      {isActive && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                          当前
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {endpoint.baseUrl}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs ${getStatusColor(endpoint.name)}`}>
                        状态: {getStatusText(endpoint.name)}
                      </span>
                      {endpoint.description && (
                        <span className="text-xs text-gray-400">
                          • {endpoint.description}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 说明 */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-600">
              💡 切换端点后页面将自动刷新以应用新配置
            </p>
            <p className="text-xs text-gray-600 mt-1">
              🔄 系统会自动选择最佳可用端点
            </p>
          </div>
        </div>
      )}

      {/* 点击外部关闭 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ApiEndpointSwitcher;