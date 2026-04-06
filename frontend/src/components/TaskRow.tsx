import React from 'react';
import { 
  TableRow, 
  TableCell, 
  Typography, 
  Box, 
  Avatar, 
  Chip, 
  Tooltip,
  Skeleton
} from '@mui/material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import { TaskStatusSelect } from './TaskStatusSelect';
import type { TaskStatus, TaskPriority, Task } from '../types/task';

interface TaskRowProps {
  task?: Task;
  onClick?: () => void;
  onStatusChange?: (newStatus: TaskStatus) => void;
  isSelected?: boolean;
  isLoading?: boolean;
}

const getPriorityColor = (priority: TaskPriority) => {
  switch(priority) {
    case 'low': return 'default';
    case 'medium': return 'info';
    case 'high': return 'warning';
    case 'urgent': return 'error';
    default: return 'default';
  }
};

export function TaskRow({ 
  task, 
  onClick, 
  onStatusChange, 
  isSelected = false,
  isLoading = false
}: TaskRowProps) {

  // Keyboard navigation support for accessibility
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && onClick) {
      event.preventDefault();
      onClick();
    }
  };

  if (isLoading || !task) {
    return (
      <TableRow>
        <TableCell><Skeleton variant="text" width="60%" height={24} /></TableCell>
        <TableCell><Skeleton variant="rounded" width={100} height={28} sx={{ borderRadius: 12 }} /></TableCell>
        <TableCell><Skeleton variant="circular" width={24} height={24} /></TableCell>
        <TableCell><Skeleton variant="rounded" width={70} height={24} sx={{ borderRadius: 6 }} /></TableCell>
        <TableCell><Skeleton variant="text" width={80} height={24} /></TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: isSelected ? 'action.selected' : 'transparent',
        '&:hover': { backgroundColor: 'action.hover' },
        '&:focusVisible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: '-2px'
        },
        '&:last-child td, &:last-child th': { border: 0 }
      }}
    >
      <TableCell component="th" scope="row" sx={{ borderColor: 'divider', maxWidth: 300 }}>
        <Tooltip title={task.title} placement="top-start" arrow enterDelay={600}>
          <Typography 
            variant="body2" 
            fontWeight={isSelected ? 700 : 600} 
            color="text.primary"
            sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500, mr: 1.5 }}>{task.id}</Box>
            {task.title}
          </Typography>
        </Tooltip>
      </TableCell>
      
      <TableCell sx={{ borderColor: 'divider' }}>
        <Box onClick={(e) => e.stopPropagation()}>
          <TaskStatusSelect 
            value={task.status}
            onChange={(s) => onStatusChange?.(s)}
          />
        </Box>
      </TableCell>
      
      <TableCell sx={{ borderColor: 'divider' }}>
        <Tooltip title={`Assignee: ${task.assignedToUser ? `${task.assignedToUser.firstName} ${task.assignedToUser.lastName}` : 'Unassigned'}`} placement="top" arrow>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            <Avatar 
              src={undefined} // Since User type doesn't have avatar yet, we use initials or default
              sx={{ width: 26, height: 26, border: '1px solid', borderColor: 'divider', fontSize: '0.7rem' }}
            >
              {task.assignedToUser?.firstName?.[0] || 'U'}
            </Avatar>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', lg: 'block' } }}>
              {task.assignedToUser?.firstName || 'Unassigned'}
            </Typography>
          </Box>
        </Tooltip>
      </TableCell>

      <TableCell sx={{ borderColor: 'divider' }}>
        <Chip 
          label={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} 
          color={getPriorityColor(task.priority)}
          size="small"
          sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px' }}
        />
      </TableCell>

      <TableCell sx={{ borderColor: 'divider' }}>
        <Tooltip title={`Due date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}`} placement="top" arrow>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
            <CalendarTodayOutlinedIcon sx={{ fontSize: 14 }} />
            <Typography variant="body2">
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
            </Typography>
          </Box>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
