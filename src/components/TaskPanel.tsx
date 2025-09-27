import React from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, Clock, CheckCircle, Circle, Play } from 'lucide-react';
import { Task, TaskTypeLabels, TaskStatusLabels, TaskPriorityLabels, TaskTypeColors, TaskStatusColors, TaskPriorityColors } from '../types/task';

interface TaskPanelProps {
  selectedDate: Date;
  tasks: Task[];
  onTaskStatusChange: (taskId: string, status: Task['status']) => void;
}

const TaskPanel: React.FC<TaskPanelProps> = ({ selectedDate, tasks, onTaskStatusChange }) => {
  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明天';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Play className="w-5 h-5 text-blue-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleStatusClick = (task: Task) => {
    let newStatus: Task['status'];
    switch (task.status) {
      case 'pending':
        newStatus = 'in_progress';
        break;
      case 'in_progress':
        newStatus = 'completed';
        break;
      case 'completed':
        newStatus = 'pending';
        break;
      default:
        newStatus = 'pending';
    }
    onTaskStatusChange(task.id, newStatus);
  };

  const groupTasksByType = (tasks: Task[]) => {
    return tasks.reduce((groups, task) => {
      if (!groups[task.type]) {
        groups[task.type] = [];
      }
      groups[task.type].push(task);
      return groups;
    }, {} as Record<Task['type'], Task[]>);
  };

  const groupedTasks = groupTasksByType(tasks);
  const taskTypes: Task['type'][] = ['regular', 'long_term', 'recurring'];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      {/* 面板头部 */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {formatDate(selectedDate)}的任务
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          共 {tasks.length} 个任务
        </p>
      </div>

      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-500 mb-2">暂无任务</h4>
            <p className="text-gray-400 mb-4">这一天还没有安排任务</p>
            <Link
              to="/create-task"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              创建任务
            </Link>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {taskTypes.map(type => {
              const typeTasks = groupedTasks[type] || [];
              if (typeTasks.length === 0) return null;

              return (
                <div key={type} className="space-y-2">
                  {/* 任务类型标题 */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${TaskTypeColors[type].dot}`}></div>
                    <h4 className="text-sm font-medium text-gray-700">
                      {TaskTypeLabels[type]} ({typeTasks.length})
                    </h4>
                  </div>

                  {/* 任务列表 */}
                  <div className="space-y-2 ml-5">
                    {typeTasks.map(task => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                          task.status === 'completed' ? 'bg-gray-50 opacity-75' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* 状态图标 */}
                          <button
                            onClick={() => handleStatusClick(task)}
                            className="mt-0.5 hover:scale-110 transition-transform"
                            title="点击切换状态"
                          >
                            {getStatusIcon(task.status)}
                          </button>

                          {/* 任务内容 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h5 className={`text-sm font-medium truncate ${
                                task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}>
                                {task.title}
                              </h5>
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${TaskPriorityColors[task.priority].bg} ${TaskPriorityColors[task.priority].text}`}>
                                {TaskPriorityLabels[task.priority]}
                              </span>
                            </div>

                            {task.description && (
                              <p className={`text-xs mt-1 line-clamp-2 ${
                                task.status === 'completed' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {task.description}
                              </p>
                            )}

                            {/* 任务信息 */}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{task.assigneeName}</span>
                              </div>
                              
                              <span className={`px-2 py-1 rounded-full ${TaskStatusColors[task.status].bg} ${TaskStatusColors[task.status].text}`}>
                                {TaskStatusLabels[task.status]}
                              </span>

                              {task.dueDate && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center space-x-2">
                                {task.type === 'recurring' && (
                                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                    重复任务
                                  </span>
                                )}
                                {task.type === 'long_term' && (
                                  <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                    长期任务
                                  </span>
                                )}
                              </div>
                              
                              <Link
                                to={`/task/${task.id}`}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                查看详情
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskPanel;