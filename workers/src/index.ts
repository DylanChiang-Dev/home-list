import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { HTTPException } from 'hono/http-exception';

// 导入路由
import auth from './routes/auth';
import tasks from './routes/tasks';
import family from './routes/family';
import migration from './routes/migration';

// 环境变量类型定义
type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
};

// 创建Hono应用实例
const app = new Hono<{ Bindings: Bindings }>();

// 全局中间件
app.use('*', logger());
app.use('*', prettyJSON());

// CORS配置
app.use('*', async (c, next) => {
  const corsOrigin = c.env.CORS_ORIGIN || 'http://localhost:5173';
  const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());
  
  return cors({
    origin: allowedOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })(c, next);
});

// 健康检查端点
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development',
    version: '1.0.0'
  });
});

// API根路径
app.get('/', (c) => {
  return c.json({
    message: 'Home List API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      tasks: '/api/tasks',
      family: '/api/family',
      migration: '/api/migration',
      health: '/health'
    }
  });
});

// 路由配置
app.route('/api/auth', auth);
app.route('/api/tasks', tasks);
app.route('/api/family', family);
app.route('/api/migration', migration);

// 全局错误处理
app.onError((err, c) => {
  console.error('Global error handler:', err);
  
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: err.message,
        status: err.status
      },
      err.status
    );
  }
  
  // 数据库错误处理
  if (err.message.includes('UNIQUE constraint failed')) {
    return c.json(
      {
        error: '数据已存在，请检查输入信息',
        details: err.message
      },
      400
    );
  }
  
  // JWT错误处理
  if (err.message.includes('jwt') || err.message.includes('token')) {
    return c.json(
      {
        error: '认证失败，请重新登录',
        details: err.message
      },
      401
    );
  }
  
  // 通用服务器错误
  return c.json(
    {
      error: '服务器内部错误',
      details: c.env.ENVIRONMENT === 'development' ? err.message : undefined
    },
    500
  );
});

// 404处理
app.notFound((c) => {
  return c.json(
    {
      error: '接口不存在',
      path: c.req.path,
      method: c.req.method
    },
    404
  );
});

// 导出应用
export default app;

// 类型导出
export type { Bindings };