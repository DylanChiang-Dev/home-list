import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { sign, verify } from 'hono/jwt';
import type { Bindings } from '../index';

// JWT载荷类型
export interface JWTPayload {
  userId: string;
  email: string;
  familyId?: string;
  role: string;
  iat: number;
  exp: number;
}

// 扩展Context类型以包含用户信息
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

/**
 * 生成JWT token
 */
export async function generateToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: number = 24 * 60 * 60 // 24小时
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };
  
  return await sign(jwtPayload, secret);
}

/**
 * 验证JWT token
 */
export async function verifyToken(
  token: string,
  secret: string
): Promise<JWTPayload> {
  try {
    const payload = await verify(token, secret) as JWTPayload;
    
    // 检查token是否过期
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error('Token已过期');
    }
    
    return payload;
  } catch (error) {
    throw new HTTPException(401, { message: 'Token无效或已过期' });
  }
}

/**
 * JWT认证中间件
 */
export function authMiddleware() {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: '缺少认证token' });
    }
    
    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    
    try {
      const payload = await verifyToken(token, c.env.JWT_SECRET);
      
      // 将用户信息存储到context中
      c.set('user', payload);
      
      await next();
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(401, { message: '认证失败' });
    }
  };
}

/**
 * 可选认证中间件（不强制要求token）
 */
export function optionalAuthMiddleware() {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const payload = await verifyToken(token, c.env.JWT_SECRET);
        c.set('user', payload);
      } catch (error) {
        // 可选认证失败时不抛出错误，继续执行
        console.warn('Optional auth failed:', error);
      }
    }
    
    await next();
  };
}

/**
 * 管理员权限检查中间件
 */
export function adminMiddleware() {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      throw new HTTPException(401, { message: '需要认证' });
    }
    
    if (user.role !== 'admin') {
      throw new HTTPException(403, { message: '需要管理员权限' });
    }
    
    await next();
  };
}

/**
 * 家庭成员权限检查中间件
 */
export function familyMemberMiddleware() {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      throw new HTTPException(401, { message: '需要认证' });
    }
    
    if (!user.familyId) {
      throw new HTTPException(403, { message: '用户未加入任何家庭' });
    }
    
    await next();
  };
}

/**
 * 获取当前用户信息的辅助函数
 */
export function getCurrentUser(c: Context): JWTPayload {
  const user = c.get('user');
  if (!user) {
    throw new HTTPException(401, { message: '用户未认证' });
  }
  return user;
}

/**
 * 检查用户是否有权限访问特定家庭资源
 */
export function checkFamilyAccess(
  user: JWTPayload,
  familyId: string
): boolean {
  return user.familyId === familyId || user.role === 'admin';
}

/**
 * 家庭访问权限检查中间件
 */
export function familyAccessMiddleware(familyIdParam: string = 'familyId') {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const user = getCurrentUser(c);
    const familyId = c.req.param(familyIdParam) || c.req.query(familyIdParam);
    
    if (!familyId) {
      throw new HTTPException(400, { message: '缺少家庭ID参数' });
    }
    
    if (!checkFamilyAccess(user, familyId)) {
      throw new HTTPException(403, { message: '无权限访问该家庭资源' });
    }
    
    await next();
  };
}