import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Box, 
  Typography, 
  Avatar, 
  Tooltip 
} from '@mui/material';
import type { Task, TaskPriority } from '../types/task';

interface TaskCardProps {
  task: Task;
}

const getPriorityStyles = (priority: TaskPriority) => {
  switch(priority) {
    case 'urgent': return { color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
    case 'high': return { color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)' };
    case 'medium': return { color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)' };
    case 'low': return { color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
    default: return { color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const priorityStyle = getPriorityStyles(task.priority);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        backgroundColor: '#1C1C1F',
        borderRadius: '10px',
        p: 2,
        mb: 2,
        border: '1px solid',
        borderColor: isDragging ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
        boxShadow: isDragging 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)' 
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' },
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          transform: isDragging ? undefined : 'translateY(-2px)'
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Typography 
          variant="body2" 
          fontWeight={600} 
          sx={{ 
            color: '#FFFFFF', 
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {task.title}
        </Typography>
      </Box>

      {task.description && (
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'text.disabled', 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden',
            mb: 2,
            lineHeight: 1.5
          }}
        >
          {task.description}
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              px: 1, 
              py: 0.25, 
              borderRadius: '4px', 
              fontSize: '0.65rem', 
              fontWeight: 700, 
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              backgroundColor: priorityStyle.bgColor,
              color: priorityStyle.color,
              border: '1px solid',
              borderColor: 'rgba(255, 255, 255, 0.03)'
            }}
          >
            {task.priority}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {task.dueDate && (
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Typography>
          )}
          {task.assignedToUser && (
            <Tooltip title={`${task.assignedToUser.firstName} ${task.assignedToUser.lastName}`}>
              <Avatar 
                sx={{ 
                  width: 22, 
                  height: 22, 
                  fontSize: '0.65rem', 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'text.primary'
                }}
              >
                {task.assignedToUser.firstName?.[0]}
              </Avatar>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
};