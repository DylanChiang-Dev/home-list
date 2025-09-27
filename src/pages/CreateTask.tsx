import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Calendar, AlertCircle, Repeat, Clock, Target } from 'lucide-react';
import { Task, RecurringRule, TaskTypeLabels, TaskTypeColors } from '../types/task';
import { useAuth } from '../contexts/AuthContext';
import { apiGet, apiPost, API_ENDPOINTS } from '../utils/api';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
}

const CreateTask: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 动态获取家庭成员数据
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  
  // 从API获取家庭成员数据
  useEffect(() => {
    const loadFamilyMembers = async () => {
      try {
        setLoadingMembers(true);
        const response = await apiGet<FamilyMember[]>('/api/family/members');
       if (response.success) {
         const members = response.data || [];
          
          // 确保当前用户在家庭成员列表中
          if (user && !members.find((m: FamilyMember) => m.id === user.id)) {
            members.unshift({
              id: user.id,
              name: user.name,
              email: user.email || 'user@example.com'
            });
          }
          
          setFamilyMembers(members);
        } else {
          // 如果API失败，至少包含當前用戶
          if (user) {
            setFamilyMembers([{
              id: user.id,
              name: user.name,
              email: user.email || 'user@example.com'
            }]);
          }
        }
      } catch (error) {
        console.error('Error loading family members:', error);
        // 如果API失敗，至少包含當前用戶
        if (user) {
          setFamilyMembers([{
            id: user.id,
            name: user.name,
            email: user.email || 'user@example.com'
          }]);
        }
      } finally {
        setLoadingMembers(false);
      }
    };
    
    if (user) {
      loadFamilyMembers();
    }
  }, [user]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: user?.id || '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    type: 'regular' as 'regular' | 'long_term' | 'recurring',
    dueDate: new Date().toISOString().split('T')[0], // 默認為當天
    recurringRule: null as RecurringRule | null
  });

  const [showRecurringOptions, setShowRecurringOptions] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 当用户信息变化时，更新默认负责人
  useEffect(() => {
    if (user?.id && !formData.assigneeId) {
      setFormData(prev => ({ ...prev, assigneeId: user.id }));
    }
  }, [user, formData.assigneeId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 当任务类型改变时，处理重复规则和截止日期
    if (name === 'type') {
      if (value === 'regular') {
        setFormData(prev => ({ 
          ...prev, 
          recurringRule: null,
          dueDate: new Date().toISOString().split('T')[0] // 普通任务默认当天
        }));
        setShowRecurringOptions(false);
      } else if (value === 'recurring') {
        setFormData(prev => ({
          ...prev,
          recurringRule: { type: 'daily', interval: 1 },
          dueDate: '' // 重复任务不需要截止日期
        }));
        setShowRecurringOptions(true);
      } else if (value === 'long_term') {
        setFormData(prev => ({
          ...prev,
          recurringRule: { type: 'weekly', interval: 1, daysOfWeek: [] },
          dueDate: prev.dueDate || '' // 长期任务保持现有日期或为空
        }));
        setShowRecurringOptions(true);
      }
    }
    
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRecurringRuleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      recurringRule: prev.recurringRule ? {
        ...prev.recurringRule,
        [field]: value
      } : null
    }));
  };

  const toggleDayOfWeek = (day: number) => {
    if (!formData.recurringRule) return;
    
    const currentDays = formData.recurringRule.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    
    handleRecurringRuleChange('daysOfWeek', newDays);
  };

  const toggleDayOfMonth = (day: number) => {
    if (!formData.recurringRule) return;
    
    const currentDays = formData.recurringRule.daysOfMonth || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    
    handleRecurringRuleChange('daysOfMonth', newDays);
  };

  const toggleMonthOfYear = (month: number) => {
    if (!formData.recurringRule) return;
    
    const currentMonths = formData.recurringRule.monthsOfYear || [];
    const newMonths = currentMonths.includes(month)
      ? currentMonths.filter(m => m !== month)
      : [...currentMonths, month].sort();
    
    handleRecurringRuleChange('monthsOfYear', newMonths);
  };

  const addYearlyDate = (month: number, day: number) => {
    if (!formData.recurringRule) return;
    
    const currentDates = formData.recurringRule.datesOfYear || [];
    const exists = currentDates.some(d => d.month === month && d.day === day);
    
    if (!exists) {
      const newDates = [...currentDates, { month, day }].sort((a, b) => {
        if (a.month !== b.month) return a.month - b.month;
        return a.day - b.day;
      });
      handleRecurringRuleChange('datesOfYear', newDates);
    }
  };

  const removeYearlyDate = (month: number, day: number) => {
    if (!formData.recurringRule) return;
    
    const currentDates = formData.recurringRule.datesOfYear || [];
    const newDates = currentDates.filter(d => !(d.month === month && d.day === day));
    
    handleRecurringRuleChange('datesOfYear', newDates);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '请输入任务标题';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '请输入任务描述';
    }
    
    if (!formData.assigneeId) {
      newErrors.assigneeId = '请选择负责人';
    }
    
    // 长期任务必须设置截止日期
    if (formData.type === 'long_term' && !formData.dueDate) {
      newErrors.dueDate = '长期任务必须设置截止日期';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 创建新任务对象
      const newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'creatorName' | 'assigneeName'> = {
        title: formData.title,
        description: formData.description,
        status: 'pending',
        priority: formData.priority,
        type: formData.type,
        assigneeId: formData.assigneeId,
        dueDate: formData.dueDate || undefined,
        recurringRule: formData.recurringRule
      };

      // 调用API创建任务
      const response = await apiPost<Task>(API_ENDPOINTS.TASKS.CREATE, newTask);
      
      if (response.error) {
        setErrors({ submit: response.error });
        return;
      }
      
      console.log('任务创建成功:', response.data);
      
      // 成功创建后跳转
      navigate('/dashboard');
    } catch (error) {
      console.error('创建任务失败:', error);
      setErrors({ submit: '创建任务失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高优先级';
      case 'medium': return '中优先级';
      case 'low': return '低优先级';
      default: return '中优先级';
    }
  };

  if (loadingMembers) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入家庭成員資料中...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-semibold text-gray-900">创建任务</h1>
            </div>
          </div>
        </div>
      </header>

      {/* 錯誤提示 */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 任务标题 */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  任务标题 <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="请输入任务标题"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* 任务描述 */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  任务描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    errors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="请详细描述任务内容和要求"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* 负责人选择 */}
              <div>
                <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700 mb-2">
                  负责人 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    id="assigneeId"
                    name="assigneeId"
                    value={formData.assigneeId}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.assigneeId ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                  >
                    <option value="">请选择负责人</option>
                    {familyMembers.length === 0 ? (
                      <option value="" disabled>加载中...</option>
                    ) : familyMembers.length === 1 && user && familyMembers[0].id === user.id ? (
                      <>
                        <option key={familyMembers[0].id} value={familyMembers[0].id}>
                          {familyMembers[0].name}（我）
                        </option>
                        <option value="" disabled style={{color: '#9CA3AF'}}>暂无其他家庭成员</option>
                      </>
                    ) : (
                      familyMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}{member.id === user?.id ? '（我）' : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                {errors.assigneeId && (
                  <p className="mt-1 text-sm text-red-600">{errors.assigneeId}</p>
                )}
              </div>

              {/* 任务类型选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Target className="w-4 h-4 inline mr-2" />
                  任务类型
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['regular', 'long_term', 'recurring'] as const).map(type => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={type}
                        checked={formData.type === type}
                        onChange={handleInputChange}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`px-2 py-1 rounded text-xs font-medium ${TaskTypeColors[type]}`}>
                        {TaskTypeLabels[type]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 优先级选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    优先级
                  </label>
                  <div className="space-y-2">
                    {(['high', 'medium', 'low'] as const).map((priority) => (
                      <label key={priority} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="priority"
                          value={priority}
                          checked={formData.priority === priority}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                          formData.priority === priority
                            ? getPriorityColor(priority)
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <AlertCircle className={`w-5 h-5 ${
                            formData.priority === priority
                              ? priority === 'high' ? 'text-red-600' : priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                              : 'text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            formData.priority === priority
                              ? priority === 'high' ? 'text-red-600' : priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                              : 'text-gray-700'
                          }`}>
                            {getPriorityText(priority)}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 截止日期 */}
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                    截止日期 {formData.type === 'long_term' ? <span className="text-red-500">*</span> : '（可选）'}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      disabled={formData.type === 'recurring'}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formData.type === 'recurring' ? 'bg-gray-100 cursor-not-allowed' : 
                        errors.dueDate ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.dueDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.type === 'recurring' ? '重复任务不需要设置截止日期' : 
                     formData.type === 'long_term' ? '长期任务必须设置截止日期' : 
                     '如不设置截止日期，任务将没有时间限制'}
                  </p>
                </div>
              </div>

              {/* 重复规则设置 */}
              {showRecurringOptions && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <Repeat className="w-4 h-4 mr-2" />
                    重复设置
                  </h3>
                  
                  {/* 重复类型选择 */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">重复类型</label>
                    <select
                      value={formData.recurringRule?.type || 'daily'}
                      onChange={(e) => {
                        const newType = e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly';
                        handleRecurringRuleChange('type', newType);
                        // 重置相关字段
                        if (newType === 'daily') {
                          handleRecurringRuleChange('daysOfWeek', undefined);
                          handleRecurringRuleChange('daysOfMonth', undefined);
                          handleRecurringRuleChange('monthsOfYear', undefined);
                          handleRecurringRuleChange('datesOfYear', undefined);
                        } else if (newType === 'weekly') {
                          handleRecurringRuleChange('daysOfWeek', []);
                          handleRecurringRuleChange('daysOfMonth', undefined);
                          handleRecurringRuleChange('monthsOfYear', undefined);
                          handleRecurringRuleChange('datesOfYear', undefined);
                        } else if (newType === 'monthly') {
                          handleRecurringRuleChange('daysOfWeek', undefined);
                          handleRecurringRuleChange('daysOfMonth', []);
                          handleRecurringRuleChange('monthsOfYear', undefined);
                          handleRecurringRuleChange('datesOfYear', undefined);
                        } else if (newType === 'yearly') {
                          handleRecurringRuleChange('daysOfWeek', undefined);
                          handleRecurringRuleChange('daysOfMonth', undefined);
                          handleRecurringRuleChange('monthsOfYear', []);
                          handleRecurringRuleChange('datesOfYear', []);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="daily">每天</option>
                      <option value="weekly">每周</option>
                      <option value="monthly">每月</option>
                      <option value="yearly">每年</option>
                    </select>
                  </div>
                  
                  {/* 重复间隔 */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">重复间隔</label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">每</span>
                      <input
                        type="number"
                        min="1"
                        max={formData.recurringRule?.type === 'yearly' ? 10 : formData.recurringRule?.type === 'monthly' ? 12 : 30}
                        value={formData.recurringRule?.interval || 1}
                        onChange={(e) => handleRecurringRuleChange('interval', parseInt(e.target.value))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                      <span className="text-sm text-gray-600">
                        {formData.recurringRule?.type === 'daily' ? '天' :
                         formData.recurringRule?.type === 'weekly' ? '周' :
                         formData.recurringRule?.type === 'monthly' ? '月' : '年'}
                      </span>
                    </div>
                  </div>
                  
                  {/* 每周重复 - 选择星期几 */}
                  {formData.recurringRule?.type === 'weekly' && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">选择星期几</label>
                      <div className="flex flex-wrap gap-2">
                        {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, index) => {
                          const dayNumber = index + 1;
                          const isSelected = formData.recurringRule?.daysOfWeek?.includes(dayNumber);
                          return (
                            <button
                              key={dayNumber}
                              type="button"
                              onClick={() => toggleDayOfWeek(dayNumber)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">可选择多个星期几</p>
                    </div>
                  )}
                  
                  {/* 每月重复 - 选择日期 */}
                  {formData.recurringRule?.type === 'monthly' && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">选择日期</label>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                          const isSelected = formData.recurringRule?.daysOfMonth?.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleDayOfMonth(day)}
                              className={`w-8 h-8 text-xs rounded transition-colors ${
                                isSelected
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500">可选择多个日期，如选择1号和15号表示每月1号和15号重复</p>
                    </div>
                  )}
                  
                  {/* 每年重复 - 选择月份和具体日期 */}
                  {formData.recurringRule?.type === 'yearly' && (
                    <div className="space-y-4">
                      {/* 选择月份 */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">选择月份</label>
                        <div className="grid grid-cols-4 gap-2">
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                            const isSelected = formData.recurringRule?.monthsOfYear?.includes(month);
                            const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
                            return (
                              <button
                                key={month}
                                type="button"
                                onClick={() => toggleMonthOfYear(month)}
                                className={`px-2 py-1 text-sm rounded transition-colors ${
                                  isSelected
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {monthNames[month - 1]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* 添加具体日期 */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">添加具体日期</label>
                        <div className="flex items-center space-x-2 mb-2">
                          <select
                            id="yearlyMonth"
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <option key={month} value={month}>{month}月</option>
                            ))}
                          </select>
                          <select
                            id="yearlyDay"
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                              <option key={day} value={day}>{day}日</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const monthSelect = document.getElementById('yearlyMonth') as HTMLSelectElement;
                              const daySelect = document.getElementById('yearlyDay') as HTMLSelectElement;
                              if (monthSelect && daySelect) {
                                addYearlyDate(parseInt(monthSelect.value), parseInt(daySelect.value));
                              }
                            }}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                          >
                            添加
                          </button>
                        </div>
                        
                        {/* 显示已添加的日期 */}
                        {formData.recurringRule?.datesOfYear && formData.recurringRule.datesOfYear.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">已添加的日期：</p>
                            <div className="flex flex-wrap gap-1">
                              {formData.recurringRule.datesOfYear.map((date, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                >
                                  {date.month}月{date.day}日
                                  <button
                                    type="button"
                                    onClick={() => removeYearlyDate(date.month, date.day)}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-1">可以选择月份进行批量设置，也可以添加具体的日期</p>
                      </div>
                    </div>
                  )}
                  
                  {/* 结束日期 */}
                  <div>
                    <label htmlFor="endDate" className="block text-sm text-gray-600 mb-1">结束日期（可选）</label>
                    <input
                      id="endDate"
                      type="date"
                      value={formData.recurringRule?.endDate || ''}
                      onChange={(e) => handleRecurringRuleChange('endDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">如不设置，任务将无限期重复</p>
                  </div>
                </div>
              )}

              {/* 预览卡片 */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">任务预览</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {formData.title || '任务标题'}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${TaskTypeColors[formData.type]}`}>
                          {TaskTypeLabels[formData.type]}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          formData.priority === 'high' ? 'bg-red-100 text-red-800' :
                          formData.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {getPriorityText(formData.priority)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {formData.description || '任务描述'}
                  </p>
                  
                  {/* 重复规则预览 */}
                  {formData.recurringRule && (
                    <div className="mb-3 p-2 bg-blue-50 rounded text-sm">
                      <div className="flex items-center text-blue-700">
                        <Repeat className="w-4 h-4 mr-1" />
                        <span className="font-medium">重复规则：</span>
                      </div>
                      <div className="text-blue-600 mt-1">
                        {formData.type === 'recurring' && (
                          `每 ${formData.recurringRule.interval} 天重复`
                        )}
                        {formData.type === 'long_term' && formData.recurringRule.type === 'weekly' && (
                          `每 ${formData.recurringRule.interval} 周重复` +
                          (formData.recurringRule.daysOfWeek?.length ? 
                            `，在 ${formData.recurringRule.daysOfWeek.map(d => 
                              ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][d-1]
                            ).join('、')}` : '')
                        )}
                        {formData.type === 'long_term' && formData.recurringRule.type === 'monthly' && (
                          `每 ${formData.recurringRule.interval} 月的第 ${formData.recurringRule.daysOfMonth?.join(', ')} 天重复`
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>
                        负责人：{formData.assigneeId ? 
                          familyMembers.find(m => m.id === formData.assigneeId)?.name || '未选择' : 
                          '未选择'
                        }
                      </span>
                    </div>
                    {formData.dueDate && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>截止：{new Date(formData.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>



              {/* 错误提示 */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                </div>
              )}

              {/* 提交按钮 */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Link
                  to="/dashboard"
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  取消
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{loading ? '创建中...' : '创建任务'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTask;