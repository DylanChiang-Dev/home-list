import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Users, Key, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth, RegisterData } from '../contexts/AuthContext';
import { checkEndpointHealth, getCurrentEndpoint } from '../utils/apiConfig';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    familyName: '',
    inviteCode: ''
  });
  const [registrationType, setRegistrationType] = useState<'create' | 'join'>('create');
  const [error, setError] = useState('');
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(true);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'slow'>('online');
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  // 首次加载时快速检测网络
  useEffect(() => {
    const checkNetwork = async () => {
      const endpoint = getCurrentEndpoint();
      const startTime = Date.now();
      const isHealthy = await checkEndpointHealth(endpoint);
      const duration = Date.now() - startTime;

      if (!isHealthy) {
        setNetworkStatus('offline');
        setError('无法连接到服务器,请检查网络连接');
      } else if (duration > 3000) {
        setNetworkStatus('slow');
        setError('网络连接较慢,可能影响使用体验');
      } else {
        setNetworkStatus('online');
      }

      setIsCheckingNetwork(false);
    };

    checkNetwork();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 验证必填字段
    if (!formData.name || !formData.email || !formData.password) {
      setError('请填写所有必填字段');
      return;
    }
    
    // 验证密码确认
    if (formData.password !== formData.confirmPassword) {
      setError('密码确认不匹配');
      return;
    }
    
    // 验证注册类型相关字段
    if (registrationType === 'create' && !formData.familyName) {
      setError('请输入家庭名称');
      return;
    }
    
    if (registrationType === 'join' && !formData.inviteCode) {
      setError('请输入邀请码');
      return;
    }
    
    const registerData: RegisterData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      familyName: formData.familyName,
      inviteCode: formData.inviteCode,
      registrationType
    };
    
    const result = await register(registerData);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || '注册失败');
    }
  };

  // 显示网络检测加载屏幕
  if (isCheckingNetwork) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-700 text-lg font-medium">正在检测网络连接...</p>
            <p className="text-gray-500 text-sm text-center">
              首次加载需要几秒钟
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">任务管理</h1>
          <p className="text-gray-600">创建您的账户</p>
        </div>

        {error && (
          <div className={`mb-4 p-4 ${networkStatus === 'offline' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg flex items-center space-x-2`}>
            <AlertCircle className={`w-5 h-5 ${networkStatus === 'offline' ? 'text-red-500' : 'text-yellow-500'}`} />
            <span className={networkStatus === 'offline' ? 'text-red-700' : 'text-yellow-700'}>{error}</span>
          </div>
        )}
        
        {/* 注册类型选择 */}
        <div className="mb-6">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setRegistrationType('create')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                registrationType === 'create'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              创建家庭
            </button>
            <button
              type="button"
              onClick={() => setRegistrationType('join')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                registrationType === 'join'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              加入家庭
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              姓名
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入您的姓名"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              邮箱地址
            </label>
            <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入邮箱地址"
                required
                disabled={isLoading}
              />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入密码"
                required
                disabled={isLoading}
              />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              确认密码
            </label>
            <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请再次输入密码"
                required
                disabled={isLoading}
              />
          </div>
          
          {registrationType === 'create' ? (
            <div>
              <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-1">
                家庭名称
              </label>
              <input
                id="familyName"
                name="familyName"
                type="text"
                required
                value={formData.familyName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入家庭名称"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
                邀请码
              </label>
              <input
                id="inviteCode"
                name="inviteCode"
                type="text"
                required
                value={formData.inviteCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入邀请码"
              />
            </div>
          )}
          
          <button
              type="submit"
              disabled={isLoading || networkStatus === 'offline'}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>注册中...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>注册账户</span>
                </>
              )}
            </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            已有账户？{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;