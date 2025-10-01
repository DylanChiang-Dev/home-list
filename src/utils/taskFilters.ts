/**
 * 統一的任務過濾邏輯
 * Calendar 和 Dashboard 共享此邏輯以確保一致性
 */

import { Task } from '../types/task';

/**
 * 規範化日期 - 移除時間部分，只保留日期
 * 處理多種日期格式："2025-09-30 13:47:24" 或 "2025-09-30"
 */
function normalizeDateOnly(dateInput: string | Date): Date {
  let date: Date;

  if (typeof dateInput === 'string') {
    // 如果包含時間，分割後只取日期部分
    const dateStr = dateInput.split(' ')[0];
    date = new Date(dateStr + 'T00:00:00');
  } else {
    date = new Date(dateInput);
  }

  // 返回只有日期部分的 Date 對象
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * 檢查任務是否應該在指定日期顯示
 * 此函數被 Calendar 和 Dashboard 共同使用
 */
export function shouldShowTaskOnDate(task: Task, date: Date): boolean {
  // 規範化比較日期（只保留日期部分）
  const compareDate = normalizeDateOnly(date);

  // 检查结束日期
  if (task.recurringRule?.endDate) {
    const endDate = normalizeDateOnly(task.recurringRule.endDate);
    if (compareDate > endDate) return false;
  }

  // 处理长期任务 - 每天都显示直到截止日期
  if (task.type === 'long_term') {
    const createdDate = normalizeDateOnly(task.createdAt);
    if (compareDate < createdDate) return false;

    if (task.dueDate) {
      const dueDate = normalizeDateOnly(task.dueDate);
      return compareDate <= dueDate;
    }
    return true;
  }

  // 处理重复任务
  if (task.type === 'recurring') {
    const createdDate = normalizeDateOnly(task.createdAt);
    if (compareDate < createdDate) return false;

    if (task.recurringRule) {
      const { type, interval, daysOfWeek, daysOfMonth, monthsOfYear, datesOfYear } = task.recurringRule;
      const daysDiff = Math.floor((compareDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      if (type === 'daily') {
        return daysDiff % (interval || 1) === 0;
      }

      else if (type === 'weekly') {
        const weeksDiff = Math.floor(daysDiff / 7);
        const isCorrectWeek = weeksDiff % (interval || 1) === 0;
        const dayOfWeek = compareDate.getDay() === 0 ? 7 : compareDate.getDay(); // 转换为1-7格式
        const isCorrectDay = daysOfWeek && daysOfWeek.includes(dayOfWeek);
        return isCorrectWeek && isCorrectDay;
      }

      else if (type === 'monthly') {
        const currentMonth = compareDate.getMonth();
        const currentDay = compareDate.getDate();
        const createdMonth = createdDate.getMonth();
        const monthsDiff = (compareDate.getFullYear() - createdDate.getFullYear()) * 12 + (currentMonth - createdMonth);
        const isCorrectMonth = monthsDiff % (interval || 1) === 0;
        const isCorrectDay = daysOfMonth && daysOfMonth.includes(currentDay);
        return isCorrectMonth && isCorrectDay;
      }

      else if (type === 'yearly') {
        const currentYear = compareDate.getFullYear();
        const currentMonth = compareDate.getMonth() + 1; // 转换为1-12格式
        const currentDay = compareDate.getDate();
        const createdYear = createdDate.getFullYear();
        const yearsDiff = currentYear - createdYear;
        const isCorrectYear = yearsDiff % (interval || 1) === 0;

        // 检查月份批量设置
        if (monthsOfYear && monthsOfYear.includes(currentMonth)) {
          return isCorrectYear;
        }

        // 检查具体日期设置
        if (datesOfYear && datesOfYear.some(d => d.month === currentMonth && d.day === currentDay)) {
          return isCorrectYear;
        }

        return false;
      }
    }
    return false;
  }

  // 处理常规任务 - 只在截止日期显示
  if (task.type === 'regular' && task.dueDate) {
    const taskDate = normalizeDateOnly(task.dueDate);
    return compareDate.getTime() === taskDate.getTime();
  }

  return false;
}

/**
 * 獲取指定日期的所有任務
 */
export function getTasksForDate(tasks: Task[], date: Date): Task[] {
  return tasks.filter(task => shouldShowTaskOnDate(task, date));
}

/**
 * 按優先級和狀態排序任務
 */
export function sortTasksByPriority(tasks: Task[]): Task[] {
  const priorityMap = { high: 3, medium: 2, low: 1 };
  const statusMap = { pending: 3, in_progress: 2, completed: 1 };
  const typeMap = { regular: 3, long_term: 2, recurring: 1 };

  return [...tasks].sort((a, b) => {
    // 首先按狀態排序（未完成的在前）
    const statusDiff = statusMap[b.status] - statusMap[a.status];
    if (statusDiff !== 0) return statusDiff;

    // 然後按優先級排序
    const priorityDiff = priorityMap[b.priority] - priorityMap[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // 最後按類型排序
    return typeMap[b.type] - typeMap[a.type];
  });
}

/**
 * 按類型分組任務
 */
export function groupTasksByType(tasks: Task[]): {
  regular: Task[];
  longTerm: Task[];
  recurring: Task[];
} {
  return {
    regular: tasks.filter(t => t.type === 'regular'),
    longTerm: tasks.filter(t => t.type === 'long_term'),
    recurring: tasks.filter(t => t.type === 'recurring'),
  };
}

/**
 * 檢查日期是否是今天
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * 格式化日期為 YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 檢查任務是否過期
 */
export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'completed') return false;
  const today = new Date();
  const dueDate = new Date(task.dueDate);
  return dueDate < today;
}

/**
 * 計算任務統計
 */
export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
}

export function calculateTaskStats(tasks: Task[]): TaskStats {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const overdue = tasks.filter(t => isTaskOverdue(t)).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    pending,
    inProgress,
    overdue,
    completionRate,
  };
}