import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Check, User, Calendar, Clock, AlertCircle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  creatorName: string;
  assigneeName: string;
  completerName?: string;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
}

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 模拟任务数据
  const [task, setTask] = useState<Task>({
    id: id || '1',
    title: '打扫客厅',
    description: '周末大扫除，清理客厅卫生，包括拖地、擦桌子、整理物品等。需要准备清洁用品和垃圾袋。',
    status: 'pending',
    priority: 'medium',
    creatorName: '家庭管理员',
    assigneeName: '家庭成员',
    createdAt: '2024-01-15T10:00:00Z',
    dueDate: '2024-01-20T18:00:00Z'
  });

  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待完成';
      case 'in_progress': return '进行中';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return priority;
    }
  };

  const handleStatusChange = async (newStatus: 'pending' | 'in_progress' | 'completed') => {
    setLoading(true);
    
    // TODO: 实现状态更新逻辑
    console.log('Updating task status:', { taskId: task.id, newStatus });
    
    setTimeout(() => {
      setTask(prev => ({
        ...prev,
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
        completerName: newStatus === 'completed' ? '当前用户' : undefined
      }));
      setLoading(false);
    }, 1000);
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    
    // TODO: 实现任务更新逻辑
    console.log('Updating task:', { taskId: task.id, ...editForm });
    
    setTimeout(() => {
      setTask(prev => ({
        ...prev,
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority as 'high' | 'medium' | 'low',
        dueDate: editForm.dueDate ? `${editForm.dueDate}T18:00:00Z` : undefined
      }));
      setIsEditing(false);
      setLoading(false);
    }, 1000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {isEditing ? (
            /* 编辑模式 */
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
                      setEditForm({
                        title: task.title,
                        description: task.description,
                        priority: task.priority,
                        dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
                      });
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
            /* 查看模式 */
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
      </div>
    </div>
  );
};

export default TaskDetail;