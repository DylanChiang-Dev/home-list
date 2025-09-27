import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
// 使用Web Crypto API进行密码哈希
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};
import { generateToken, authMiddleware, getCurrentUser } from '../middleware/auth';
import type { Bindings } from '../index';

const auth = new Hono<{ Bindings: Bindings }>();

// 用户注册
auth.post('/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    // 验证输入
    if (!email || !password || !name) {
      throw new HTTPException(400, { message: '邮箱、密码和姓名不能为空' });
    }
    
    if (password.length < 6) {
      throw new HTTPException(400, { message: '密码长度至少6位' });
    }
    
    // 检查邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HTTPException(400, { message: '邮箱格式不正确' });
    }
    
    // 检查用户是否已存在
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existingUser) {
      throw new HTTPException(400, { message: '该邮箱已被注册' });
    }
    
    // 加密密码
    const passwordHash = await hashPassword(password);
    
    // 创建用户
    const userId = crypto.randomUUID();
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)'
    ).bind(userId, email, passwordHash, name).run();
    
    // 生成JWT token
    const token = await generateToken(
      {
        userId,
        email,
        role: 'member'
      },
      c.env.JWT_SECRET
    );
    
    return c.json({
      message: '注册成功',
      token,
      user: {
        id: userId,
        email,
        name,
        role: 'member'
      }
    });
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Registration error:', error);
    throw new HTTPException(500, { message: '注册失败，请稍后重试' });
  }
});

// 用户登录
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    // 验证输入
    if (!email || !password) {
      throw new HTTPException(400, { message: '邮箱和密码不能为空' });
    }
    
    // 查找用户
    const user = await c.env.DB.prepare(
      'SELECT id, email, password_hash, name, family_id, role FROM users WHERE email = ?'
    ).bind(email).first() as any;
    
    if (!user) {
      throw new HTTPException(401, { message: '邮箱或密码错误' });
    }
    
    // 验证密码
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new HTTPException(401, { message: '邮箱或密码错误' });
    }
    
    // 生成JWT token
    const token = await generateToken(
      {
        userId: user.id,
        email: user.email,
        familyId: user.family_id,
        role: user.role
      },
      c.env.JWT_SECRET
    );
    
    return c.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        familyId: user.family_id,
        role: user.role
      }
    });
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Login error:', error);
    throw new HTTPException(500, { message: '登录失败，请稍后重试' });
  }
});

// 获取当前用户信息
auth.get('/me', authMiddleware(), async (c) => {
  try {
    const currentUser = getCurrentUser(c);
    
    // 从数据库获取最新用户信息
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, family_id, role, created_at FROM users WHERE id = ?'
    ).bind(currentUser.userId).first() as any;
    
    if (!user) {
      throw new HTTPException(404, { message: '用户不存在' });
    }
    
    // 如果用户有家庭，获取家庭信息
    let family = null;
    if (user.family_id) {
      family = await c.env.DB.prepare(
        'SELECT id, name, description FROM families WHERE id = ?'
      ).bind(user.family_id).first();
    }
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        familyId: user.family_id,
        role: user.role,
        createdAt: user.created_at,
        family
      }
    });
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get user info error:', error);
    throw new HTTPException(500, { message: '获取用户信息失败' });
  }
});

// 更新用户信息
auth.put('/profile', authMiddleware(), async (c) => {
  try {
    const currentUser = getCurrentUser(c);
    const { name, email } = await c.req.json();
    
    // 验证输入
    if (!name && !email) {
      throw new HTTPException(400, { message: '至少需要提供一个更新字段' });
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    
    if (email) {
      // 检查邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new HTTPException(400, { message: '邮箱格式不正确' });
      }
      
      // 检查邮箱是否已被其他用户使用
      const existingUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE email = ? AND id != ?'
      ).bind(email, currentUser.userId).first();
      
      if (existingUser) {
        throw new HTTPException(400, { message: '该邮箱已被其他用户使用' });
      }
      
      updates.push('email = ?');
      values.push(email);
    }
    
    values.push(currentUser.userId);
    
    // 更新用户信息
    await c.env.DB.prepare(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();
    
    return c.json({ message: '用户信息更新成功' });
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Update profile error:', error);
    throw new HTTPException(500, { message: '更新用户信息失败' });
  }
});

// 修改密码
auth.put('/password', authMiddleware(), async (c) => {
  try {
    const currentUser = getCurrentUser(c);
    const { currentPassword, newPassword } = await c.req.json();
    
    // 验证输入
    if (!currentPassword || !newPassword) {
      throw new HTTPException(400, { message: '当前密码和新密码不能为空' });
    }
    
    if (newPassword.length < 6) {
      throw new HTTPException(400, { message: '新密码长度至少6位' });
    }
    
    // 获取用户当前密码哈希
    const user = await c.env.DB.prepare(
      'SELECT password_hash FROM users WHERE id = ?'
    ).bind(currentUser.userId).first() as any;
    
    if (!user) {
      throw new HTTPException(404, { message: '用户不存在' });
    }
    
    // 验证当前密码
    const isValidPassword = await verify(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new HTTPException(400, { message: '当前密码错误' });
    }
    
    // 加密新密码
    const newPasswordHash = await hash(newPassword);
    
    // 更新密码
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(newPasswordHash, currentUser.userId).run();
    
    return c.json({ message: '密码修改成功' });
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Change password error:', error);
    throw new HTTPException(500, { message: '修改密码失败' });
  }
});

// 刷新token
auth.post('/refresh', authMiddleware(), async (c) => {
  try {
    const currentUser = getCurrentUser(c);
    
    // 生成新的token
    const newToken = await generateToken(
      {
        userId: currentUser.userId,
        email: currentUser.email,
        familyId: currentUser.familyId,
        role: currentUser.role
      },
      c.env.JWT_SECRET
    );
    
    return c.json({
      message: 'Token刷新成功',
      token: newToken
    });
    
  } catch (error) {
    console.error('Refresh token error:', error);
    throw new HTTPException(500, { message: 'Token刷新失败' });
  }
});

export default auth;