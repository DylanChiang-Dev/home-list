import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, AlertCircle, Calendar, User, Clock, Check } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  creatorId: string;
  creatorName: string;
  assigneeId: string;
  assigneeName: string;
  completerId?: string;
  completerName?: string;
}

interface EditForm {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
}

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  });

  useEffect(() => {
    if (id) {
      loadTask(id);
    }
  }, [id]);

  useEffect(() => {
    if (task) {
      setEditForm({
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
      });
    }
  }, [task]);

  const loadTask = async (taskId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw new Error('獲取任務失敗');
      }

      const data = await response.json();
      setTask(data.task);
    } catch (error) {
      console.error('Error loading task:', error);
      setError(error instanceof Error ? error.message : '獲取任務失敗');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待處理';
      case 'in_progress': return '進行中';
      case 'completed': return '已完成';
      default: return '未知';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '未知';
    }
  };

  const handleStatusChange = async (newStatus: 'pending' | 'in_progress' | 'completed') => {
    if (!task) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/tasks/${task.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw new Error('更新任務狀態失敗');
      }

      const data = await response.json();
      setTask(data.task);
    } catch (error) {
      console.error('Error updating task status:', error);
      setError(error instanceof Error ? error.message : '更新任務狀態失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!task) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          priority: editForm.priority,
          dueDate: editForm.dueDate || null
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw new Error('更新任務失敗');
      }

      const data = await response.json();
      setTask(data.task);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
      setError(error instanceof Error ? error.message : '更新任務失敗');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回看板</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">任务详情</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 px-3 py-2 rounded-md transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>编辑</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : !task ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-500">任務不存在</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {isEditing ? (
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      任务标题
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      任务描述
                    </label>
                    <textarea
                      rows={4}
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        优先级
                      </label>
                      <select
                        value={editForm.priority}
                        onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value as 'high' | 'medium' | 'low' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="high">高优先级</option>
                        <option value="medium">中优先级</option>
                        <option value="low">低优先级</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        截止日期
                      </label>
                      <input
                        type="date"
                        value={editForm.dueDate}
                        onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        if (task) {
                          setEditForm({
                            title: task.title,
                            description: task.description,
                            priority: task.priority,
                            dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
                          });
                        }
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* 任务头部 */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-lg leading-relaxed">{task.description}</p>
                </div>
                
                {/* 任务信息 */}
                <div className="p-6 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <AlertCircle className={`w-5 h-5 ${getPriorityColor(task.priority)}`} />
                        <div>
                          <span className="text-sm text-gray-500">优先级</span>
                          <p className={`font-medium ${getPriorityColor(task.priority)}`}>
                            {getPriorityText(task.priority)}优先级
                          </p>
                        </div>
                      </div>
                      
                      {task.dueDate && (
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <span className="text-sm text-gray-500">截止日期</span>
                            <p className="font-medium text-gray-900">{formatDate(task.dueDate)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-500">创建者</span>
                          <p className="font-medium text-gray-900">{task.creatorName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-500">负责人</span>
                          <p className="font-medium text-gray-900">{task.assigneeName}</p>
                        </div>
                      </div>
                      
                      {task.completerName && (
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-green-500" />
                          <div>
                            <span className="text-sm text-gray-500">完成者</span>
                            <p className="font-medium text-green-600">{task.completerName}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 时间信息 */}
                <div className="p-6 border-b border-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <span className="text-sm text-gray-500">创建时间</span>
                        <p className="font-medium text-gray-900">{formatDate(task.createdAt)}</p>
                      </div>
                    </div>
                    
                    {task.completedAt && (
                      <div className="flex items-center space-x-3">
                        <Check className="w-5 h-5 text-green-500" />
                        <div>
                          <span className="text-sm text-gray-500">完成时间</span>
                          <p className="font-medium text-green-600">{formatDate(task.completedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="p-6">
                  <div className="flex flex-wrap gap-3">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange('in_progress')}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? '更新中...' : '开始任务'}
                      </button>
                    )}
                    
                    {task.status === 'in_progress' && (
                      <>
                        <button
                          onClick={() => handleStatusChange('completed')}
                          disabled={loading}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {loading ? '更新中...' : '标记完成'}
                        </button>
                        <button
                          onClick={() => handleStatusChange('pending')}
                          disabled={loading}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                          {loading ? '更新中...' : '暂停任务'}
                        </button>
                      </>
                    )}
                    
                    {task.status === 'completed' && (
                      <button
                        onClick={() => handleStatusChange('pending')}
                        disabled={loading}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? '更新中...' : '重新开始'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetail;