import type { ValidationResult, ValidationError, PaginationParams, PaginatedResponse } from '../models/types';

// 验证工具函数
export class Validator {
  static email(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static password(password: string): ValidationResult {
    const errors: ValidationError[] = [];
    
    if (!password) {
      errors.push({ field: 'password', message: '密码不能为空' });
    } else {
      if (password.length < 6) {
        errors.push({ field: 'password', message: '密码长度至少6位' });
      }
      if (password.length > 50) {
        errors.push({ field: 'password', message: '密码长度不能超过50位' });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static name(name: string): ValidationResult {
    const errors: ValidationError[] = [];
    
    if (!name || name.trim().length === 0) {
      errors.push({ field: 'name', message: '姓名不能为空' });
    } else {
      if (name.trim().length < 2) {
        errors.push({ field: 'name', message: '姓名长度至少2位' });
      }
      if (name.trim().length > 20) {
        errors.push({ field: 'name', message: '姓名长度不能超过20位' });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static familyName(name: string): ValidationResult {
    const errors: ValidationError[] = [];
    
    if (!name || name.trim().length === 0) {
      errors.push({ field: 'name', message: '家庭名称不能为空' });
    } else {
      if (name.trim().length < 2) {
        errors.push({ field: 'name', message: '家庭名称长度至少2位' });
      }
      if (name.trim().length > 30) {
        errors.push({ field: 'name', message: '家庭名称长度不能超过30位' });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static taskTitle(title: string): ValidationResult {
    const errors: ValidationError[] = [];
    
    if (!title || title.trim().length === 0) {
      errors.push({ field: 'title', message: '任务标题不能为空' });
    } else {
      if (title.trim().length < 2) {
        errors.push({ field: 'title', message: '任务标题长度至少2位' });
      }
      if (title.trim().length > 100) {
        errors.push({ field: 'title', message: '任务标题长度不能超过100位' });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static uuid(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  static date(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  static inviteCode(code: string): boolean {
    // 邀请码格式：8位大写字母和数字
    const codeRegex = /^[A-Z0-9]{8}$/;
    return codeRegex.test(code);
  }
}

// 格式化工具函数
export class Formatter {
  static date(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString();
  }

  static dateToLocal(date: Date | string, timezone = 'Asia/Shanghai'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('zh-CN', { timeZone: timezone });
  }

  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>"'&]/g, '');
  }

  static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}

// 分页工具函数
export class Paginator {
  static validateParams(params: PaginationParams): PaginationParams {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    
    return {
      page,
      limit,
      sortBy: params.sortBy || 'created_at',
      sortOrder: params.sortOrder === 'asc' ? 'asc' : 'desc'
    };
  }

  static buildResponse<T>(data: T[], total: number, params: PaginationParams): PaginatedResponse<T> {
    const { page, limit } = this.validateParams(params);
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  static getOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}

// 密码工具函数
export class PasswordUtils {
  static async hash(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hash(password);
    return passwordHash === hash;
  }

  static generate(length = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// 邀请码工具函数
export class InviteCodeUtils {
  static generate(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static isExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
  }

  static getExpirationDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }
}

// 错误处理工具函数
export class ErrorHandler {
  static isUniqueConstraintError(error: any): boolean {
    return error?.message?.includes('UNIQUE constraint failed') || 
           error?.code === 'SQLITE_CONSTRAINT_UNIQUE';
  }

  static isForeignKeyConstraintError(error: any): boolean {
    return error?.message?.includes('FOREIGN KEY constraint failed') || 
           error?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY';
  }

  static getConstraintField(error: any): string | null {
    if (!this.isUniqueConstraintError(error)) return null;
    
    const message = error.message || '';
    if (message.includes('email')) return 'email';
    if (message.includes('code')) return 'code';
    return null;
  }

  static formatConstraintError(error: any): string {
    const field = this.getConstraintField(error);
    
    switch (field) {
      case 'email':
        return '该邮箱已被注册';
      case 'code':
        return '邀请码已存在';
      default:
        return '数据冲突，请检查输入';
    }
  }
}

// 任务工具函数
export class TaskUtils {
  static isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  static getPriorityWeight(priority: 'low' | 'medium' | 'high'): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  static getStatusWeight(status: 'pending' | 'in_progress' | 'completed'): number {
    switch (status) {
      case 'pending': return 1;
      case 'in_progress': return 2;
      case 'completed': return 3;
      default: return 1;
    }
  }

  static buildSortClause(sortBy: string, sortOrder: 'asc' | 'desc'): string {
    const validSortFields = ['created_at', 'updated_at', 'due_date', 'priority', 'status', 'title'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    // 特殊处理优先级和状态排序
    if (field === 'priority') {
      return `CASE priority WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END ${order}`;
    }
    if (field === 'status') {
      return `CASE status WHEN 'completed' THEN 3 WHEN 'in_progress' THEN 2 ELSE 1 END ${order}`;
    }
    
    return `${field} ${order}`;
  }
}

// 通用工具函数
export class Utils {
  static generateId(): string {
    return crypto.randomUUID();
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static isValidJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  static omit<T extends Record<string, any>, K extends keyof T>(
    obj: T, 
    keys: K[]
  ): Omit<T, K> {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  }

  static pick<T extends Record<string, any>, K extends keyof T>(
    obj: T, 
    keys: K[]
  ): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  }

  static isEmpty(value: any): boolean {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}