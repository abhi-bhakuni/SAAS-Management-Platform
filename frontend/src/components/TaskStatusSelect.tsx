import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Menu, 
  MenuItem,
  CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import PendingIcon from '@mui/icons-material/Pending';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';

interface TaskStatusSelectProps {
  value: TaskStatus;
  onChange: (newStatus: TaskStatus) => void;
  isLoading?: boolean;
}

const statusConfig = {
  todo: {
    label: 'Todo',
    icon: RadioButtonUncheckedIcon,
    color: '#FACC15', // Yellow
    bgColor: 'rgba(250, 204, 21, 0.1)',
    borderColor: 'rgba(250, 204, 21, 0.2)',
    hoverBgColor: 'rgba(250, 204, 21, 0.15)'
  },
  in_progress: {
    label: 'In Progress',
    icon: DonutLargeIcon,
    color: '#60A5FA', // Blue
    bgColor: 'rgba(96, 165, 250, 0.1)',
    borderColor: 'rgba(96, 165, 250, 0.2)',
    hoverBgColor: 'rgba(96, 165, 250, 0.15)'
  },
  in_review: {
    label: 'Review',
    icon: PendingIcon,
    color: '#C084FC', // Purple
    bgColor: 'rgba(192, 132, 252, 0.1)',
    borderColor: 'rgba(192, 132, 252, 0.2)',
    hoverBgColor: 'rgba(192, 132, 252, 0.15)'
  },
  done: {
    label: 'Done',
    icon: CheckCircleIcon,
    color: '#4ADE80', // Green
    bgColor: 'rgba(74, 222, 128, 0.1)',
    borderColor: 'rgba(74, 222, 128, 0.2)',
    hoverBgColor: 'rgba(74, 222, 128, 0.15)'
  }
};

export function TaskStatusSelect({ value, onChange, isLoading = false }: TaskStatusSelectProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (status: TaskStatus, event: React.MouseEvent) => {
    event.stopPropagation();
    if (status !== value && !isLoading) {
      onChange(status);
    }
    handleClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setAnchorEl(event.currentTarget as HTMLElement);
    }
  };

  const currentConfig = statusConfig[value];
  const IconComponent = currentConfig.icon;

  return (
    <>
      <Box 
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        sx={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 1, 
          border: '1px solid',
          borderColor: Boolean(anchorEl) ? 'rgba(255, 255, 255, 0.2)' : currentConfig.borderColor,
          backgroundColor: currentConfig.bgColor,
          borderRadius: '20px',
          px: 1.25,
          py: 0.35,
          cursor: 'pointer',
          transition: 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isLoading ? 0.7 : 1,
          '&:hover': { 
            backgroundColor: currentConfig.hoverBgColor,
            borderColor: currentConfig.color,
            boxShadow: '0 0 0 1px ' + currentConfig.color + ' inset'
          },
          '&:focusVisible': {
            outline: '2px solid',
            outlineColor: currentConfig.color,
            outlineOffset: '2px'
          }
        }}
      >
        {isLoading ? (
          <CircularProgress size={12} color="inherit" sx={{ color: currentConfig.color }} />
        ) : (
          <IconComponent sx={{ fontSize: 13, color: currentConfig.color }} />
        )}
        <Typography variant="caption" fontWeight="700" sx={{ color: currentConfig.color, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {currentConfig.label}
        </Typography>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        elevation={0}
        transitionDuration={150}
        MenuListProps={{
          sx: { py: 1, backgroundColor: '#18181B' }
        }}
        PaperProps={{ 
          sx: { 
            border: '1px solid', 
            borderColor: '#2A2A2E', 
            borderRadius: '10px', 
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6)',
            minWidth: 160,
            mt: 0.5,
            overflow: 'hidden'
          } 
        }}
      >
        {(Object.keys(statusConfig) as TaskStatus[]).map((statusKey) => {
          const config = statusConfig[statusKey];
          const OptionIcon = config.icon;
          const isSelected = value === statusKey;
          
          return (
            <MenuItem 
              key={statusKey}
              onClick={(e) => handleSelect(statusKey, e)} 
              selected={isSelected}
              sx={{ 
                fontSize: '0.85rem',
                fontWeight: isSelected ? 600 : 500,
                color: isSelected ? '#FFFFFF' : 'text.secondary',
                py: 1.25,
                px: 2,
                gap: 1.5,
                transition: 'all 0.1s ease',
                '&:hover': {
                  backgroundColor: '#27272A',
                  color: '#FFFFFF'
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  '&:hover': {
                    backgroundColor: '#27272A'
                  }
                }
              }}
            >
              <OptionIcon sx={{ fontSize: 16, color: config.color }} /> 
              {config.label}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
