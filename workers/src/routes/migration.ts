import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware, getCurrentUser } from '../middleware/auth';
import { Validator, PasswordUtils, InviteCodeUtils, Utils } from '../utils/helpers';
import type { Bindings, LocalStorageData, MigrationResult, User, Family, Task, InviteCode } from '../models/types';

const migration = new Hono<{ Bindings: Bindings }>();

// 所有迁移路由都需要认证
migration.use('*', authMiddleware());

// 数据迁移主接口
migration.post('/migrate', async (c) => {
  try {
    const user = getCurrentUser(c);
    const localData: LocalStorageData = await c.req.json();
    
    // 验证输入数据
    if (!localData || typeof localData !== 'object') {
      throw new HTTPException(400, { message: '无效的数据格式' });
    }
    
    const result: MigrationResult = {
      success: false,
      message: '',
      migratedCounts: {
        users: 0,
        families: 0,
        tasks: 0,
        inviteCodes: 0
      },
      errors: []
    };
    
    // 开始事务迁移
    try {
      // 1. 迁移用户数据
      if (localData.users && Array.isArray(localData.users)) {
        const userResult = await migrateUsers(c.env.DB, localData.users, user.userId);
        result.migratedCounts!.users = userResult.count;
        if (userResult.errors.length > 0) {
          result.errors!.push(...userResult.errors);
        }
      }
      
      // 2. 迁移家庭数据
      if (localData.families && Array.isArray(localData.families)) {
        const familyResult = await migrateFamilies(c.env.DB, localData.families, user.userId);
        result.migratedCounts!.families = familyResult.count;
        if (familyResult.errors.length > 0) {
          result.errors!.push(...familyResult.errors);
        }
      }
      
      // 3. 迁移任务数据
      if (localData.tasks && Array.isArray(localData.tasks)) {
        const taskResult = await migrateTasks(c.env.DB, localData.tasks, user.userId);
        result.migratedCounts!.tasks = taskResult.count;
        if (taskResult.errors.length > 0) {
          result.errors!.push(...taskResult.errors);
        }
      }
      
      // 4. 迁移邀请码数据
      if (localData.inviteCodes && Array.isArray(localData.inviteCodes)) {
        const inviteResult = await migrateInviteCodes(c.env.DB, localData.inviteCodes, user.userId);
        result.migratedCounts!.inviteCodes = inviteResult.count;
        if (inviteResult.errors.length > 0) {
          result.errors!.push(...inviteResult.errors);
        }
      }
      
      result.success = true;
      result.message = '数据迁移完成';
      
      // 记录迁移日志到KV
      const migrationLog = {
        userId: user.userId,
        timestamp: new Date().toISOString(),
        result
      };
      await c.env.KV.put(`migration:${user.userId}:${Date.now()}`, JSON.stringify(migrationLog), {
        expirationTtl: 30 * 24 * 60 * 60 // 30天过期
      });
      
    } catch (error) {
      console.error('Migration error:', error);
      result.success = false;
      result.message = '数据迁移失败';
      result.errors!.push(error instanceof Error ? error.message : '未知错误');
    }
    
    return c.json(result);
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Migration endpoint error:', error);
    throw new HTTPException(500, { message: '数据迁移服务异常' });
  }
});

// 获取迁移历史
migration.get('/history', async (c) => {
  try {
    const user = getCurrentUser(c);
    
    // 从KV获取迁移历史
    const { keys } = await c.env.KV.list({ prefix: `migration:${user.userId}:` });
    const histories = [];
    
    for (const key of keys) {
      const data = await c.env.KV.get(key.name);
      if (data) {
        try {
          histories.push(JSON.parse(data));
        } catch (e) {
          console.error('Parse migration history error:', e);
        }
      }
    }
    
    // 按时间倒序排列
    histories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return c.json({ histories });
    
  } catch (error) {
    console.error('Get migration history error:', error);
    throw new HTTPException(500, { message: '获取迁移历史失败' });
  }
});

// 验证数据格式
migration.post('/validate', async (c) => {
  try {
    const localData: LocalStorageData = await c.req.json();
    
    const validation = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      summary: {
        users: 0,
        families: 0,
        tasks: 0,
        inviteCodes: 0
      }
    };
    
    // 验证用户数据
    if (localData.users) {
      if (!Array.isArray(localData.users)) {
        validation.errors.push('用户数据格式错误：应为数组');
        validation.isValid = false;
      } else {
        validation.summary.users = localData.users.length;
        localData.users.forEach((user, index) => {
          if (!user.id || !user.name || !user.email) {
            validation.errors.push(`用户数据[${index}]缺少必要字段`);
            validation.isValid = false;
          }
          if (user.email && !Validator.email(user.email)) {
            validation.errors.push(`用户数据[${index}]邮箱格式错误`);
            validation.isValid = false;
          }
        });
      }
    }
    
    // 验证家庭数据
    if (localData.families) {
      if (!Array.isArray(localData.families)) {
        validation.errors.push('家庭数据格式错误：应为数组');
        validation.isValid = false;
      } else {
        validation.summary.families = localData.families.length;
        localData.families.forEach((family, index) => {
          if (!family.id || !family.name || !family.adminId) {
            validation.errors.push(`家庭数据[${index}]缺少必要字段`);
            validation.isValid = false;
          }
        });
      }
    }
    
    // 验证任务数据
    if (localData.tasks) {
      if (!Array.isArray(localData.tasks)) {
        validation.errors.push('任务数据格式错误：应为数组');
        validation.isValid = false;
      } else {
        validation.summary.tasks = localData.tasks.length;
        localData.tasks.forEach((task, index) => {
          if (!task.id || !task.title || !task.familyId || !task.assignedBy) {
            validation.errors.push(`任务数据[${index}]缺少必要字段`);
            validation.isValid = false;
          }
        });
      }
    }
    
    // 验证邀请码数据
    if (localData.inviteCodes) {
      if (!Array.isArray(localData.inviteCodes)) {
        validation.errors.push('邀请码数据格式错误：应为数组');
        validation.isValid = false;
      } else {
        validation.summary.inviteCodes = localData.inviteCodes.length;
        localData.inviteCodes.forEach((invite, index) => {
          if (!invite.id || !invite.code || !invite.familyId) {
            validation.errors.push(`邀请码数据[${index}]缺少必要字段`);
            validation.isValid = false;
          }
        });
      }
    }
    
    return c.json(validation);
    
  } catch (error) {
    console.error('Validate data error:', error);
    throw new HTTPException(400, { message: '数据验证失败' });
  }
});

// 辅助函数：迁移用户数据
async function migrateUsers(db: D1Database, users: User[], currentUserId: string) {
  const result = { count: 0, errors: [] as string[] };
  
  for (const user of users) {
    try {
      // 跳过当前用户（已存在）
      if (user.id === currentUserId) {
        continue;
      }
      
      // 验证数据
      if (!user.id || !user.name || !user.email) {
        result.errors.push(`用户 ${user.name || user.id} 数据不完整`);
        continue;
      }
      
      // 检查邮箱格式
      if (!Validator.email(user.email)) {
        result.errors.push(`用户 ${user.name} 邮箱格式错误`);
        continue;
      }
      
      // 生成默认密码（用户需要重置）
      const defaultPassword = await PasswordUtils.hash('123456');
      
      // 插入用户
      await db.prepare(`
        INSERT OR IGNORE INTO users (id, name, email, password, family_id, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        user.id,
        user.name,
        user.email,
        defaultPassword,
        user.familyId || null,
        user.role || 'member',
        user.createdAt || new Date().toISOString(),
        user.updatedAt || new Date().toISOString()
      ).run();
      
      result.count++;
      
    } catch (error) {
      result.errors.push(`迁移用户 ${user.name} 失败: ${error}`);
    }
  }
  
  return result;
}

// 辅助函数：迁移家庭数据
async function migrateFamilies(db: D1Database, families: Family[], currentUserId: string) {
  const result = { count: 0, errors: [] as string[] };
  
  for (const family of families) {
    try {
      // 验证数据
      if (!family.id || !family.name || !family.adminId) {
        result.errors.push(`家庭 ${family.name || family.id} 数据不完整`);
        continue;
      }
      
      // 插入家庭
      await db.prepare(`
        INSERT OR IGNORE INTO families (id, name, description, admin_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        family.id,
        family.name,
        family.description || null,
        family.adminId,
        family.createdAt || new Date().toISOString(),
        family.updatedAt || new Date().toISOString()
      ).run();
      
      result.count++;
      
    } catch (error) {
      result.errors.push(`迁移家庭 ${family.name} 失败: ${error}`);
    }
  }
  
  return result;
}

// 辅助函数：迁移任务数据
async function migrateTasks(db: D1Database, tasks: Task[], currentUserId: string) {
  const result = { count: 0, errors: [] as string[] };
  
  for (const task of tasks) {
    try {
      // 验证数据
      if (!task.id || !task.title || !task.familyId || !task.assignedBy) {
        result.errors.push(`任务 ${task.title || task.id} 数据不完整`);
        continue;
      }
      
      // 插入任务
      await db.prepare(`
        INSERT OR IGNORE INTO tasks (
          id, title, description, assigned_to, assigned_by, family_id,
          status, priority, due_date, completed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        task.id,
        task.title,
        task.description || null,
        task.assignedTo || null,
        task.assignedBy,
        task.familyId,
        task.status || 'pending',
        task.priority || 'medium',
        task.dueDate || null,
        task.completedAt || null,
        task.createdAt || new Date().toISOString(),
        task.updatedAt || new Date().toISOString()
      ).run();
      
      result.count++;
      
    } catch (error) {
      result.errors.push(`迁移任务 ${task.title} 失败: ${error}`);
    }
  }
  
  return result;
}

// 辅助函数：迁移邀请码数据
async function migrateInviteCodes(db: D1Database, inviteCodes: InviteCode[], currentUserId: string) {
  const result = { count: 0, errors: [] as string[] };
  
  for (const invite of inviteCodes) {
    try {
      // 验证数据
      if (!invite.id || !invite.code || !invite.familyId) {
        result.errors.push(`邀请码 ${invite.code || invite.id} 数据不完整`);
        continue;
      }
      
      // 跳过已过期的邀请码
      if (InviteCodeUtils.isExpired(invite.expiresAt)) {
        continue;
      }
      
      // 插入邀请码
      await db.prepare(`
        INSERT OR IGNORE INTO invite_codes (id, code, family_id, used_by, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        invite.id,
        invite.code,
        invite.familyId,
        invite.usedBy || null,
        invite.expiresAt,
        invite.createdAt || new Date().toISOString()
      ).run();
      
      result.count++;
      
    } catch (error) {
      result.errors.push(`迁移邀请码 ${invite.code} 失败: ${error}`);
    }
  }
  
  return result;
}

export default migration;