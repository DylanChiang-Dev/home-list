import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 用户类型定义
export interface User {
  id: string;
  name: string;
  email: string;
  familyId: string;
  role: 'member' | 'admin';
  avatar?: string;
  createdAt: string;
}

// 认证上下文类型定义
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

// 注册数据类型
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  familyName?: string;
  inviteCode?: string;
  registrationType: 'create' | 'join';
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 验证token有效性
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('https://home-list-api.dylan-chiang.workers.dev/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          familyId: data.user.familyId || '',
          role: data.user.role,
          createdAt: data.user.createdAt
        };
        
        localStorage.setItem('userData', JSON.stringify(userData));
        setUser(userData);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  };

  // 初始化时检查本地存储的认证信息
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (token) {
        // 验证token有效性
        const isValid = await validateToken(token);
        if (!isValid) {
          // Token无效，清除本地数据
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          setUser(null);
        }
      } else if (userData) {
        // 有用户数据但没有token，清除数据
        localStorage.removeItem('userData');
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  // 登录函数
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('https://home-list-api.dylan-chiang.workers.dev/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          familyId: data.user.familyId || '',
          role: data.user.role,
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(userData));
        setUser(userData);
        
        return { success: true };
      } else {
        return { success: false, error: data.message || '登录失败' };
      }
    } catch (error) {
      console.error('Error: Login failed', error);
      return { success: false, error: '网络错误，请稍后重试' };
    } finally {
      setIsLoading(false);
    }
  };

  // 注册函数
  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('https://home-list-api.dylan-chiang.workers.dev/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        const userInfo = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          familyId: data.user.familyId || '',
          role: data.user.role,
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(userInfo));
        setUser(userInfo);
        
        return { success: true };
      } else {
        return { success: false, error: data.message || '注册失败' };
      }
    } catch (error) {
      console.error('Error: Registration failed', error);
      return { success: false, error: '网络错误，请稍后重试' };
    } finally {
      setIsLoading(false);
    }
  };

  // 登出函数
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  // 更新用户信息
  const updateUser = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        return { success: false, error: '请先登录' };
      }
      
      const response = await fetch('https://home-list-api.dylan-chiang.workers.dev/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const updatedUser = { ...user, ...updates };
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        return { success: true };
      } else {
        return { success: false, error: data.message || '更新失败' };
      }
    } catch (error) {
      console.error('Error: Update failed', error);
      return { success: false, error: '网络错误，请稍后重试' };
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用认证上下文的Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;