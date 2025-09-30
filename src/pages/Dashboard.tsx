import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, Settings, LogOut, Filter, Database, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui';
import Calendar from '../components/Calendar';
import TaskPanel from '../components/TaskPanel';
// import ApiEndpointSwitcher from '../components/ApiEndpointSwitcher'; // 已移除：不需要在生產環境顯示
import { Task, TaskFilter, TaskTypeLabels } from '../types/task';
import { apiGet, apiPut, API_ENDPOINTS } from '../utils/api';
import { convertTasksFromAPI, convertTaskFromAPI } from '../utils/dataConverter';
import { getTasksForDate, sortTasksByPriority } from '../utils/taskFilters';

const Dashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filter, setFilter] = useState<TaskFilter>({
    status: 'all',
    priority: 'all',
    type: 'all',
    assignee: 'all'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  // 任务数据
  const [tasks, setTasks] = useState<Task[]>([]);

  // 从API加载任务数据
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiGet<{tasks: any[], total: number, page: number, limit: number}>(API_ENDPOINTS.TASKS.LIST);
        if (response.success) {
          // 使用統一的數據轉換函數
          const convertedTasks = convertTasksFromAPI(response.data?.tasks || []);
          console.log('[Dashboard] 已加載任務:', convertedTasks.map(t => ({title: t.title, type: t.type, dueDate: t.dueDate})));
          setTasks(convertedTasks);
        } else {
          setError('加載任務失敗');
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
        setError('加載任務時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadTasks();
    }
  }, [user]);

  // 使用 useMemo 優化篩選任務的計算
  const filteredTasks = useMemo(() => {
    // 使用統一的任務過濾函數獲取指定日期的任務
    const tasksForDate = getTasksForDate(tasks, selectedDate);

    // 應用額外的過濾條件
    const filtered = tasksForDate.filter(task => {
      if (filter.status !== 'all' && task.status !== filter.status) return false;
      if (filter.priority !== 'all' && task.priority !== filter.priority) return false;
      if (filter.type !== 'all' && task.type !== filter.type) return false;
      if (filter.assignee !== 'all' && task.assigneeName !== filter.assignee) return false;
      return true;
    });

    // 按優先級排序
    return sortTasksByPriority(filtered);
  }, [tasks, selectedDate, filter]);

  // 使用 useCallback 優化更新任務狀態函數
  const updateTaskStatus = useCallback(async (taskId: string, newStatus: Task['status']) => {
    try {
      const updateData = {
        status: newStatus
      };

      const response = await apiPut<any>(API_ENDPOINTS.TASKS.UPDATE(taskId), updateData);

      if (response.success && response.data) {
        // 使用統一的數據轉換函數
        const updatedTask = convertTaskFromAPI(response.data);

        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId
              ? updatedTask
              : task
          )
        );
      } else {
        setError('更新任務狀態失敗');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('更新任務狀態時發生錯誤');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">任务管理</h1>
              <span className="text-sm text-gray-500">欢迎回来，{user?.name}</span>
            </div>
            <nav className="flex items-center space-x-4">
              {/* <ApiEndpointSwitcher className="mr-2" /> */}
              <Link to="/create-task">
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>创建任务</span>
                </Button>
              </Link>
              <Link to="/family" className="text-gray-600 hover:text-gray-900">
                <Users className="h-5 w-5" />
              </Link>
              <Link to="/migration" className="text-gray-600 hover:text-gray-900" title="数据迁移">
                <Database className="h-5 w-5" />
              </Link>
              <Link to="/profile" className="text-gray-600 hover:text-gray-900">
                <Settings className="h-5 w-5" />
              </Link>
              <Link to="/error-diagnosis" className="text-gray-600 hover:text-gray-900" title="错误诊断">
                <AlertCircle className="h-5 w-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">載入中...</div>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">任务日历</h2>
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                tasks={tasks}
              />
            </div>
          </div>

          {/* Right Side - Task Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedDate.toLocaleDateString('zh-CN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} 的任务
                </h2>
                
                {/* Filter Controls */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">筛选</span>
                  </div>
                  
                  <select
                    value={filter.type}
                    onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">所有类型</option>
                    <option value="regular">常规任务</option>
                    <option value="long_term">长期任务</option>
                    <option value="recurring">重复任务</option>
                  </select>

                  <select
                    value={filter.status}
                    onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">所有状态</option>
                    <option value="pending">待完成</option>
                    <option value="in_progress">进行中</option>
                    <option value="completed">已完成</option>
                  </select>

                  <select
                    value={filter.priority}
                    onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">所有优先级</option>
                    <option value="high">高优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="low">低优先级</option>
                  </select>
                </div>
              </div>
              
              <TaskPanel
                tasks={filteredTasks}
                selectedDate={selectedDate}
                onTaskStatusChange={updateTaskStatus}
              />
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;