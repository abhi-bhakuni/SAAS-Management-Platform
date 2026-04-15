import { 
  TableRow, 
  TableCell, 
  Typography, 
  Box, 
  Avatar, 
  Skeleton,
  Tooltip
} from '@mui/material';
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
        transition: 'background-color 0.1s ease',
        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        '&:hover': { 
          backgroundColor: '#1F1F23' // Requested hover color
        },
        '&:focusVisible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: '-2px'
        },
        '& td, & th': { 
          borderBottom: '1px solid', 
          borderColor: 'rgba(255, 255, 255, 0.05)', // Minimal, subtle borders
          py: 1.5,
          px: 2
        },
        '&:last-child td, &:last-child th': { borderBottom: 0 }
      }}
    >
      <TableCell component="th" scope="row" sx={{ maxWidth: { xs: 200, sm: 300, md: 400 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={task.title} placement="top-start" arrow enterDelay={700}>
            <Typography 
              variant="body2" 
              fontWeight={600} 
              color="text.primary"
              sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              <Box component="span" sx={{ color: 'text.disabled', fontWeight: 500, mr: 1.5, fontSize: '0.75rem' }}>
                {task.id}
              </Box>
              {task.title}
            </Typography>
          </Tooltip>
        </Box>
      </TableCell>
      
      <TableCell>
        <Box onClick={(e) => e.stopPropagation()}>
          <TaskStatusSelect 
            value={task.status.toLowerCase() as TaskStatus}
            onChange={(s) => onStatusChange?.(s)}
          />
        </Box>
      </TableCell>
      
      <TableCell>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          <Avatar 
            sx={{ 
              width: 24, 
              height: 24, 
              border: '1px solid', 
              borderColor: 'rgba(255, 255, 255, 0.1)', 
              fontSize: '0.65rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'text.primary'
            }}
          >
            {task.assignee?.[0] || 'U'}
          </Avatar>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            {task.assignee || 'Unassigned'}
          </Typography>
        </Box>
      </TableCell>

      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            backgroundColor: getPriorityColor(task.priority) === 'error' ? '#EF4444' : (getPriorityColor(task.priority) === 'warning' ? '#F59E0B' : '#6B7280')
          }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>
            {task.priority}
          </Typography>
        </Box>
      </TableCell>

      <TableCell>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: 'text.disabled' }}>
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );
}
