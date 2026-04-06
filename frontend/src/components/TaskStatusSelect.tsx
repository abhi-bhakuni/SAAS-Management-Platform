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
    color: 'text.secondary',
    bgColor: 'transparent',
    borderColor: 'divider',
    hoverBgColor: 'action.hover'
  },
  in_progress: {
    label: 'In Progress',
    icon: DonutLargeIcon,
    color: 'warning.main',
    bgColor: 'warning.50',
    borderColor: 'warning.main',
    hoverBgColor: 'warning.100'
  },
  in_review: {
    label: 'In Review',
    icon: PendingIcon,
    color: 'info.main',
    bgColor: 'info.50',
    borderColor: 'info.main',
    hoverBgColor: 'info.100'
  },
  done: {
    label: 'Done',
    icon: CheckCircleIcon,
    color: 'success.main',
    bgColor: 'success.50',
    borderColor: 'success.main',
    hoverBgColor: 'success.100'
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
          gap: 0.75, 
          border: '1px solid',
          borderColor: Boolean(anchorEl) ? 'primary.main' : currentConfig.borderColor,
          backgroundColor: currentConfig.bgColor,
          borderRadius: '16px',
          px: 1.5,
          py: 0.4,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isLoading ? 0.7 : 1,
          '&:hover': { 
            backgroundColor: currentConfig.hoverBgColor,
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          },
          '&:focusVisible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: '2px'
          }
        }}
      >
        {isLoading ? (
          <CircularProgress size={14} color="inherit" sx={{ color: currentConfig.color }} />
        ) : (
          <IconComponent sx={{ fontSize: 14, color: currentConfig.color }} />
        )}
        <Typography variant="caption" fontWeight="600" sx={{ color: currentConfig.color === 'text.secondary' ? 'text.primary' : currentConfig.color, mt: 0.2 }}>
          {currentConfig.label}
        </Typography>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        elevation={0}
        MenuListProps={{
          sx: { py: 1 }
        }}
        PaperProps={{ 
          sx: { 
            border: '1px solid', 
            borderColor: 'divider', 
            borderRadius: '12px', 
            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
            minWidth: 160
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
                fontWeight: 500,
                color: 'text.primary',
                py: 1,
                px: 2,
                gap: 1.5,
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                  '&:hover': {
                    backgroundColor: 'action.hover'
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
