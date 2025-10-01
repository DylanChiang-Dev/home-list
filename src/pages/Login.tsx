import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { checkEndpointHealth, getCurrentEndpoint } from '../utils/apiConfig';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(true);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'slow'>('online');
  const { login, isLoading } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('请填写所有必填字段');
      return;
    }
    
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || '登录失败');
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
          <p className="text-gray-600">登录您的账户</p>
        </div>

        {error && (
          <div className={`mb-4 p-4 ${networkStatus === 'offline' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg flex items-center space-x-2`}>
            <AlertCircle className={`w-5 h-5 ${networkStatus === 'offline' ? 'text-red-500' : 'text-yellow-500'}`} />
            <span className={networkStatus === 'offline' ? 'text-red-700' : 'text-yellow-700'}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              邮箱地址
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入邮箱地址"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入密码"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || networkStatus === 'offline'}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>登录中...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>登录</span>
              </>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            还没有账户？{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-500 font-medium">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;