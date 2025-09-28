#!/usr/bin/env node

/**
 * 本地Mock API服务器
 * 作为Cloudflare Workers API的备用方案
 * 端口: 3001
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// 中间件
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 模拟数据
const mockData = {
  users: [
    {
      id: '1',
      email: 'test@example.com',
      name: '测试用户',
      avatar: null,
      created_at: new Date().toISOString()
    }
  ],
  families: [
    {
      id: '1',
      name: '我的家庭',
      description: '温馨的家',
      created_by: '1',
      created_at: new Date().toISOString()
    }
  ],
  familyMembers: [
    {
      id: '1',
      family_id: '1',
      user_id: '1',
      role: 'admin',
      joined_at: new Date().toISOString()
    }
  ],
  tasks: [
    {
      id: '1',
      title: '买菜',
      description: '去超市买今天的菜',
      status: 'pending',
      priority: 'medium',
      assigned_to: '1',
      family_id: '1',
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: '洗衣服',
      description: '洗本周的衣服',
      status: 'completed',
      priority: 'low',
      assigned_to: '1',
      family_id: '1',
      completed_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  invites: [
    {
      id: '1',
      family_id: '1',
      code: 'ABC123',
      created_by: '1',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    }
  ]
};

// 认证中间件
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: '缺少认证token', status: 401 });
  }
  // 简单的token验证（实际应用中应该验证JWT）
  if (token !== 'mock-token') {
    return res.status(401).json({ error: '无效的认证token', status: 401 });
  }
  req.userId = '1'; // 模拟用户ID
  next();
};

// 健康检查端点
app.get('/', (req, res) => {
  res.json({ 
    message: 'Mock API Server is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /health',
      'GET /api/health', 
      'GET /api/auth/me',
      'GET /api/family/members',
      'GET /api/family/invites',
      'GET /api/tasks'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'mock-api', timestamp: new Date().toISOString() });
});

// 认证相关端点
app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = mockData.users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json({ success: true, data: user });
});

// 家庭成员端点
app.get('/api/family/members', requireAuth, (req, res) => {
  const members = mockData.familyMembers.map(member => {
    const user = mockData.users.find(u => u.id === member.user_id);
    const family = mockData.families.find(f => f.id === member.family_id);
    return {
      ...member,
      user: user ? { id: user.id, name: user.name, email: user.email, avatar: user.avatar } : null,
      family: family ? { id: family.id, name: family.name } : null
    };
  });
  
  res.json({ 
    success: true, 
    data: members,
    total: members.length
  });
});

// 家庭邀请端点
app.get('/api/family/invites', requireAuth, (req, res) => {
  const invites = mockData.invites.map(invite => {
    const family = mockData.families.find(f => f.id === invite.family_id);
    const creator = mockData.users.find(u => u.id === invite.created_by);
    return {
      ...invite,
      family: family ? { id: family.id, name: family.name } : null,
      creator: creator ? { id: creator.id, name: creator.name } : null
    };
  });
  
  res.json({ 
    success: true, 
    data: invites,
    total: invites.length
  });
});

// 任务端点
app.get('/api/tasks', requireAuth, (req, res) => {
  const { status, priority, assigned_to } = req.query;
  let tasks = [...mockData.tasks];
  
  // 过滤条件
  if (status) {
    tasks = tasks.filter(task => task.status === status);
  }
  if (priority) {
    tasks = tasks.filter(task => task.priority === priority);
  }
  if (assigned_to) {
    tasks = tasks.filter(task => task.assigned_to === assigned_to);
  }
  
  // 添加关联数据
  const enrichedTasks = tasks.map(task => {
    const assignee = mockData.users.find(u => u.id === task.assigned_to);
    const family = mockData.families.find(f => f.id === task.family_id);
    return {
      ...task,
      assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
      family: family ? { id: family.id, name: family.name } : null
    };
  });
  
  res.json({ 
    success: true, 
    data: enrichedTasks,
    total: enrichedTasks.length,
    filters: { status, priority, assigned_to }
  });
});

// 创建任务
app.post('/api/tasks', requireAuth, (req, res) => {
  const { title, description, priority = 'medium', due_date } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: '任务标题不能为空' });
  }
  
  const newTask = {
    id: String(mockData.tasks.length + 1),
    title,
    description: description || '',
    status: 'pending',
    priority,
    assigned_to: req.userId,
    family_id: '1',
    due_date: due_date || null,
    created_at: new Date().toISOString()
  };
  
  mockData.tasks.push(newTask);
  
  res.status(201).json({ 
    success: true, 
    data: newTask,
    message: '任务创建成功'
  });
});

// 更新任务状态
app.patch('/api/tasks/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { status, title, description, priority, due_date } = req.body;
  
  const taskIndex = mockData.tasks.findIndex(task => task.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  const task = mockData.tasks[taskIndex];
  
  // 更新字段
  if (status !== undefined) task.status = status;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;
  if (due_date !== undefined) task.due_date = due_date;
  
  // 如果状态改为completed，添加完成时间
  if (status === 'completed' && !task.completed_at) {
    task.completed_at = new Date().toISOString();
  }
  
  task.updated_at = new Date().toISOString();
  
  res.json({ 
    success: true, 
    data: task,
    message: '任务更新成功'
  });
});

// 删除任务
app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  
  const taskIndex = mockData.tasks.findIndex(task => task.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  mockData.tasks.splice(taskIndex, 1);
  
  res.json({ 
    success: true, 
    message: '任务删除成功'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ 
    error: '端点不存在',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🚀 Mock API Server 启动成功!`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
  console.log(`📚 API文档: http://localhost:${PORT}/`);
  console.log(`\n可用端点:`);
  console.log(`  GET  /                     - 服务信息`);
  console.log(`  GET  /health               - 健康检查`);
  console.log(`  GET  /api/health           - API健康检查`);
  console.log(`  GET  /api/auth/me          - 获取当前用户`);
  console.log(`  GET  /api/family/members   - 获取家庭成员`);
  console.log(`  GET  /api/family/invites   - 获取家庭邀请`);
  console.log(`  GET  /api/tasks            - 获取任务列表`);
  console.log(`  POST /api/tasks            - 创建新任务`);
  console.log(`  PATCH /api/tasks/:id       - 更新任务`);
  console.log(`  DELETE /api/tasks/:id      - 删除任务`);
  console.log(`\n💡 认证Token: mock-token`);
  console.log(`\n⚠️  这是一个Mock服务器，仅用于开发和测试!\n`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 Mock API Server 正在关闭...');
  process.exit(0);
});

export default app;