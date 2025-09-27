// 用户相关类型
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // 密码不应该在响应中返回
  familyId?: string;
  role: 'admin' | 'member';
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
}

export interface UserLoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// 家庭相关类型
export interface Family {
  id: string;
  name: string;
  description?: string;
  adminId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyCreateInput {
  name: string;
  description?: string;
}

export interface FamilyUpdateInput {
  name?: string;
  description?: string;
}

export interface FamilyWithMembers extends Family {
  adminName?: string;
  members: User[];
}

// 任务相关类型
export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedBy: string;
  familyId: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  assignedTo?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface TaskWithAssignee extends Task {
  assigneeName?: string;
  assignedByName?: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

// 邀请码相关类型
export interface InviteCode {
  id: string;
  code: string;
  familyId: string;
  usedBy?: string;
  expiresAt: string;
  createdAt: string;
}

export interface InviteCodeCreateInput {
  expiresIn?: number; // 天数，默认7天
}

export interface InviteCodeWithDetails extends InviteCode {
  familyName?: string;
  usedByName?: string;
  isExpired: boolean;
  isUsed: boolean;
}

// JWT相关类型
export interface JWTPayload {
  userId: string;
  email: string;
  familyId?: string;
  role: 'admin' | 'member';
  iat?: number;
  exp?: number;
}

// API响应类型
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}

export interface LoginResponse {
  message: string;
  user: Omit<User, 'password'>;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

// 数据迁移相关类型
export interface LocalStorageData {
  users?: User[];
  families?: Family[];
  tasks?: Task[];
  inviteCodes?: InviteCode[];
}

export interface MigrationResult {
  success: boolean;
  message: string;
  migratedCounts?: {
    users: number;
    families: number;
    tasks: number;
    inviteCodes: number;
  };
  errors?: string[];
}

// 环境变量类型
export interface Bindings {
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
}

// 分页相关类型
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 错误类型
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// 验证相关类型
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// 统计相关类型
export interface FamilyStats {
  memberCount: number;
  taskStats: TaskStats;
  activeInviteCodes: number;
}

// 搜索和过滤类型
export interface TaskFilters {
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  assignedBy?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
}

export interface UserFilters {
  role?: 'admin' | 'member';
  familyId?: string;
  search?: string;
}

// 通知相关类型
export interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'task_completed' | 'family_invite' | 'role_changed';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export interface NotificationCreateInput {
  userId: string;
  type: Notification['type'];
  title: string;
  message: string;
  data?: any;
}