import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, UserPlus, Copy, Check, Trash2, Crown, User, Mail, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiGet, apiPost, apiDelete, API_ENDPOINTS } from '../utils/api';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  joinedAt: string;
  tasksCount: number;
  completedTasks: number;
}

interface InviteCode {
  id: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  usedCount: number;
  maxUses: number;
}

const FamilyManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'members' | 'invites'>('members');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showCreateInvite, setShowCreateInvite] = useState(false);
  const [newInviteMaxUses, setNewInviteMaxUses] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 創建家庭相關狀態
  const [showCreateFamily, setShowCreateFamily] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [familyDescription, setFamilyDescription] = useState('');
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [hasFamily, setHasFamily] = useState(false);
  
  const { user } = useAuth();
  // 动态获取家庭成员数据
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  
  // 加载家庭成员数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // 加載家庭成員數據
         const membersResponse = await apiGet<FamilyMember[]>(API_ENDPOINTS.FAMILY.MEMBERS);
         if (membersResponse.success && membersResponse.data) {
           setFamilyMembers(membersResponse.data);
           setHasFamily(true);
        } else {
          // 如果是權限錯誤，可能用戶沒有家庭
          if (membersResponse.error?.includes('权限') || membersResponse.error?.includes('家庭')) {
            setHasFamily(false);
            setFamilyMembers([]);
          } else {
            throw new Error(membersResponse.error || '加載家庭成員失敗');
          }
        }
        
        // 只有當用戶有家庭時才加載邀請碼
        if (hasFamily) {
          const invitesResponse = await apiGet<InviteCode[]>(API_ENDPOINTS.FAMILY.INVITES);
          if (invitesResponse.success && invitesResponse.data) {
            setInviteCodes(invitesResponse.data);
          } else {
            // 邀請碼加載失敗不阻止頁面顯示，只記錄錯誤
            console.error('加載邀請碼失敗:', invitesResponse.error);
          }
        }
      } catch (err) {
        console.error('加載數據失敗:', err);
        setError(err.message || '加載數據失敗');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, hasFamily]);
  
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Error: Failed to copy invite code');
    }
  };

  const handleCreateInvite = async () => {
    try {
      setError('');
      const response = await apiPost<InviteCode>(API_ENDPOINTS.FAMILY.INVITES, {
         maxUses: newInviteMaxUses
       });
       
       if (response.success && response.data) {
         setInviteCodes([response.data, ...inviteCodes]);
        setShowCreateInvite(false);
        setNewInviteMaxUses(5);
      } else {
        throw new Error(response.error || '創建邀請碼失敗');
      }
    } catch (err) {
      console.error('創建邀請碼失敗:', err);
      setError(err.message || '創建邀請碼失敗');
    }
  };

  const handleDeleteInvite = async (id: string) => {
    try {
      setError('');
      const response = await apiDelete(API_ENDPOINTS.FAMILY.DELETE_INVITE(id));
      
      if (response.success) {
        setInviteCodes(inviteCodes.filter(invite => invite.id !== id));
      } else {
        throw new Error(response.error || '刪除邀請碼失敗');
      }
    } catch (err) {
      console.error('刪除邀請碼失敗:', err);
      setError(err.message || '刪除邀請碼失敗');
    }
  };

  // 創建家庭處理函數
  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      setError('請輸入家庭名稱');
      return;
    }

    try {
      setCreatingFamily(true);
      setError('');
      
      const response = await apiPost(API_ENDPOINTS.FAMILY.CREATE, {
        name: familyName.trim(),
        description: familyDescription.trim()
      });
      
      if (response.success) {
        setHasFamily(true);
        setShowCreateFamily(false);
        setFamilyName('');
        setFamilyDescription('');
        // 重新加載數據
        window.location.reload();
      } else {
        throw new Error(response.error || '創建家庭失敗');
      }
    } catch (err) {
      console.error('創建家庭失敗:', err);
      setError(err.message || '創建家庭失敗');
    } finally {
      setCreatingFamily(false);
    }
  };

  const getCompletionRate = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const isMaxUsed = (usedCount: number, maxUses: number) => {
    return usedCount >= maxUses;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加載中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <h1 className="text-xl font-semibold text-gray-900">家庭管理</h1>
            </div>
          </div>
        </div>
      </header>

      {/* 錯誤提示 */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 如果用戶沒有家庭，顯示創建家庭界面 */}
        {!hasFamily && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="max-w-md mx-auto">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">歡迎使用家庭管理</h2>
              <p className="text-gray-600 mb-6">您還沒有加入任何家庭，請先創建一個家庭或使用邀請碼加入現有家庭。</p>
              
              {!showCreateFamily ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowCreateFamily(true)}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    創建新家庭
                  </button>
                  <p className="text-sm text-gray-500">或者使用邀請碼加入現有家庭</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      家庭名稱 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder="請輸入家庭名稱"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      家庭描述（可選）
                    </label>
                    <textarea
                      value={familyDescription}
                      onChange={(e) => setFamilyDescription(e.target.value)}
                      placeholder="請輸入家庭描述"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCreateFamily}
                      disabled={creatingFamily}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {creatingFamily && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                      <span>{creatingFamily ? '創建中...' : '創建家庭'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateFamily(false);
                        setFamilyName('');
                        setFamilyDescription('');
                        setError('');
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 标签页导航 - 只有當用戶有家庭時才顯示 */}
        {hasFamily && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('members')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'members'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>家庭成员</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {familyMembers.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('invites')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'invites'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5" />
                  <span>邀请管理</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {inviteCodes.length}
                  </span>
                </div>
              </button>
            </nav>
          </div>

          {/* 家庭成员标签页 */}
          {activeTab === 'members' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {familyMembers.map((member) => {
                  const completionRate = getCompletionRate(member.completedTasks, member.tasksCount);
                  
                  return (
                    <div key={member.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            {member.role === 'admin' ? (
                              <Crown className="w-5 h-5 text-blue-600" />
                            ) : (
                              <User className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{member.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              member.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {member.role === 'admin' ? '管理员' : '成员'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>{member.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>加入时间：{new Date(member.joinedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">任务完成情况</span>
                          <span className="text-sm text-gray-600">
                            {member.completedTasks}/{member.tasksCount}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                        <div className="text-right mt-1">
                          <span className="text-xs text-gray-500">{completionRate}% 完成</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 邀请管理标签页 */}
          {activeTab === 'invites' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">邀请码管理</h2>
                  <p className="text-sm text-gray-600 mt-1">创建和管理家庭邀请码，让新成员加入您的家庭</p>
                </div>
                <button
                  onClick={() => setShowCreateInvite(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>创建邀请码</span>
                </button>
              </div>

              {/* 创建邀请码表单 */}
              {showCreateInvite && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-blue-900 mb-3">创建新邀请码</h3>
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        最大使用次数
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={newInviteMaxUses}
                        onChange={(e) => setNewInviteMaxUses(parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCreateInvite}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        创建
                      </button>
                      <button
                        onClick={() => setShowCreateInvite(false)}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 邀请码列表 */}
              <div className="space-y-4">
                {inviteCodes.map((invite) => {
                  const expired = isExpired(invite.expiresAt);
                  const maxUsed = isMaxUsed(invite.usedCount, invite.maxUses);
                  const isInactive = expired || maxUsed;
                  
                  return (
                    <div key={invite.id} className={`border rounded-lg p-4 ${
                      isInactive ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <code className={`text-lg font-mono px-3 py-1 rounded ${
                              isInactive ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {invite.code}
                            </code>
                            <button
                              onClick={() => handleCopyCode(invite.code)}
                              disabled={isInactive}
                              className={`p-2 rounded-md transition-colors ${
                                isInactive 
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                              }`}
                              title="复制邀请码"
                            >
                              {copiedCode === invite.code ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">创建时间：</span>
                              <br />
                              {new Date(invite.createdAt).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">过期时间：</span>
                              <br />
                              <span className={expired ? 'text-red-600' : ''}>
                                {new Date(invite.expiresAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">使用情况：</span>
                              <br />
                              <span className={maxUsed ? 'text-red-600' : ''}>
                                {invite.usedCount}/{invite.maxUses}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">状态：</span>
                              <br />
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                expired ? 'bg-red-100 text-red-800' :
                                maxUsed ? 'bg-orange-100 text-orange-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {expired ? '已过期' : maxUsed ? '已用完' : '可用'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleDeleteInvite(invite.id)}
                          className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                          title="删除邀请码"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {inviteCodes.length === 0 && (
                  <div className="text-center py-12">
                    <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无邀请码</h3>
                    <p className="text-gray-600 mb-4">创建邀请码来邀请新成员加入您的家庭</p>
                    <button
                      onClick={() => setShowCreateInvite(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      创建第一个邀请码
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default FamilyManagement;