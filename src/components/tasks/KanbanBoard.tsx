import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useApp } from '../../context/AppContext';
import { Task, Locale } from '../../types';
import { TaskCard } from './TaskCard';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskModal } from './CreateTaskModal';
import toast from 'react-hot-toast';

const translations: Record<Locale, {
  columns: {
    todo: string;
    inProgress: string;
    completed: string;
  };
  addTask: string;
  toastMoved: string;
  activityDescription: string;
}> = {
  en: {
    columns: {
      todo: 'To Do',
      inProgress: 'In Progress',
      completed: 'Completed',
    },
    addTask: 'Add Task',
    toastMoved: 'Task moved to {status}',
    activityDescription: 'moved task "{title}" to {status}',
  },
  he: {
    columns: {
      todo: 'לביצוע',
      inProgress: 'בתהליך',
      completed: 'הושלמו',
    },
    addTask: 'הוסף משימה',
    toastMoved: 'המשימה הועברה ל{status}',
    activityDescription: 'משימה "{title}" הועברה ל{status}',
  },
};

interface KanbanBoardProps {
  tasks?: Task[];
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

export function KanbanBoard({ tasks, onEdit, onDelete }: KanbanBoardProps = { tasks: undefined }) {
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const countMarginClass = isRTL ? 'mr-2' : 'ml-2';
  const baseColumns = [
    { 
      id: 'todo', 
      title: t.columns.todo, 
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      textColor: 'text-pink-600 dark:text-pink-400',
      dragColor: 'bg-pink-100 dark:bg-pink-900/20',
      borderColor: 'border-pink-300'
    },
    { 
      id: 'in-progress', 
      title: t.columns.inProgress, 
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      dragColor: 'bg-orange-100 dark:bg-orange-900/20',
      borderColor: 'border-orange-300'
    },
    { 
      id: 'completed', 
      title: t.columns.completed, 
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
      dragColor: 'bg-green-100 dark:bg-green-900/20',
      borderColor: 'border-green-300'
    }
  ] as const;
  // Keep original order for RTL so "לביצוע" (To Do) appears first (on the right)
  const columns = baseColumns;
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  
  // Use provided tasks or fall back to all tasks
  const tasksToUse = tasks || state.tasks;

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    const task = tasksToUse.find(t => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId as 'todo' | 'in-progress' | 'completed';
    const statusKey = newStatus === 'in-progress' ? 'inProgress' : newStatus;
    const statusLabel = t.columns[statusKey as keyof typeof t.columns];

    const updatedTask = {
      ...task,
      status: newStatus,
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    
    // Add activity
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: Date.now().toString(),
        type: 'task_updated',
        description: t.activityDescription
          .replace('{title}', task.title)
          .replace('{status}', statusLabel),
        userId: state.user!.id,
        user: state.user!,
        projectId: task.projectId,
        taskId: task.id,
        createdAt: new Date()
      }
    });

    toast.success(t.toastMoved.replace('{status}', statusLabel));
  };

  const getTasksByStatus = (status: string) => {
    return tasksToUse.filter(task => task.status === status);
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="w-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Mobile: Stack columns vertically, Desktop: Horizontal scroll */}
        <div className={`flex flex-col lg:flex-row overflow-x-auto pb-4 gap-4 lg:gap-6 w-full`}>
          {columns.map((column) => (
            <div key={column.id} className={`flex-shrink-0 w-full lg:w-80 ${isRTL ? 'text-right' : ''}`}>
              <div className={`${column.bgColor} rounded-2xl p-4 mb-4`} dir={isRTL ? 'rtl' : 'ltr'}>
                <h3 className={`font-bold text-lg flex items-center gap-2 ${column.textColor}`}>
                  <span>{column.title}</span>
                  <span className="text-sm bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full px-3 py-1 shadow-sm">
                    {getTasksByStatus(column.id).length}
                  </span>
                </h3>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[300px] p-2 rounded-lg transition-all duration-200 ${
                      snapshot.isDraggingOver ? `${column.dragColor} border-2 ${column.borderColor} border-dashed` : ''
                    }`}
                  >
                    <div className="space-y-3">
                      {getTasksByStatus(column.id).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskCard
                                task={task}
                                onClick={() => setSelectedTask(task)}
                                isDragging={snapshot.isDragging}
                                onEdit={onEdit}
                                onDelete={onDelete}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
      />

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
      />
    </div>
  );
}