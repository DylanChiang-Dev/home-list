import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '../types/task';

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

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    if (tasks.length > 0 && dateStr === '2025-09-30') {
      console.log(`[Calendar] === 調試 9/30 任務匹配 ===`);
      console.log(`[Calendar] 查找日期: ${dateStr}`);
      console.log(`[Calendar] 任務列表:`, tasks.map(t => ({
        title: t.title,
        type: t.type,
        dueDate: t.dueDate,
        dueDateType: typeof t.dueDate
      })));
    }
    const filteredTasks = tasks.filter(task => {
      // 检查结束日期
      if (task.recurringRule?.endDate) {
        const endDate = new Date(task.recurringRule.endDate);
        if (date > endDate) return false;
      }
      
      // 处理长期任务 - 每天都显示直到截止日期
      if (task.type === 'long_term') {
        const createdDate = new Date(task.createdAt);
        if (date < createdDate) return false;
        
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          return date <= dueDate;
        }
        return true;
      }
      
      // 处理重复任务
      if (task.type === 'recurring') {
        const createdDate = new Date(task.createdAt);
        if (date < createdDate) return false;
        
        if (task.recurringRule) {
          const { type, interval, daysOfWeek, daysOfMonth, monthsOfYear, datesOfYear } = task.recurringRule;
          const daysDiff = Math.floor((date.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (type === 'daily') {
            return daysDiff % (interval || 1) === 0;
          } 
          
          else if (type === 'weekly') {
            const weeksDiff = Math.floor(daysDiff / 7);
            const isCorrectWeek = weeksDiff % (interval || 1) === 0;
            const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // 转换为1-7格式
            const isCorrectDay = daysOfWeek && daysOfWeek.includes(dayOfWeek);
            return isCorrectWeek && isCorrectDay;
          } 
          
          else if (type === 'monthly') {
            const currentMonth = date.getMonth();
            const currentDay = date.getDate();
            const createdMonth = createdDate.getMonth();
            const monthsDiff = (date.getFullYear() - createdDate.getFullYear()) * 12 + (currentMonth - createdMonth);
            const isCorrectMonth = monthsDiff % (interval || 1) === 0;
            const isCorrectDay = daysOfMonth && daysOfMonth.includes(currentDay);
            return isCorrectMonth && isCorrectDay;
          } 
          
          else if (type === 'yearly') {
            const currentYear = date.getFullYear();
            const currentMonth = date.getMonth() + 1; // 转换为1-12格式
            const currentDay = date.getDate();
            const createdYear = createdDate.getFullYear();
            const yearsDiff = currentYear - createdYear;
            const isCorrectYear = yearsDiff % (interval || 1) === 0;
            
            // 检查月份批量设置
            if (monthsOfYear && monthsOfYear.includes(currentMonth)) {
              return isCorrectYear;
            }
            
            // 检查具体日期设置
            if (datesOfYear && datesOfYear.some(d => d.month === currentMonth && d.day === currentDay)) {
              return isCorrectYear;
            }
            
            return false;
          }
        }
        return false;
      }
      
      // 处理常规任务 - 只在截止日期显示
      if (task.type === 'regular' && task.dueDate) {
        const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
        const matches = taskDate === dateStr;
        if (matches) {
          console.log(`[Calendar] ✓ 找到任務: ${task.title}, dueDate: ${task.dueDate}, taskDate: ${taskDate}`);
        }
        return matches;
      }

      return false;
    });
    console.log(`[Calendar] 日期 ${dateStr} 共有 ${filteredTasks.length} 個任務`);
    return filteredTasks;
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
      const allDayTasks = getTasksForDate(date);
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const isToday = new Date().toDateString() === date.toDateString();

      // 按优先级排序任务：regular > long_term > recurring
      const sortedTasks = allDayTasks.sort((a, b) => {
        const priority = { regular: 3, long_term: 2, recurring: 1 };
        return priority[b.type] - priority[a.type];
      });

      // 按优先级和数量限制选择要显示的任务
      const regularTasks = sortedTasks.filter(task => task.type === 'regular').slice(0, 2);
      const longTermTasks = sortedTasks.filter(task => task.type === 'long_term').slice(0, 1);
      const recurringTasks = sortedTasks.filter(task => task.type === 'recurring').slice(0, 1);
      
      const displayTasks = [...regularTasks, ...longTermTasks, ...recurringTasks];
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