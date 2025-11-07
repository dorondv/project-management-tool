import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, Locale } from '../../types';
import { TaskCard } from './TaskCard';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskModal } from './CreateTaskModal';
import { Button } from '../common/Button';
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

export function KanbanBoard() {
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const countMarginClass = isRTL ? 'mr-2' : 'ml-2';
  const baseColumns = [
    { id: 'todo', title: t.columns.todo, color: 'bg-gray-100 dark:bg-gray-800' },
    { id: 'in-progress', title: t.columns.inProgress, color: 'bg-blue-100 dark:bg-blue-900/20' },
    { id: 'completed', title: t.columns.completed, color: 'bg-green-100 dark:bg-green-900/20' }
  ] as const;
  const columns = isRTL ? [...baseColumns].reverse() : baseColumns;
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    const task = state.tasks.find(t => t.id === draggableId);
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
    return state.tasks.filter(task => task.status === status);
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={`flex overflow-x-auto pb-4 gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {columns.map((column) => (
            <div key={column.id} className={`flex-shrink-0 w-80 ${isRTL ? 'text-right' : ''}`}>
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className={`font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-right' : ''}`}>
                  {column.title}
                  <span className={`${countMarginClass} text-sm text-gray-500 dark:text-gray-400`}>
                    ({getTasksByStatus(column.id).length})
                  </span>
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  icon={<Plus size={16} />}
                  onClick={() => setIsCreateTaskModalOpen(true)}
                  className={isRTL ? 'flex-row-reverse' : ''}
                >
                  {t.addTask}
                </Button>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] p-4 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? column.color : 'bg-gray-50 dark:bg-gray-800/50'
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
    </>
  );
}