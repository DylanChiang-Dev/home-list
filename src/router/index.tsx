import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import TaskDetail from '../pages/TaskDetail';
import CreateTask from '../pages/CreateTask';
import FamilyManagement from '../pages/FamilyManagement';
import Profile from '../pages/Profile';

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// 公开路由组件（已登录用户重定向到仪表板）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }
  
  return !user ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// 创建路由配置
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    )
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <Register />
      </PublicRoute>
    )
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/task/:id',
    element: (
      <ProtectedRoute>
        <TaskDetail />
      </ProtectedRoute>
    )
  },
  {
    path: '/create-task',
    element: (
      <ProtectedRoute>
        <CreateTask />
      </ProtectedRoute>
    )
  },
  {
    path: '/family',
    element: (
      <ProtectedRoute>
        <FamilyManagement />
      </ProtectedRoute>
    )
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    )
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />
  }
]);

export default router;