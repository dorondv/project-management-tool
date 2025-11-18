// import { motion } from 'framer-motion';
import { MessageSquare, Paperclip, MoreHorizontal } from 'lucide-react';
import { Task } from '../../types';
import { formatDate, getDeadlineStatus } from '../../utils/dateUtils';
import { getPriorityColor, getStatusColor } from '../../utils/colorUtils';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging = false }: TaskCardProps) {
  const deadlineStatus = getDeadlineStatus(task.dueDate);

  return (
    <Card
      hover
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all ${
        isDragging ? 'rotate-2 scale-105 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            {task.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {task.description}
          </p>
        </div>
        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <MoreHorizontal size={14} />
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <Badge variant="secondary" className={getPriorityColor(task.priority)}>
          {task.priority}
        </Badge>
        <Badge variant={deadlineStatus === 'overdue' ? 'error' : deadlineStatus === 'due-soon' ? 'warning' : 'default'}>
          {formatDate(task.dueDate)}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        {/* Assigned users hidden for current version - tasks auto-assigned to single user */}
        <div className="flex items-center space-x-3">
        </div>
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
          {task.comments.length > 0 && (
            <div className="flex items-center space-x-1">
              <MessageSquare size={12} />
              <span className="text-xs">{task.comments.length}</span>
            </div>
          )}
          {task.attachments.length > 0 && (
            <div className="flex items-center space-x-1">
              <Paperclip size={12} />
              <span className="text-xs">{task.attachments.length}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}