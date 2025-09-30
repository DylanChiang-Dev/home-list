/**
 * 統一的數據轉換工具
 * 將後端的 snake_case 格式轉換為前端的 camelCase 格式
 */

import { Task, RecurringRule } from '../types/task';

/**
 * 將後端任務數據轉換為前端格式
 */
export function convertTaskFromAPI(apiTask: any): Task {
  return {
    id: apiTask.id,
    title: apiTask.title,
    description: apiTask.description,
    status: apiTask.status,
    priority: apiTask.priority,
    type: apiTask.type,
    assigneeId: apiTask.assignee_id || apiTask.assigneeId,
    creatorName: apiTask.creator_name || apiTask.creatorName,
    assigneeName: apiTask.assignee_name || apiTask.assigneeName,
    completerName: apiTask.completer_name || apiTask.completerName,
    createdAt: apiTask.created_at || apiTask.createdAt,
    updatedAt: apiTask.updated_at || apiTask.updatedAt,
    completedAt: apiTask.completed_at || apiTask.completedAt,
    dueDate: apiTask.due_date || apiTask.dueDate,
    recurringRule: parseRecurringRule(apiTask.recurring_rule || apiTask.recurringRule),
  };
}

/**
 * 安全解析重複規則
 */
function parseRecurringRule(rule: string | RecurringRule | null | undefined): RecurringRule | undefined {
  if (!rule) return undefined;

  // 如果已經是對象，直接返回
  if (typeof rule === 'object') return rule;

  // 如果是字符串，嘗試解析
  try {
    return JSON.parse(rule);
  } catch (error) {
    console.error('Failed to parse recurring rule:', rule, error);
    return undefined;
  }
}

/**
 * 批量轉換任務數組
 */
export function convertTasksFromAPI(apiTasks: any[]): Task[] {
  if (!Array.isArray(apiTasks)) return [];
  return apiTasks.map(convertTaskFromAPI);
}

/**
 * 將前端任務數據轉換為後端格式
 */
export function convertTaskToAPI(task: Partial<Task>): any {
  const apiTask: any = {};

  if (task.title !== undefined) apiTask.title = task.title;
  if (task.description !== undefined) apiTask.description = task.description;
  if (task.status !== undefined) apiTask.status = task.status;
  if (task.priority !== undefined) apiTask.priority = task.priority;
  if (task.type !== undefined) apiTask.type = task.type;
  if (task.assigneeId !== undefined) apiTask.assigneeId = task.assigneeId;
  if (task.dueDate !== undefined) apiTask.dueDate = task.dueDate;
  if (task.recurringRule !== undefined) {
    apiTask.recurringRule = task.recurringRule ? task.recurringRule : null;
  }

  return apiTask;
}

/**
 * 將後端家庭成員數據轉換為前端格式
 */
export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  joinedAt: string;
  tasksCount: number;
  completedTasks: number;
}

export function convertFamilyMemberFromAPI(apiMember: any): FamilyMember {
  return {
    id: apiMember.id,
    name: apiMember.name,
    email: apiMember.email,
    role: apiMember.role,
    joinedAt: apiMember.joined_at || apiMember.joinedAt || apiMember.created_at,
    tasksCount: apiMember.tasks_count || apiMember.tasksCount || 0,
    completedTasks: apiMember.completed_tasks || apiMember.completedTasks || 0,
  };
}

export function convertFamilyMembersFromAPI(apiMembers: any[]): FamilyMember[] {
  if (!Array.isArray(apiMembers)) return [];
  return apiMembers.map(convertFamilyMemberFromAPI);
}

/**
 * 將後端邀請碼數據轉換為前端格式
 */
export interface InviteCode {
  id: string;
  code: string;
  familyId: string;
  expiresAt: string;
  maxUses: number;
  usedCount: number;
  usedBy: string | null;
  usedByName?: string;
  createdAt: string;
}

export function convertInviteCodeFromAPI(apiInvite: any): InviteCode {
  return {
    id: apiInvite.id,
    code: apiInvite.code,
    familyId: apiInvite.family_id || apiInvite.familyId,
    expiresAt: apiInvite.expires_at || apiInvite.expiresAt,
    maxUses: apiInvite.max_uses || apiInvite.maxUses || 1,
    usedCount: apiInvite.used_count || apiInvite.usedCount || 0,
    usedBy: apiInvite.used_by || apiInvite.usedBy || null,
    usedByName: apiInvite.used_by_name || apiInvite.usedByName,
    createdAt: apiInvite.created_at || apiInvite.createdAt,
  };
}

export function convertInviteCodesFromAPI(apiInvites: any[]): InviteCode[] {
  if (!Array.isArray(apiInvites)) return [];
  return apiInvites.map(convertInviteCodeFromAPI);
}