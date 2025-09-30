import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '../types/task';
import { getTasksForDate, groupTasksByType } from '../utils/taskFilters';

interface CalendarProps {
  tasks: Task[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ tasks, selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  // Memoize tasks by date for performance optimization
  const tasksByDate = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const dateMap = new Map<string, Task[]>();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateKey = date.toDateString();
      const tasksForDay = getTasksForDate(tasks, date);
      dateMap.set(dateKey, tasksForDay);
    }

    return dateMap;
  }, [tasks, currentMonth]);

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // 添加空白天数
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-32 border border-gray-200"></div>
      );
    }

    // 添加月份中的天数
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateKey = date.toDateString();
      const allDayTasks = tasksByDate.get(dateKey) || [];
      const isSelected = selectedDate.toDateString() === dateKey;
      const isToday = new Date().toDateString() === dateKey;

      // 按类型分组任务
      const { regular: regularTasks, longTerm: longTermTasks, recurring: recurringTasks } = groupTasksByType(allDayTasks);

      // 按优先级和数量限制选择要显示的任务
      const displayTasks = [
        ...regularTasks.slice(0, 2),
        ...longTermTasks.slice(0, 1),
        ...recurringTasks.slice(0, 1)
      ];
      const totalTasks = allDayTasks.length;
      const remainingTasks = totalTasks - displayTasks.length;

      days.push(
        <div
          key={day}
          onClick={() => onDateSelect(date)}
          className={`h-32 border border-gray-200 p-2 cursor-pointer hover:bg-blue-50 transition-colors flex flex-col ${
            isSelected ? 'bg-blue-100 border-blue-300' : ''
          } ${
            isToday ? 'bg-yellow-50 border-yellow-300' : ''
          }`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${
              isToday ? 'text-yellow-700' : isSelected ? 'text-blue-700' : 'text-gray-700'
            }`}>
              {day}
            </span>
            {displayTasks.length > 0 && (
              <div className="flex space-x-1">
                {displayTasks.slice(0, 3).map((task, index) => (
                  <div
                    key={task.id}
                    className={`w-2 h-2 rounded-full ${
                      task.type === 'regular' ? 'bg-blue-400' :
                      task.type === 'long_term' ? 'bg-purple-400' :
                      'bg-green-400'
                    }`}
                    title={task.title}
                  ></div>
                ))}
                {(displayTasks.length > 3 || remainingTasks > 0) && (
                  <div className="text-xs text-gray-500">+{Math.max(displayTasks.length - 3, 0) + remainingTasks}</div>
                )}
              </div>
            )}
          </div>
          {displayTasks.length > 0 && (
            <div className="flex-1 space-y-1 overflow-hidden">
              {displayTasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`text-xs truncate px-1 py-0.5 rounded ${
                    task.type === 'regular' ? 'text-blue-700 bg-blue-50' :
                    task.type === 'long_term' ? 'text-purple-700 bg-purple-50' :
                    'text-green-700 bg-green-50'
                  } ${
                    task.status === 'completed' ? 'line-through opacity-60' : ''
                  }`}
                  title={task.title}
                >
                  {task.title}
                </div>
              ))}
              {remainingTasks > 0 && (
                <div className="text-xs text-gray-400 px-1">
                  +{remainingTasks} 更多任务
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 日历头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900">
          {currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7">
        {renderCalendarDays()}
      </div>

      {/* 图例 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <span className="text-gray-600">普通任务</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
            <span className="text-gray-600">长期任务</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-gray-600">重复任务</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;