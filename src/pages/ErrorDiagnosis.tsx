import React, { useState, useEffect } from 'react';
import errorMonitor, { ErrorLog } from '../utils/errorMonitor';

const ErrorDiagnosis: React.FC = () => {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const updateErrors = () => {
      setErrors(errorMonitor.getErrors());
    };

    updateErrors();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(updateErrors, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const filteredErrors = errors.filter(error => {
    if (filter === 'all') return true;
    return error.type === filter;
  });

  const errorStats = {
    total: errors.length,
    network: errors.filter(e => e.type === 'network').length,
    abort: errors.filter(e => e.type === 'abort').length,
    fetch: errors.filter(e => e.type === 'fetch').length,
    general: errors.filter(e => e.type === 'general').length,
  };

  const handleClearErrors = () => {
    errorMonitor.clearErrors();
    setErrors([]);
  };

  const handleExportErrors = () => {
    errorMonitor.exportErrors();
  };

  const handleTestError = () => {
    // 触发一个测试错误 - 使用无效的 URL
    fetch('https://invalid-domain-that-does-not-exist-12345.com/api/test', {
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      console.log('测试网络错误已触发:', error);
    });
  };

  const handleTestAbort = () => {
    // 触发一个取消错误
    const controller = new AbortController();
    const token = localStorage.getItem('authToken');

    fetch('https://home-list-api.dylan-chiang.workers.dev/api/tasks', {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }).catch(error => {
      console.log('测试取消错误已触发:', error);
    });

    // 立即取消请求
    setTimeout(() => controller.abort(), 10);
  };

  const getErrorTypeColor = (type: string) => {
    const colors = {
      network: 'bg-red-100 text-red-800',
      abort: 'bg-yellow-100 text-yellow-800',
      fetch: 'bg-orange-100 text-orange-800',
      general: 'bg-gray-100 text-gray-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getErrorTypeIcon = (type: string) => {
    const icons = {
      network: '🌐',
      abort: '🚫',
      fetch: '📡',
      general: '⚠️',
    };
    return icons[type as keyof typeof icons] || '❓';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
            🔍 实时错误诊断
          </h1>
          
          {/* 统计面板 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{errorStats.total}</div>
              <div className="text-sm text-blue-500">总错误数</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{errorStats.network}</div>
              <div className="text-sm text-red-500">网络错误</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{errorStats.abort}</div>
              <div className="text-sm text-yellow-500">请求取消</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{errorStats.fetch}</div>
              <div className="text-sm text-orange-500">获取失败</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-600">{errorStats.general}</div>
              <div className="text-sm text-gray-500">一般错误</div>
            </div>
          </div>
          
          {/* 控制面板 */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">所有错误</option>
              <option value="network">网络错误</option>
              <option value="abort">请求取消</option>
              <option value="fetch">获取失败</option>
              <option value="general">一般错误</option>
            </select>
            
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">自动刷新</span>
            </label>
            
            <button 
              onClick={handleClearErrors}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              清除错误
            </button>
            
            <button 
              onClick={handleExportErrors}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              导出报告
            </button>
            
            <button 
              onClick={handleTestError}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              测试网络错误
            </button>
            
            <button 
              onClick={handleTestAbort}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              测试取消错误
            </button>
          </div>
          
          {/* 快捷键提示 */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">快捷键:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div><kbd className="px-2 py-1 bg-gray-200 rounded">Ctrl+Shift+E</kbd> 在控制台显示错误报告</div>
              <div><kbd className="px-2 py-1 bg-gray-200 rounded">Ctrl+Shift+C</kbd> 清除错误日志</div>
              <div><kbd className="px-2 py-1 bg-gray-200 rounded">Ctrl+Shift+D</kbd> 导出错误日志</div>
            </div>
          </div>
        </div>
        
        {/* 错误列表 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            错误日志 ({filteredErrors.length})
          </h2>
          
          {filteredErrors.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🎉</div>
              <div className="text-lg">暂无错误记录</div>
              <div className="text-sm mt-2">系统运行正常</div>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredErrors.map((error, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getErrorTypeIcon(error.type)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getErrorTypeColor(error.type)}`}>
                        {error.type}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(error.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {error.status && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm font-mono">
                        HTTP {error.status}
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <div className="font-medium text-gray-800">{error.message}</div>
                    {error.url && (
                      <div className="text-sm text-blue-600 mt-1 font-mono break-all">
                        {error.url}
                      </div>
                    )}
                  </div>
                  
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                        查看堆栈信息
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto text-gray-600">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 解决方案建议 */}
        {errorStats.abort > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">🚫 ERR_ABORTED 解决建议</h3>
            <ul className="text-sm text-yellow-700 space-y-2">
              <li>• 检查是否有重复的请求取消操作</li>
              <li>• 确保在组件卸载时正确清理AbortController</li>
              <li>• 避免在短时间内发起大量请求</li>
              <li>• 使用防抖(debounce)控制请求频率</li>
              <li>• 检查网络连接状况和API服务状态</li>
            </ul>
          </div>
        )}
        
        {errorStats.fetch > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-orange-800 mb-3">📡 Failed to fetch 解决建议</h3>
            <ul className="text-sm text-orange-700 space-y-2">
              <li>• 检查API服务器是否正常运行</li>
              <li>• 验证CORS配置是否正确</li>
              <li>• 检查网络连接和DNS解析</li>
              <li>• 实现请求重试机制</li>
              <li>• 考虑使用备用API端点</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorDiagnosis;