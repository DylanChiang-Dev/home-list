import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware, familyMemberMiddleware, getCurrentUser, checkFamilyAccess } from '../middleware/auth';
import type { Bindings } from '../index';

const tasks = new Hono<{ Bindings: Bindings }>();

// 所有任务路由都需要认证
tasks.use('*', authMiddleware());

// 获取任务列表
tasks.get('/', async (c) => {
  try {
    const user = getCurrentUser(c);
    const { status, priority, assignee, page = '1', limit = '20' } = c.req.query();
    
    if (!user.familyId) {
      return c.json({ tasks: [], total: 0, page: 1, limit: 20 });
    }
    
    // 构建查询条件
    const conditions = ['family_id = ?'];
    const params = [user.familyId];
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (priority) {
      conditions.push('priority = ?');
      params.push(priority);
    }
    
    if (assignee) {
      conditions.push('assignee_id = ?');
      params.push(assignee);
    }
    
    // 分页参数
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    
    // 查询任务总数
    const countQuery = `SELECT COUNT(*) as total FROM tasks WHERE ${conditions.join(' AND ')}`;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first() as any;
    const total = countResult?.total || 0;
    
    // 查询任务列表
    const tasksQuery = `
      SELECT
        t.*,
        creator.name as creator_name,
        assignee.name as assignee_name,
        completer.name as completer_name
      FROM tasks t
      LEFT JOIN users creator ON t.creator_id = creator.id
      LEFT JOIN users assignee ON t.assignee_id = assignee.id
      LEFT JOIN users completer ON t.completer_id = completer.id
      WHERE t.${conditions.join(' AND t.')}
      ORDER BY
        CASE t.priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const tasksResult = await c.env.DB.prepare(tasksQuery)
      .bind(...params, limitNum, offset)
      .all();
    
    return c.json({
      tasks: tasksResult.results || [],
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
    
  } catch (error) {
    console.error('Get tasks error:', error);
    throw new HTTPException(500, { message: '获取任务列表失败' });
  }
});

// 获取单个任务详情
tasks.get('/:id', async (c) => {
  try {
    const user = getCurrentUser(c);
    const taskId = c.req.param('id');
    
    const task = await c.env.DB.prepare(`
      SELECT 
        t.*,
        creator.name as creator_name,
        assignee.name as assignee_name,
        completer.name as completer_name
      FROM tasks t
      LEFT JOIN users creator ON t.creator_id = creator.id
      LEFT JOIN users assignee ON t.assignee_id = assignee.id
      LEFT JOIN users completer ON t.completer_id = completer.id
      WHERE t.id = ?
    `).bind(taskId).first() as any;
    
    if (!task) {
      throw new HTTPException(404, { message: '任务不存在' });
    }
    
    // 检查用户是否有权限访问该任务
    if (!checkFamilyAccess(user, task.family_id)) {
      throw new HTTPException(403, { message: '无权限访问该任务' });
    }
    
    return c.json({ task });
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get task error:', error);
    throw new HTTPException(500, { message: '获取任务详情失败' });
  }
});

// 创建任务
tasks.post('/', familyMemberMiddleware(), async (c) => {
  try {
    const user = getCurrentUser(c);
    const { title, description, priority = 'medium', type = 'regular', assigneeId, dueDate, recurringRule } = await c.req.json();
    
    // 验证输入
    if (!title || !assigneeId) {
      throw new HTTPException(400, { message: '任务标题和指派人不能为空' });
    }
    
    // 验证优先级
    if (!['high', 'medium', 'low'].includes(priority)) {
      throw new HTTPException(400, { message: '优先级必须是 high、medium 或 low' });
    }
    
    // 验证任务类型
    if (!['regular', 'long_term', 'recurring'].includes(type)) {
      throw new HTTPException(400, { message: '任务类型必须是 regular、long_term 或 recurring' });
    }
    
    // 验证指派人是否属于同一家庭
    const assignee = await c.env.DB.prepare(
      'SELECT id, family_id FROM users WHERE id = ?'
    ).bind(assigneeId).first() as any;
    
    if (!assignee) {
      throw new HTTPException(400, { message: '指派人不存在' });
    }
    
    if (assignee.family_id !== user.familyId) {
      throw new HTTPException(400, { message: '只能将任务指派给同一家庭的成员' });
    }
    
    // 创建任务
    const taskId = crypto.randomUUID();

    // 处理可选字段
    const recurringRuleJson = recurringRule ? JSON.stringify(recurringRule) : null;

    await c.env.DB.prepare(`
      INSERT INTO tasks (
        id, title, description, priority, type, creator_id, assignee_id,
        family_id, due_date, recurring_rule
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      taskId, title, description || null, priority, type, user.userId,
      assigneeId, user.familyId, dueDate || null, recurringRuleJson
    ).run();
    
    // 获取创建的任务详情
    const newTask = await c.env.DB.prepare(`
      SELECT 
        t.*,
        creator.name as creator_name,
        assignee.name as assignee_name
      FROM tasks t
      LEFT JOIN users creator ON t.creator_id = creator.id
      LEFT JOIN users assignee ON t.assignee_id = assignee.id
      WHERE t.id = ?
    `).bind(taskId).first();
    
    return c.json({
      message: '任务创建成功',
      task: newTask
    }, 201);
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Create task error:', error);
    throw new HTTPException(500, { message: '创建任务失败' });
  }
});

// 更新任务
tasks.put('/:id', async (c) => {
  try {
    const user = getCurrentUser(c);
    const taskId = c.req.param('id');
    const { title, description, priority, status, assigneeId, dueDate, recurringRule } = await c.req.json();
    
    // 获取任务信息
    const task = await c.env.DB.prepare(
      'SELECT * FROM tasks WHERE id = ?'
    ).bind(taskId).first() as any;
    
    if (!task) {
      throw new HTTPException(404, { message: '任务不存在' });
    }
    
    // 检查权限
    if (!checkFamilyAccess(user, task.family_id)) {
      throw new HTTPException(403, { message: '无权限修改该任务' });
    }
    
    // 构建更新字段
    const updates: string[] = [];
    const values: any[] = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    
    if (priority !== undefined) {
      if (!['high', 'medium', 'low'].includes(priority)) {
        throw new HTTPException(400, { message: '优先级必须是 high、medium 或 low' });
      }
      updates.push('priority = ?');
      values.push(priority);
    }
    
    if (status !== undefined) {
      if (!['pending', 'in_progress', 'completed'].includes(status)) {
        throw new HTTPException(400, { message: '状态必须是 pending、in_progress 或 completed' });
      }
      updates.push('status = ?');
      values.push(status);
      
      // 如果任务完成，记录完成者和完成时间
      if (status === 'completed') {
        updates.push('completer_id = ?', 'completed_at = ?');
        values.push(user.userId, new Date().toISOString());
      }
    }
    
    if (assigneeId !== undefined) {
      // 验证指派人
      const assignee = await c.env.DB.prepare(
        'SELECT id, family_id FROM users WHERE id = ?'
      ).bind(assigneeId).first() as any;
      
      if (!assignee || assignee.family_id !== user.familyId) {
        throw new HTTPException(400, { message: '指派人必须是同一家庭的成员' });
      }
      
      updates.push('assignee_id = ?');
      values.push(assigneeId);
    }
    
    if (dueDate !== undefined) {
      updates.push('due_date = ?');
      values.push(dueDate);
    }
    
    if (recurringRule !== undefined) {
      updates.push('recurring_rule = ?');
      values.push(recurringRule ? JSON.stringify(recurringRule) : null);
    }
    
    if (updates.length === 0) {
      throw new HTTPException(400, { message: '至少需要提供一个更新字段' });
    }
    
    values.push(taskId);
    
    // 执行更新
    await c.env.DB.prepare(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    // 获取更新后的完整任务信息（返回 camelCase 格式）
    const updatedTask = await c.env.DB.prepare(`
      SELECT
        t.*,
        creator.name as creator_name,
        assignee.name as assignee_name,
        completer.name as completer_name
      FROM tasks t
      LEFT JOIN users creator ON t.creator_id = creator.id
      LEFT JOIN users assignee ON t.assignee_id = assignee.id
      LEFT JOIN users completer ON t.completer_id = completer.id
      WHERE t.id = ?
    `).bind(taskId).first() as any;

    if (!updatedTask) {
      throw new HTTPException(404, { message: '任务不存在' });
    }

    // 转换为 camelCase 格式
    const task = {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority,
      type: updatedTask.type,
      assigneeId: updatedTask.assignee_id,
      creatorName: updatedTask.creator_name,
      assigneeName: updatedTask.assignee_name,
      completerName: updatedTask.completer_name,
      createdAt: updatedTask.created_at,
      updatedAt: updatedTask.updated_at,
      completedAt: updatedTask.completed_at,
      dueDate: updatedTask.due_date,
      recurringRule: updatedTask.recurring_rule ? JSON.parse(updatedTask.recurring_rule) : undefined
    };

    return c.json(task);

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Update task error:', error);
    throw new HTTPException(500, { message: '更新任务失败' });
  }
});

// 删除任务
tasks.delete('/:id', async (c) => {
  try {
    const user = getCurrentUser(c);
    const taskId = c.req.param('id');
    
    // 获取任务信息
    const task = await c.env.DB.prepare(
      'SELECT * FROM tasks WHERE id = ?'
    ).bind(taskId).first() as any;
    
    if (!task) {
      throw new HTTPException(404, { message: '任务不存在' });
    }
    
    // 检查权限（只有创建者或管理员可以删除）
    if (task.creator_id !== user.userId && user.role !== 'admin') {
      throw new HTTPException(403, { message: '只有任务创建者或管理员可以删除任务' });
    }
    
    // 删除任务
    await c.env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(taskId).run();
    
    return c.json({ message: '任务删除成功' });
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Delete task error:', error);
    throw new HTTPException(500, { message: '删除任务失败' });
  }
});

// 获取任务统计信息
tasks.get('/stats/overview', familyMemberMiddleware(), async (c) => {
  try {
    const user = getCurrentUser(c);
    
    // 获取家庭任务统计
    const familyStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_tasks
      FROM tasks WHERE family_id = ?
    `).bind(user.familyId).first() as any;
    
    // 获取个人任务统计
    const personalStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as assigned_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks
      FROM tasks WHERE assignee_id = ? AND family_id = ?
    `).bind(user.userId, user.familyId).first() as any;
    
    // 获取今日到期任务数
    const today = new Date().toISOString().split('T')[0];
    const dueTodayStats = await c.env.DB.prepare(`
      SELECT COUNT(*) as due_today
      FROM tasks 
      WHERE family_id = ? 
        AND DATE(due_date) = ? 
        AND status != 'completed'
    `).bind(user.familyId, today).first() as any;
    
    return c.json({
      family: familyStats || {},
      personal: personalStats || {},
      dueToday: dueTodayStats?.due_today || 0
    });
    
  } catch (error) {
    console.error('Get task stats error:', error);
    throw new HTTPException(500, { message: '获取任务统计失败' });
  }
});

export default tasks;