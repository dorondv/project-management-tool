import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  User, 
  MessageSquare, 
  Paperclip, 
  Flag, 
  Clock,
  Trash2,
  Send
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { useApp } from '../../context/AppContext';
import { Task, Comment } from '../../types';
import { formatDateTime, getDeadlineStatus } from '../../utils/dateUtils';
import { getPriorityColor } from '../../utils/colorUtils';
import toast from 'react-hot-toast';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export function TaskDetailModal({ isOpen, onClose, task }: TaskDetailModalProps) {
  const { state, dispatch } = useApp();
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (!task) return null;

  const project = state.projects.find(p => p.id === task.projectId);
  const deadlineStatus = getDeadlineStatus(task.dueDate);

  const handleStatusChange = (newStatus: 'todo' | 'in-progress' | 'completed') => {
    const updatedTask = { ...task, status: newStatus, updatedAt: new Date() };
    dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    
    // Add activity
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: Date.now().toString(),
        type: 'task_updated',
        description: `updated task "${task.title}" status to ${newStatus}`,
        userId: state.user!.id,
        user: state.user!,
        projectId: task.projectId,
        taskId: task.id,
        createdAt: new Date()
      }
    });

    toast.success(`Task status updated to ${newStatus.replace('-', ' ')}`);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      userId: state.user!.id,
      user: state.user!,
      createdAt: new Date()
    };

    const updatedTask = {
      ...task,
      comments: [...task.comments, comment],
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    setNewComment('');
    toast.success('Comment added successfully');
  };

  const handleDeleteTask = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch({ type: 'DELETE_TASK', payload: task.id });
      toast.success('Task deleted successfully');
      onClose();
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'todo': return 'default';
      case 'in-progress': return 'primary';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getDeadlineVariant = (status: string) => {
    switch (status) {
      case 'overdue': return 'error';
      case 'due-soon': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Details" size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {task.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {task.description}
            </p>
            <div className="flex items-center space-x-3">
              <Badge variant={getStatusVariant(task.status)}>
                {task.status.replace('-', ' ')}
              </Badge>
              <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                <Flag size={12} className="mr-1" />
                {task.priority}
              </Badge>
              <Badge variant={getDeadlineVariant(deadlineStatus)}>
                <Calendar size={12} className="mr-1" />
                {formatDateTime(task.dueDate)}
              </Badge>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="danger" 
              size="sm" 
              icon={<Trash2 size={16} />}
              onClick={handleDeleteTask}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Status Update */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Update Status</h3>
          <div className="flex space-x-2">
            {['todo', 'in-progress', 'completed'].map((status) => (
              <Button
                key={status}
                variant={task.status === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(status as any)}
              >
                {status.replace('-', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Task Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Project</h3>
            <p className="text-gray-600 dark:text-gray-400">{project?.title}</p>
          </div>
          {/* Assigned users hidden for current version - tasks auto-assigned to single user */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Created</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {formatDateTime(task.createdAt)}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Last Updated</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {formatDateTime(task.updatedAt)}
            </p>
          </div>
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <MessageSquare size={16} className="mr-2" />
            Comments ({task.comments.length})
          </h3>
          
          {/* Add Comment */}
          <div className="mb-4">
            <div className="flex space-x-3">
              <Avatar
                src={state.user?.avatar}
                alt={state.user?.name}
                size="sm"
              />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    icon={<Send size={16} />}
                  >
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4 max-h-60 overflow-y-auto">
            {task.comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex space-x-3"
              >
                <Avatar
                  src={comment.user.avatar}
                  alt={comment.user.name}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {comment.user.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            {task.comments.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}