import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, Edit3, Save, X, Eye, EyeOff, Shield, Bell, Palette } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  joinedAt: string;
  avatar?: string;
  familyName: string;
  tasksCreated: number;
  tasksCompleted: number;
  tasksAssigned: number;
}

interface UserSettings {
  emailNotifications: boolean;
  taskReminders: boolean;
  weeklyReports: boolean;
  theme: 'light' | 'dark' | 'auto';
}

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'security'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 模拟用户数据
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '1',
    name: '家庭管理员',
    email: 'admin@example.com',
    role: 'admin',
    joinedAt: '2024-01-01',
    familyName: '温馨之家',
    tasksCreated: 25,
    tasksCompleted: 18,
    tasksAssigned: 12
  });
  
  const [editForm, setEditForm] = useState({
    name: userProfile.name,
    email: userProfile.email
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    taskReminders: true,
    weeklyReports: false,
    theme: 'light'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm({
        name: userProfile.name,
        email: userProfile.email
      });
      setErrors({});
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = () => {
    const newErrors: Record<string, string> = {};
    
    if (!editForm.name.trim()) {
      newErrors.name = '请输入姓名';
    }
    
    if (!editForm.email.trim()) {
      newErrors.email = '请输入邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setUserProfile(prev => ({
      ...prev,
      name: editForm.name,
      email: editForm.email
    }));
    
    setIsEditing(false);
    setErrors({});
  };

  const handlePasswordChange = () => {
    const newErrors: Record<string, string> = {};
    
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = '请输入当前密码';
    }
    
    if (!passwordForm.newPassword) {
      newErrors.newPassword = '请输入新密码';
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = '密码长度至少6位';
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // TODO: 实现密码修改逻辑
    console.log('Changing password...');
    
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordForm(false);
    setErrors({});
  };

  const handleSettingChange = (key: keyof UserSettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getCompletionRate = () => {
    if (userProfile.tasksAssigned === 0) return 0;
    return Math.round((userProfile.tasksCompleted / userProfile.tasksAssigned) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回看板</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">个人中心</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* 标签页导航 */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>个人信息</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>通知设置</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'security'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>安全设置</span>
                </div>
              </button>
            </nav>
          </div>

          {/* 个人信息标签页 */}
          {activeTab === 'profile' && (
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{userProfile.name}</h2>
                    <p className="text-gray-600">{userProfile.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        userProfile.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {userProfile.role === 'admin' ? '管理员' : '成员'}
                      </span>
                      <span className="text-sm text-gray-500">·</span>
                      <span className="text-sm text-gray-500">{userProfile.familyName}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleEditToggle}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>取消</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      <span>编辑</span>
                    </>
                  )}
                </button>
              </div>

              {/* 编辑表单 */}
              {isEditing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-blue-900 mb-4">编辑个人信息</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        姓名
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        邮箱
                      </label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      onClick={handleEditToggle}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>保存</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 统计信息 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">创建的任务</p>
                      <p className="text-2xl font-bold text-blue-900">{userProfile.tasksCreated}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Edit3 className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">完成的任务</p>
                      <p className="text-2xl font-bold text-green-900">{userProfile.tasksCompleted}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">分配的任务</p>
                      <p className="text-2xl font-bold text-purple-900">{userProfile.tasksAssigned}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 完成率 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900">任务完成率</h3>
                  <span className="text-sm text-gray-600">
                    {userProfile.tasksCompleted}/{userProfile.tasksAssigned}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${getCompletionRate()}%` }}
                  ></div>
                </div>
                <div className="text-right mt-2">
                  <span className="text-sm text-gray-600">{getCompletionRate()}% 完成</span>
                </div>
              </div>

              {/* 基本信息 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-4">基本信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-700">邮箱地址</p>
                      <p className="text-gray-600">{userProfile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-700">加入时间</p>
                      <p className="text-gray-600">{new Date(userProfile.joinedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 通知设置标签页 */}
          {activeTab === 'settings' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">通知设置</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div>
                    <h3 className="font-medium text-gray-900">邮件通知</h3>
                    <p className="text-sm text-gray-600">接收任务相关的邮件通知</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div>
                    <h3 className="font-medium text-gray-900">任务提醒</h3>
                    <p className="text-sm text-gray-600">任务截止前的提醒通知</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.taskReminders}
                      onChange={(e) => handleSettingChange('taskReminders', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div>
                    <h3 className="font-medium text-gray-900">周报</h3>
                    <p className="text-sm text-gray-600">每周任务完成情况报告</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.weeklyReports}
                      onChange={(e) => handleSettingChange('weeklyReports', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="py-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Palette className="w-5 h-5 text-gray-400" />
                    <h3 className="font-medium text-gray-900">主题设置</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(['light', 'dark', 'auto'] as const).map((theme) => (
                      <label key={theme} className="cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value={theme}
                          checked={settings.theme === theme}
                          onChange={(e) => handleSettingChange('theme', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border-2 text-center transition-all ${
                          settings.theme === theme
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}>
                          <span className="font-medium">
                            {theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '自动'}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 安全设置标签页 */}
          {activeTab === 'security' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">安全设置</h2>
              
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-800">密码安全</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        定期更换密码可以提高账户安全性
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div>
                    <h3 className="font-medium text-gray-900">修改密码</h3>
                    <p className="text-sm text-gray-600">更改您的登录密码</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {showPasswordForm ? '取消' : '修改密码'}
                  </button>
                </div>
                
                {showPasswordForm && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-4">修改密码</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          当前密码
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.currentPassword && (
                          <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          新密码
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors.newPassword ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.newPassword && (
                          <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          确认新密码
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-4">
                      <button
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setErrors({});
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={handlePasswordChange}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        确认修改
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;