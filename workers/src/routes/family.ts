import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware, adminMiddleware, getCurrentUser, checkFamilyAccess } from '../middleware/auth';
import type { Bindings } from '../index';

const family = new Hono<{ Bindings: Bindings }>();

// 所有家庭路由都需要认证
family.use('*', authMiddleware());

// 创建家庭
family.post('/', async (c) => {
  try {
    const user = getCurrentUser(c);
    const { name, description } = await c.req.json();
    
    // 验证输入
    if (!name) {
      throw new HTTPException(400, { message: '家庭名称不能为空' });
    }
    
    // 检查用户是否已经有家庭
    if (user.familyId) {
      throw new HTTPException(400, { message: '您已经加入了一个家庭，请先退出当前家庭' });
    }
    
    // 创建家庭
    const familyId = crypto.randomUUID();
    await c.env.DB.prepare(
      'INSERT INTO families (id, name, description, admin_id) VALUES (?, ?, ?, ?)'
    ).bind(familyId, name, description, user.userId).run();
    
    // 更新用户的家庭ID和角色
    await c.env.DB.prepare(
      'UPDATE users SET family_id = ?, role = ? WHERE id = ?'
    ).bind(familyId, 'admin', user.userId).run();
    
    return c.json({
      message: '家庭创建成功',
      family: {
        id: familyId,
        name,
        description,
        adminId: user.userId,
        role: 'admin'
      }
    }, 201);
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Create family error:', error);
    throw new HTTPException(500, { message: '创建家庭失败' });
  }
});

// 获取家庭信息
family.get('/:id', async (c) => {
  try {
    const user = getCurrentUser(c);
    const familyId = c.req.param('id');
    
    // 检查权限
    if (!checkFamilyAccess(user, familyId)) {
      throw new HTTPException(403, { message: '无权限访问该家庭信息' });
    }
    
    // 获取家庭信息
    const familyInfo = await c.env.DB.prepare(`
      SELECT f.*, admin.name as admin_name
      FROM families f
      LEFT JOIN users admin ON f.admin_id = admin.id
      WHERE f.id = ?
    `).bind(familyId).first() as any;
    
    if (!familyInfo) {
      throw new HTTPException(404, { message: '家庭不存在' });
    }
    
    // 获取家庭成员
    const members = await c.env.DB.prepare(`
      SELECT id, name, email, role, created_at
      FROM users
      WHERE family_id = ?
      ORDER BY 
        CASE role WHEN 'admin' THEN 1 ELSE 2 END,
        created_at ASC
    `).bind(familyId).all();
    
    return c.json({
      family: {
        ...familyInfo,
        members: members.results || []
      }
    });
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get family error:', error);
    throw new HTTPException(500, { message: '获取家庭信息失败' });
  }
});

// 更新家庭信息
family.put('/:id', async (c) => {
  try {
    const user = getCurrentUser(c);
    const familyId = c.req.param('id');
    const { name, description } = await c.req.json();
    
    // 检查权限（只有管理员可以修改）
    const familyInfo = await c.env.DB.prepare(
      'SELECT admin_id FROM families WHERE id = ?'
    ).bind(familyId).first() as any;
    
    if (!familyInfo) {
      throw new HTTPException(404, { message: '家庭不存在' });
    }
    
    if (familyInfo.admin_id !== user.userId) {
      throw new HTTPException(403, { message: '只有家庭管理员可以修改家庭信息' });
    }
    
    // 构建更新字段
    const updates: string[] = [];
    const values: any[] = [];
    
    if (name !== undefined) {
      if (!name) {
        throw new HTTPException(400, { message: '家庭名称不能为空' });
      }
      updates.push('name = ?');
      values.push(name);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    
    if (updates.length === 0) {
      throw new HTTPException(400, { message: '至少需要提供一个更新字段' });
    }
    
    values.push(familyId);
    
    // 执行更新
    await c.env.DB.prepare(
      `UPDATE families SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();
    
    return c.json({ message: '家庭信息更新成功' });
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Update family error:', error);
    throw new HTTPException(500, { message: '更新家庭信息失败' });
  }
});

// 生成邀请码
family.post('/:id/invite', async (c) => {
  try {
    const user = getCurrentUser(c);
    const familyId = c.req.param('id');
    const { expiresIn = 7 } = await c.req.json(); // 默认7天过期
    
    // 检查权限（只有管理员可以生成邀请码）
    const familyInfo = await c.env.DB.prepare(
      'SELECT admin_id FROM families WHERE id = ?'
    ).bind(familyId).first() as any;
    
    if (!familyInfo) {
      throw new HTTPException(404, { message: '家庭不存在' });
    }
    
    if (familyInfo.admin_id !== user.userId) {
      throw new HTTPException(403, { message: '只有家庭管理员可以生成邀请码' });
    }
    
    // 生成邀请码
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString();
    
    // 保存邀请码
    await c.env.DB.prepare(
      'INSERT INTO invite_codes (code, family_id, expires_at) VALUES (?, ?, ?)'
    ).bind(inviteCode, familyId, expiresAt).run();
    
    return c.json({
      message: '邀请码生成成功',
      inviteCode,
      expiresAt,
      expiresIn
    });
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Generate invite code error:', error);
    throw new HTTPException(500, { message: '生成邀请码失败' });
  }
});

// 使用邀请码加入家庭
family.post('/join', async (c) => {
  try {
    const user = getCurrentUser(c);
    const { inviteCode } = await c.req.json();
    
    // 验证输入
    if (!inviteCode) {
      throw new HTTPException(400, { message: '邀请码不能为空' });
    }
    
    // 检查用户是否已经有家庭
    if (user.familyId) {
      throw new HTTPException(400, { message: '您已经加入了一个家庭，请先退出当前家庭' });
    }
    
    // 查找邀请码
    const invite = await c.env.DB.prepare(`
      SELECT ic.*, f.name as family_name
      FROM invite_codes ic
      LEFT JOIN families f ON ic.family_id = f.id
      WHERE ic.code = ? AND ic.expires_at > ? AND ic.used_by IS NULL
    `).bind(inviteCode, new Date().toISOString()).first() as any;
    
    if (!invite) {
      throw new HTTPException(400, { message: '邀请码无效或已过期' });
    }
    
    // 更新用户的家庭ID
    await c.env.DB.prepare(
      'UPDATE users SET family_id = ?, role = ? WHERE id = ?'
    ).bind(invite.family_id, 'member', user.userId).run();
    
    // 标记邀请码为已使用
    await c.env.DB.prepare(
      'UPDATE invite_codes SET used_by = ? WHERE code = ?'
    ).bind(user.userId, inviteCode).run();
    
    return c.json({
      message: `成功加入家庭：${invite.family_name}`,
      family: {
        id: invite.family_id,
        name: invite.family_name
      }
    });
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Join family error:', error);
    throw new HTTPException(500, { message: '加入家庭失败' });
  }
});

// 退出家庭
family.post('/leave', async (c) => {
  try {
    const user = getCurrentUser(c);
    
    if (!user.familyId) {
      throw new HTTPException(400, { message: '您还没有加入任何家庭' });
    }
    
    // 检查是否是管理员
    const familyInfo = await c.env.DB.prepare(
      'SELECT admin_id FROM families WHERE id = ?'
    ).bind(user.familyId).first() as any;
    
    if (familyInfo && familyInfo.admin_id === user.userId) {
      // 检查是否还有其他成员
      const memberCount = await c.env.DB.prepare(
        'SELECT COUNT(*) as count FROM users WHERE family_id = ?'
      ).bind(user.familyId).first() as any;
      
      if (memberCount && memberCount.count > 1) {
        throw new HTTPException(400, { message: '作为管理员，您需要先转让管理权限或删除家庭才能退出' });
      }
      
      // 如果是唯一成员，删除家庭
      await c.env.DB.prepare('DELETE FROM families WHERE id = ?').bind(user.familyId).run();
    }
    
    // 更新用户信息
    await c.env.DB.prepare(
      'UPDATE users SET family_id = NULL, role = ? WHERE id = ?'
    ).bind('member', user.userId).run();
    
    return c.json({ message: '成功退出家庭' });
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Leave family error:', error);
    throw new HTTPException(500, { message: '退出家庭失败' });
  }
});

// 移除家庭成员
family.delete('/:id/members/:memberId', async (c) => {
  try {
    const user = getCurrentUser(c);
    const familyId = c.req.param('id');
    const memberId = c.req.param('memberId');
    
    // 检查权限（只有管理员可以移除成员）
    const familyInfo = await c.env.DB.prepare(
      'SELECT admin_id FROM families WHERE id = ?'
    ).bind(familyId).first() as any;
    
    if (!familyInfo) {
      throw new HTTPException(404, { message: '家庭不存在' });
    }
    
    if (familyInfo.admin_id !== user.userId) {
      throw new HTTPException(403, { message: '只有家庭管理员可以移除成员' });
    }
    
    // 不能移除自己
    if (memberId === user.userId) {
      throw new HTTPException(400, { message: '不能移除自己，请使用退出家庭功能' });
    }
    
    // 检查成员是否存在
    const member = await c.env.DB.prepare(
      'SELECT id, name FROM users WHERE id = ? AND family_id = ?'
    ).bind(memberId, familyId).first() as any;
    
    if (!member) {
      throw new HTTPException(404, { message: '成员不存在或不属于该家庭' });
    }
    
    // 移除成员
    await c.env.DB.prepare(
      'UPDATE users SET family_id = NULL, role = ? WHERE id = ?'
    ).bind('member', memberId).run();
    
    return c.json({ message: `成功移除成员：${member.name}` });
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Remove member error:', error);
    throw new HTTPException(500, { message: '移除成员失败' });
  }
});

// 转让管理权限
family.post('/:id/transfer', async (c) => {
  try {
    const user = getCurrentUser(c);
    const familyId = c.req.param('id');
    const { newAdminId } = await c.req.json();
    
    // 验证输入
    if (!newAdminId) {
      throw new HTTPException(400, { message: '新管理员ID不能为空' });
    }
    
    // 检查权限（只有当前管理员可以转让）
    const familyInfo = await c.env.DB.prepare(
      'SELECT admin_id FROM families WHERE id = ?'
    ).bind(familyId).first() as any;
    
    if (!familyInfo) {
      throw new HTTPException(404, { message: '家庭不存在' });
    }
    
    if (familyInfo.admin_id !== user.userId) {
      throw new HTTPException(403, { message: '只有当前管理员可以转让管理权限' });
    }
    
    // 检查新管理员是否是家庭成员
    const newAdmin = await c.env.DB.prepare(
      'SELECT id, name FROM users WHERE id = ? AND family_id = ?'
    ).bind(newAdminId, familyId).first() as any;
    
    if (!newAdmin) {
      throw new HTTPException(400, { message: '新管理员必须是家庭成员' });
    }
    
    // 执行转让
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE families SET admin_id = ? WHERE id = ?').bind(newAdminId, familyId),
      c.env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind('admin', newAdminId),
      c.env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind('member', user.userId)
    ]);
    
    return c.json({ message: `管理权限已转让给：${newAdmin.name}` });
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Transfer admin error:', error);
    throw new HTTPException(500, { message: '转让管理权限失败' });
  }
});

// 获取邀请码列表
family.get('/:id/invites', async (c) => {
  try {
    const user = getCurrentUser(c);
    const familyId = c.req.param('id');
    
    // 检查权限（只有管理员可以查看邀请码）
    const familyInfo = await c.env.DB.prepare(
      'SELECT admin_id FROM families WHERE id = ?'
    ).bind(familyId).first() as any;
    
    if (!familyInfo) {
      throw new HTTPException(404, { message: '家庭不存在' });
    }
    
    if (familyInfo.admin_id !== user.userId) {
      throw new HTTPException(403, { message: '只有家庭管理员可以查看邀请码' });
    }
    
    // 获取邀请码列表
    const invites = await c.env.DB.prepare(`
      SELECT 
        ic.*,
        u.name as used_by_name
      FROM invite_codes ic
      LEFT JOIN users u ON ic.used_by = u.id
      WHERE ic.family_id = ?
      ORDER BY ic.created_at DESC
    `).bind(familyId).all();
    
    return c.json({ invites: invites.results || [] });
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get invites error:', error);
    throw new HTTPException(500, { message: '获取邀请码列表失败' });
  }
});

export default family;