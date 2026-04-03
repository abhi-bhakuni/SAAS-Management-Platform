import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { socketService } from '../services/socket';
import type { TaskUpdateEvent } from '../services/socket';
import type { Task, TaskStatus } from '../types/task';

// Mock data for demonstration
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design user interface',
    description: 'Create wireframes and mockups for the new dashboard',
    status: 'todo',
    priority: 'high',
    projectId: 'project-1',
    assignedToUserId: 'user-1',
    assignedToUser: { id: 'user-1', email: 'john@example.com', firstName: 'John', lastName: 'Doe' },
    createdByUserId: 'user-2',
    createdByUser: { id: 'user-2', email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith' },
    dueDate: '2024-04-15',
    createdAt: '2024-04-01T10:00:00Z',
    updatedAt: '2024-04-01T10:00:00Z',
  },
  {
    id: '2',
    title: 'Implement authentication',
    description: 'Set up JWT authentication with refresh tokens',
    status: 'in_progress',
    priority: 'urgent',
    projectId: 'project-1',
    assignedToUserId: 'user-2',
    assignedToUser: { id: 'user-2', email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith' },
    createdByUserId: 'user-1',
    createdByUser: { id: 'user-1', email: 'john@example.com', firstName: 'John', lastName: 'Doe' },
    dueDate: '2024-04-10',
    createdAt: '2024-04-01T11:00:00Z',
    updatedAt: '2024-04-02T14:00:00Z',
  },
  {
    id: '3',
    title: 'Write unit tests',
    description: 'Add comprehensive unit tests for all services',
    status: 'in_review',
    priority: 'medium',
    projectId: 'project-1',
    assignedToUserId: 'user-1',
    assignedToUser: { id: 'user-1', email: 'john@example.com', firstName: 'John', lastName: 'Doe' },
    createdByUserId: 'user-2',
    createdByUser: { id: 'user-2', email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith' },
    dueDate: '2024-04-20',
    createdAt: '2024-04-01T12:00:00Z',
    updatedAt: '2024-04-03T09:00:00Z',
  },
  {
    id: '4',
    title: 'Deploy to production',
    description: 'Set up CI/CD pipeline and deploy the application',
    status: 'done',
    priority: 'high',
    projectId: 'project-1',
    assignedToUserId: 'user-2',
    assignedToUser: { id: 'user-2', email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith' },
    createdByUserId: 'user-1',
    createdByUser: { id: 'user-1', email: 'john@example.com', firstName: 'John', lastName: 'Doe' },
    dueDate: '2024-04-05',
    createdAt: '2024-03-25T08:00:00Z',
    updatedAt: '2024-04-05T16:00:00Z',
  },
];

interface KanbanBoardProps {
  orgId: string;
  projectId: string;
}

const columns: { id: string; title: string; status: TaskStatus }[] = [
  { id: 'todo', title: 'To Do', status: 'todo' },
  { id: 'in_progress', title: 'In Progress', status: 'in_progress' },
  { id: 'in_review', title: 'In Review', status: 'in_review' },
  { id: 'done', title: 'Done', status: 'done' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ orgId, projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    // Load initial tasks
    loadTasks();

    // Connect to WebSocket
    socketService.connect(orgId, projectId, 'current-user-id'); // TODO: Get actual user ID

    // Listen for connection changes
    // const unsubscribeConnection = socketService.onConnectionChange(setIsConnected);

    // Listen for task updates
    const unsubscribeTaskUpdates = socketService.onTaskUpdate(handleTaskUpdate);

    return () => {
      unsubscribeTaskUpdates();
      socketService.disconnect();
    };
  }, [orgId, projectId]);

  const loadTasks = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setTasks(mockTasks);
      setLoading(false);
    }, 1000);
  };

  const handleTaskUpdate = (event: TaskUpdateEvent) => {
    console.log('Received task update:', event);

    if (event.action === 'status_changed' && event.data?.status) {
      // Update task status in local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === event.taskId
            ? { ...task, status: event.data.status }
            : task
        )
      );
    } else if (event.action === 'updated') {
      // For other updates, we might want to refresh the specific task
      // For now, just log it
      console.log('Task updated:', event.taskId);
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = tasks.some(task => task.id === activeId);
    const isOverATask = tasks.some(task => task.id === overId);

    if (!isActiveATask) return;

    // Dropping a task over another task
    if (isActiveATask && isOverATask) {
      setTasks(tasks => {
        const activeIndex = tasks.findIndex(t => t.id === activeId);
        const overIndex = tasks.findIndex(t => t.id === overId);

        if (tasks[activeIndex].status !== tasks[overIndex].status) {
          // Moving to different column
          const newTasks = [...tasks];
          newTasks[activeIndex] = {
            ...newTasks[activeIndex],
            status: tasks[overIndex].status,
          };
          return arrayMove(newTasks, activeIndex, overIndex);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    // Dropping a task over a column
    const isOverAColumn = columns.some(col => col.id === overId);
    if (isActiveATask && isOverAColumn) {
      setTasks(tasks => {
        const activeIndex = tasks.findIndex(t => t.id === activeId);
        const overColumn = columns.find(col => col.id === overId);

        if (overColumn && tasks[activeIndex].status !== overColumn.status) {
          const newTasks = [...tasks];
          newTasks[activeIndex] = {
            ...newTasks[activeIndex],
            status: overColumn.status,
          };
          return newTasks;
        }

        return tasks;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const task = tasks.find(t => t.id === activeId);
    if (!task) return;

    let newStatus = task.status;

    // Check if dropped on a column
    const column = columns.find(col => col.id === overId);
    if (column) {
      newStatus = column.status;
    } else {
      // Check if dropped on another task
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (newStatus !== task.status) {
      // Optimistically update local state
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === task.id ? { ...t, status: newStatus } : t
        )
      );

      // TODO: Call real API
      // try {
      //   await taskApi.updateTaskStatus(orgId, projectId, task.id, newStatus);
      // } catch (err) {
      //   // Revert on error
      //   setTasks(prevTasks =>
      //     prevTasks.map(t =>
      //       t.id === task.id ? { ...t, status: task.status } : t
      //     )
      //   );
      //   console.error('Error updating task status:', err);
      // }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Kanban Board</h1>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-6 overflow-x-auto pb-6">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={getTasksByStatus(column.status)}
              status={column.status}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};