// 实时错误监控工具
type ErrorLog = {
  timestamp: string;
  type: 'network' | 'abort' | 'fetch' | 'general';
  message: string;
  url?: string;
  status?: number;
  stack?: string;
};

class ErrorMonitor {
  private errors: ErrorLog[] = [];
  private maxErrors = 100;
  private isMonitoring = false;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // 监听全局错误
    window.addEventListener('error', (event) => {
      this.logError({
        timestamp: new Date().toISOString(),
        type: 'general',
        message: event.error?.message || event.message || '未知错误',
        stack: event.error?.stack,
      });
    });

    // 监听未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        timestamp: new Date().toISOString(),
        type: 'general',
        message: `未处理的Promise拒绝: ${event.reason}`,
        stack: event.reason?.stack,
      });
    });

    // 拦截fetch请求
    this.interceptFetch();

    console.log('🔍 错误监控已启动');
  }

  private interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [url, options] = args;
      const startTime = Date.now();
      
      try {
        console.log(`🌐 发起请求: ${url}`);
        
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        if (!response.ok) {
          this.logError({
            timestamp: new Date().toISOString(),
            type: 'network',
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: url.toString(),
            status: response.status,
          });
          
          console.error(`❌ 请求失败: ${url} - HTTP ${response.status} (${duration}ms)`);
        } else {
          console.log(`✅ 请求成功: ${url} - HTTP ${response.status} (${duration}ms)`);
        }
        
        return response;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        // 检测ERR_ABORTED错误
        if (error.name === 'AbortError') {
          this.logError({
            timestamp: new Date().toISOString(),
            type: 'abort',
            message: `请求被取消: ${error.message}`,
            url: url.toString(),
            stack: error.stack,
          });
          
          console.error(`🚫 ERR_ABORTED: ${url} - 请求被取消 (${duration}ms)`);
          console.error('取消原因:', error);
        } else if (error.message.includes('Failed to fetch')) {
          this.logError({
            timestamp: new Date().toISOString(),
            type: 'fetch',
            message: `网络请求失败: ${error.message}`,
            url: url.toString(),
            stack: error.stack,
          });
          
          console.error(`🌐 Failed to fetch: ${url} - 网络连接失败 (${duration}ms)`);
          console.error('网络错误详情:', error);
        } else {
          this.logError({
            timestamp: new Date().toISOString(),
            type: 'network',
            message: `请求异常: ${error.message}`,
            url: url.toString(),
            stack: error.stack,
          });
          
          console.error(`💥 请求异常: ${url} - ${error.message} (${duration}ms)`);
          console.error('异常详情:', error);
        }
        
        throw error;
      }
    };
  }

  private logError(error: ErrorLog) {
    this.errors.push(error);
    
    // 保持错误日志数量在限制内
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
    
    // 输出到控制台
    console.group(`🚨 错误记录 [${error.type}]`);
    console.log('时间:', error.timestamp);
    console.log('消息:', error.message);
    if (error.url) console.log('URL:', error.url);
    if (error.status) console.log('状态码:', error.status);
    if (error.stack) console.log('堆栈:', error.stack);
    console.groupEnd();
    
    // 如果是关键错误，显示用户友好的提示
    if (error.type === 'abort' || error.type === 'fetch') {
      this.showUserNotification(error);
    }
  }

  private showUserNotification(error: ErrorLog) {
    // 创建错误提示元素
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fed7d7;
      color: #742a2a;
      padding: 12px 16px;
      border-radius: 8px;
      border-left: 4px solid #e53e3e;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
    `;
    
    const errorTypeMap = {
      'abort': '请求被取消',
      'fetch': '网络连接失败',
      'network': '网络错误',
      'general': '系统错误'
    };
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">
        🚨 ${errorTypeMap[error.type] || '未知错误'}
      </div>
      <div style="font-size: 12px; opacity: 0.8;">
        ${error.message}
      </div>
      <div style="font-size: 11px; margin-top: 4px; opacity: 0.6;">
        ${new Date(error.timestamp).toLocaleTimeString()}
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // 5秒后自动移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  // 获取所有错误日志
  getErrors(): ErrorLog[] {
    return [...this.errors];
  }

  // 获取特定类型的错误
  getErrorsByType(type: ErrorLog['type']): ErrorLog[] {
    return this.errors.filter(error => error.type === type);
  }

  // 清除错误日志
  clearErrors() {
    this.errors = [];
    console.log('🧹 错误日志已清除');
  }

  // 生成错误报告
  generateReport(): string {
    const report = {
      总错误数: this.errors.length,
      错误类型统计: {
        网络错误: this.getErrorsByType('network').length,
        请求取消: this.getErrorsByType('abort').length,
        获取失败: this.getErrorsByType('fetch').length,
        一般错误: this.getErrorsByType('general').length,
      },
      最近错误: this.errors.slice(-10).map(error => ({
        时间: error.timestamp,
        类型: error.type,
        消息: error.message,
        URL: error.url,
        状态码: error.status,
      })),
    };
    
    return JSON.stringify(report, null, 2);
  }

  // 导出错误日志
  exportErrors(): void {
    const report = this.generateReport();
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    console.log('📄 错误报告已导出');
  }
}

// 创建全局错误监控实例
const errorMonitor = new ErrorMonitor();

// 暴露到全局对象，方便调试
(window as any).errorMonitor = errorMonitor;

// 添加快捷键支持
window.addEventListener('keydown', (event) => {
  // Ctrl+Shift+E 显示错误报告
  if (event.ctrlKey && event.shiftKey && event.key === 'E') {
    console.log('📊 错误监控报告:');
    console.log(errorMonitor.generateReport());
  }
  
  // Ctrl+Shift+C 清除错误日志
  if (event.ctrlKey && event.shiftKey && event.key === 'C') {
    errorMonitor.clearErrors();
  }
  
  // Ctrl+Shift+D 导出错误日志
  if (event.ctrlKey && event.shiftKey && event.key === 'D') {
    errorMonitor.exportErrors();
  }
});

export default errorMonitor;
export type { ErrorLog };