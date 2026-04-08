import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Box } from '@mui/material';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '../types/task';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: TaskStatus) => void;
  onTasksOrderChange: (newTasks: Task[]) => void;
}

const columns: { id: string; title: string; status: TaskStatus }[] = [
  { id: 'todo', title: 'To Do', status: 'todo' },
  { id: 'in_progress', title: 'In Progress', status: 'in_progress' },
  { id: 'in_review', title: 'In Review', status: 'in_review' },
  { id: 'done', title: 'Done', status: 'done' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskMove, onTasksOrderChange }) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

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

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Dropping over a column
    const isOverAColumn = columns.some(col => col.id === overId);
    if (isOverAColumn) {
      const overColumn = columns.find(col => col.id === overId);
      if (overColumn && activeTask.status !== overColumn.status) {
        onTaskMove(activeId as string, overColumn.status);
      }
      return;
    }

    // Dropping over another task
    const overTask = tasks.find(t => t.id === overId);
    if (overTask && activeTask.status !== overTask.status) {
      onTaskMove(activeId as string, overTask.status);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId !== overId) {
      const activeIndex = tasks.findIndex(t => t.id === activeId);
      const overIndex = tasks.findIndex(t => t.id === overId);

      if (activeIndex !== -1 && overIndex !== -1) {
        onTasksOrderChange(arrayMove(tasks, activeIndex, overIndex));
      }
    }
  };

  return (
    <Box sx={{ 
      flex: 1, 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#0F0F11', // Requested board background
      height: 'calc(100vh - 120px)'
    }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          p: 3,
          height: '100%',
          overflowX: 'auto',
          alignItems: 'flex-start',
          '&::-webkit-scrollbar': { height: '8px' },
          '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' },
          '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' }
        }}>
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={getTasksByStatus(column.status)}
              status={column.status}
            />
          ))}
        </Box>

        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeTask ? (
            <Box sx={{ 
              transform: 'rotate(2deg)', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              cursor: 'grabbing'
            }}>
              <TaskCard task={activeTask} />
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Box>
  );
};