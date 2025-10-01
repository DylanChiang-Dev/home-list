// 简单的内存缓存实现
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 100; // 最大缓存条目数

  set<T>(key: string, data: T, ttl: number = 60000): void {
    // 如果缓存已满,删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]?.[0];
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    const age = now - item.timestamp;

    // 检查是否过期
    if (age > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const now = Date.now();
    const age = now - item.timestamp;

    if (age > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // 删除所有以特定前缀开头的缓存
  clearByPrefix(prefix: string): void {
    const keys = Array.from(this.cache.keys()).filter(key => key.startsWith(prefix));
    keys.forEach(key => this.cache.delete(key));
  }

  // 获取缓存统计
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 导出单例
export const apiCache = new ApiCache();

// 生成缓存键
export function generateCacheKey(endpoint: string, params?: any): string {
  if (!params) return endpoint;
  return `${endpoint}:${JSON.stringify(params)}`;
}
