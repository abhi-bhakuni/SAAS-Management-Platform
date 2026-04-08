import { useState } from 'react';
import { 
  Autocomplete, 
  TextField, 
  Box, 
  Typography, 
  Avatar, 
  InputAdornment 
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

export interface UserOption {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string; // Fallback for backward compatibility
  email?: string;
  avatar?: string;
}

interface AssigneeSelectProps {
  value: UserOption;
  onChange: (user: UserOption) => void;
  options?: UserOption[];
}

const defaultUnassigned: UserOption = { id: 'unassigned', name: 'Unassigned', avatar: '' };

export function AssigneeSelect({ value, onChange, options }: AssigneeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Autocomplete
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      value={value}
      onChange={(_, newValue) => {
        if (newValue) onChange(newValue);
      }}
      options={options || [defaultUnassigned]}
      getOptionLabel={(option) => option.name || `${option.firstName} ${option.lastName}`.trim() || 'Unassigned'}
      disableClearable
      forcePopupIcon={false}
      noOptionsText="No users found"
      ListboxProps={{
        sx: { 
          maxHeight: 250, 
          p: 0, 
          backgroundColor: '#18181B',
          '& .MuiAutocomplete-option': { 
            p: '10px 14px', 
            gap: 1.5, 
            borderBottom: '1px solid',
            borderColor: 'rgba(255, 255, 255, 0.03)',
            transition: 'background-color 0.1s ease',
            '&:hover, &.Mui-focused, &.Mui-focusVisible': {
              backgroundColor: '#27272A' // Requested Hover Color
            },
            '&[aria-selected="true"]': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              '&.Mui-focused': { backgroundColor: 'rgba(255, 255, 255, 0.08)' }
            }
          }
        }
      }}
      slotProps={{
        paper: {
          elevation: 0,
          sx: {
            border: '1px solid',
            borderColor: '#2A2A2E',
            borderRadius: '10px',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6)',
            mt: 0.5,
            backgroundColor: '#18181B',
            overflow: 'hidden'
          }
        }
      }}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id}>
          {option.id === 'unassigned' ? (
             <Avatar sx={{ width: 26, height: 26, fontSize: '0.85rem', bgcolor: 'transparent', border: '1px dashed #3F3F46', color: 'text.disabled' }}>
               <PersonOutlineIcon sx={{ fontSize: 16, opacity: 0.5 }} />
             </Avatar>
          ) : (
            <Avatar src={option.avatar} alt={option.name} sx={{ width: 26, height: 26, border: '1px solid', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              {option.firstName?.[0] || option.name?.[0]}
            </Avatar>
          )}
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight={option.id === value?.id ? 600 : 500} color="text.primary" noWrap sx={{ fontSize: '0.85rem' }}>
              {option.name || `${option.firstName} ${option.lastName}`.trim() || 'Unassigned'}
            </Typography>
            {option.email && (
              <Typography variant="caption" color="text.disabled" noWrap sx={{ display: 'block', mt: -0.3, fontSize: '0.7rem' }}>
                {option.email}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Assignee"
          variant="outlined"
          size="small"
          onClick={() => { if (!isOpen) setIsOpen(true); }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start" sx={{ ml: 0.5, mr: 0, opacity: isOpen ? 0.3 : 1, transition: 'opacity 0.2s' }}>
                {value.id !== 'unassigned' ? (
                  <Avatar src={value.avatar} alt={value.name || value.firstName} sx={{ width: 20, height: 20, fontSize: '0.6rem', border: '1px solid', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    {value.firstName?.[0] || value.name?.[0]}
                  </Avatar>
                ) : (
                  <PersonOutlineIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                )}
              </InputAdornment>
            ),
            sx: {
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 500,
              height: 36,
              backgroundColor: isOpen ? '#18181B' : '#27272A',
              color: 'text.primary',
              transition: 'background-color 0.2s',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isOpen ? '#3F3F46' : '#2A2A2E',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3F3F46',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#FFFFFF',
                borderWidth: '1px'
              }
            }
          }}
        />
      )}
      sx={{ minWidth: 160 }}
    />
  );
}
