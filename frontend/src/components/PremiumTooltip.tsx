import React from 'react';
import { Tooltip, Typography } from '@mui/material';

interface PremiumTooltipProps extends Omit<React.ComponentProps<typeof Tooltip>, 'title'> {
  title: string;
  color?: string;
}

export const PremiumTooltip: React.FC<PremiumTooltipProps> = ({ 
  title, 
  color = '#FFFFFF', 
  children, 
  placement = 'top',
  ...props 
}) => {
  return (
    <Tooltip
      title={
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.02em', px: 0.5 }}>
          {title}
        </Typography>
      }
      arrow
      placement={placement}
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: '#18181B',
            color: color,
            border: `1px solid ${color}4D`, // 30% opacity hex
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            borderRadius: '8px',
            py: 1,
          }
        },
        arrow: {
          sx: {
            color: '#18181B',
            '&::before': {
              border: `1px solid ${color}4D`,
            }
          }
        }
      }}
      {...props}
    >
      {children}
    </Tooltip>
  );
};
