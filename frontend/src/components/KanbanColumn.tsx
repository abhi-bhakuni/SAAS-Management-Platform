import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { 
  Box, 
  Typography 
} from '@mui/material';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '../types/task';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  status: TaskStatus;
}

const statusAccentColors: Record<TaskStatus, string> = {
  todo: '#FACC15', // Yellow
  in_progress: '#60A5FA', // Blue
  in_review: '#C084FC', // Purple
  done: '#4ADE80', // Green
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  status,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const accentColor = statusAccentColors[status];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: 320,
        backgroundColor: '#141416', // Requested column background
        borderRadius: '12px',
        maxHeight: '100%',
        flexShrink: 0,
        border: '1px solid',
        borderColor: isOver ? accentColor : 'rgba(255, 255, 255, 0.03)',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Sticky Header */}
      <Box sx={{ 
        p: 2.5, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        backgroundColor: '#141416',
        zIndex: 1,
        borderRadius: '12px 12px 0 0',
        borderBottom: '1px solid',
        borderColor: 'rgba(255, 255, 255, 0.03)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: accentColor }} />
          <Typography variant="body2" fontWeight={700} color="#FFFFFF" sx={{ letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
            {title}
          </Typography>
        </Box>
        <Box sx={{ 
          px: 1, 
          py: 0.25, 
          borderRadius: '20px', 
          backgroundColor: 'rgba(255, 255, 255, 0.05)', 
          border: '1px solid', 
          borderColor: 'rgba(255, 255, 255, 0.05)' 
        }}>
          <Typography variant="caption" fontWeight={700} color="text.disabled">
            {tasks.length}
          </Typography>
        </Box>
      </Box>

      {/* Task List container */}
      <Box
        ref={setNodeRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          minHeight: 150,
          backgroundColor: isOver ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
          transition: 'background-color 0.2s ease',
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' }
        }}
      >
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </Box>
    </Box>
  );
};