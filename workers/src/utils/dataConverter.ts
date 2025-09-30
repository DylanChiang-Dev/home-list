/**
 * 後端數據轉換工具
 * 將數據庫的 snake_case 格式統一轉換為前端期望的 camelCase 格式
 */

/**
 * 將數據庫任務記錄轉換為 camelCase 格式
 */
export function convertTaskToCamelCase(dbTask: any): any {
  if (!dbTask) return null;

  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    status: dbTask.status,
    priority: dbTask.priority,
    type: dbTask.type,
    assigneeId: dbTask.assignee_id,
    creatorName: dbTask.creator_name,
    assigneeName: dbTask.assignee_name,
    completerName: dbTask.completer_name,
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
    completedAt: dbTask.completed_at,
    dueDate: dbTask.due_date,
    recurringRule: dbTask.recurring_rule ? JSON.parse(dbTask.recurring_rule) : undefined,
  };
}

/**
 * 批量轉換任務數組
 */
export function convertTasksToCamelCase(dbTasks: any[]): any[] {
  if (!Array.isArray(dbTasks)) return [];
  return dbTasks.map(convertTaskToCamelCase);
}

/**
 * 將數據庫家庭成員記錄轉換為 camelCase 格式
 */
export function convertFamilyMemberToCamelCase(dbMember: any): any {
  if (!dbMember) return null;

  return {
    id: dbMember.id,
    name: dbMember.name,
    email: dbMember.email,
    role: dbMember.role,
    joinedAt: dbMember.joinedAt || dbMember.created_at,
    tasksCount: dbMember.tasksCount || 0,
    completedTasks: dbMember.completedTasks || 0,
  };
}

/**
 * 批量轉換家庭成員數組
 */
export function convertFamilyMembersToCamelCase(dbMembers: any[]): any[] {
  if (!Array.isArray(dbMembers)) return [];
  return dbMembers.map(convertFamilyMemberToCamelCase);
}

/**
 * 將數據庫邀請碼記錄轉換為 camelCase 格式
 */
export function convertInviteCodeToCamelCase(dbInvite: any): any {
  if (!dbInvite) return null;

  return {
    id: dbInvite.id,
    code: dbInvite.code,
    familyId: dbInvite.family_id,
    expiresAt: dbInvite.expires_at,
    maxUses: dbInvite.max_uses || 1,
    usedCount: dbInvite.used_count || 0,
    usedBy: dbInvite.used_by || null,
    usedByName: dbInvite.used_by_name || null,
    createdAt: dbInvite.created_at,
  };
}

/**
 * 批量轉換邀請碼數組
 */
export function convertInviteCodesToCamelCase(dbInvites: any[]): any[] {
  if (!Array.isArray(dbInvites)) return [];
  return dbInvites.map(convertInviteCodeToCamelCase);
}