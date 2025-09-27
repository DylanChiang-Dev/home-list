export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  type: 'regular' | 'long_term' | 'recurring';
  assigneeId: string;
  creatorName?: string;
  assigneeName?: string;
  completerName?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  dueDate?: string;
  recurringRule?: RecurringRule;
}

export interface RecurringRule {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // 间隔天数/周数/月数/年数
  endDate?: string; // 结束日期
  daysOfWeek?: number[]; // 周几重复 (0-6, 0为周日)
  daysOfMonth?: number[]; // 每月第几天 (1-31)
  monthsOfYear?: number[]; // 每年第几月 (1-12)
  datesOfYear?: { month: number; day: number }[]; // 每年的特定日期
}

export interface TaskFilter {
  status: 'all' | 'pending' | 'in_progress' | 'completed';
  priority: 'all' | 'high' | 'medium' | 'low';
  type: 'all' | 'regular' | 'long_term' | 'recurring';
  assignee: 'all' | string;
}

export const TaskTypeLabels = {
  regular: '普通任务',
  long_term: '长期任务',
  recurring: '重复任务'
} as const;

export const TaskStatusLabels = {
  pending: '待完成',
  in_progress: '进行中',
  completed: '已完成'
} as const;

export const TaskPriorityLabels = {
  high: '高',
  medium: '中',
  low: '低'
} as const;

export const RecurringTypeLabels = {
  daily: '每日',
  weekly: '每周',
  monthly: '每月',
  yearly: '每年'
} as const;

// 任务类型颜色配置
export const TaskTypeColors = {
  regular: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    dot: 'bg-blue-400'
  },
  long_term: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    dot: 'bg-purple-400'
  },
  recurring: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    dot: 'bg-green-400'
  }
} as const;

// 优先级颜色配置
export const TaskPriorityColors = {
  high: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300'
  },
  medium: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300'
  },
  low: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300'
  }
} as const;

// 状态颜色配置
export const TaskStatusColors = {
  pending: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300'
  },
  in_progress: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300'
  },
  completed: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300'
  }
} as const;