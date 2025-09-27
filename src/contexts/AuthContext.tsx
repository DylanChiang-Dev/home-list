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
  updateUser: (userData: Partial<User>) => void;
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

  // 初始化时检查本地存储的认证信息
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          // TODO: 验证token有效性
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('认证初始化失败:', error);
        // 清除无效的认证信息
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // 登录函数
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // TODO: 实现真实的API调用
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟登录验证
      if (email === 'admin@family.com' && password === 'password') {
        const mockUser: User = {
          id: '1',
          name: '管理员',
          email: email,
          familyId: 'family-1',
          role: 'admin',
          createdAt: new Date().toISOString()
        };
        
        const mockToken = 'mock-jwt-token-' + Date.now();
        
        // 保存到本地存储
        localStorage.setItem('authToken', mockToken);
        localStorage.setItem('userData', JSON.stringify(mockUser));
        
        setUser(mockUser);
        return { success: true };
      } else {
        return { success: false, error: '邮箱或密码错误' };
      }
    } catch (error) {
      console.error('登录失败:', error);
      return { success: false, error: '登录失败，请稍后重试' };
    } finally {
      setIsLoading(false);
    }
  };

  // 注册函数
  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // TODO: 实现真实的API调用
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟注册逻辑
      const mockUser: User = {
        id: 'user-' + Date.now(),
        name: userData.name,
        email: userData.email,
        familyId: userData.registrationType === 'create' ? 'family-' + Date.now() : 'family-existing',
        role: userData.registrationType === 'create' ? 'admin' : 'member',
        createdAt: new Date().toISOString()
      };
      
      const mockToken = 'mock-jwt-token-' + Date.now();
      
      // 保存到本地存储
      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('userData', JSON.stringify(mockUser));
      
      setUser(mockUser);
      return { success: true };
    } catch (error) {
      console.error('注册失败:', error);
      return { success: false, error: '注册失败，请稍后重试' };
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
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
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