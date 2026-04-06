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
          '& .MuiAutocomplete-option': { 
            p: 1.5, 
            gap: 1.5, 
            borderBottom: '1px solid',
            borderColor: 'divider',
            transition: 'background-color 0.1s',
            '&:hover, &.Mui-focused, &.Mui-focusVisible': {
              backgroundColor: 'action.hover'
            },
            '&[aria-selected="true"]': {
              backgroundColor: 'action.selected',
              '&.Mui-focused': { backgroundColor: 'action.selected' }
            }
          }
        }
      }}
      slotProps={{
        paper: {
          elevation: 0,
          sx: {
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            mt: 1
          }
        }
      }}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id}>
          {option.id === 'unassigned' ? (
             <Avatar sx={{ width: 28, height: 28, fontSize: '0.85rem', bgcolor: 'transparent', border: '1px dashed grey', color: 'text.secondary' }}>
               <PersonOutlineIcon fontSize="small" sx={{ opacity: 0.6 }} />
             </Avatar>
          ) : (
            <Avatar src={option.avatar} alt={option.name} sx={{ width: 28, height: 28 }} />
          )}
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight={option.id === value?.id ? 600 : 500} color="text.primary" noWrap>
              {option.name || `${option.firstName} ${option.lastName}`.trim() || 'Unassigned'}
            </Typography>
            {option.email && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: -0.2 }}>
                {option.email}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Assign User..."
          variant="outlined"
          size="small"
          onClick={() => { if (!isOpen) setIsOpen(true); }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start" sx={{ ml: 0.5, mr: 0, opacity: isOpen ? 0.3 : 1, transition: 'opacity 0.2s' }}>
                {value.id !== 'unassigned' ? (
                  <Avatar src={value.avatar} alt={value.name || value.firstName} sx={{ width: 20, height: 20, fontSize: '0.6rem' }}>
                    {value.firstName?.[0] || value.name?.[0]}
                  </Avatar>
                ) : (
                  <PersonOutlineIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                )}
              </InputAdornment>
            ),
            sx: {
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 500,
              height: 40,
              backgroundColor: isOpen ? 'background.paper' : 'transparent',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isOpen ? 'primary.main' : 'divider',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: isOpen ? 'primary.main' : 'text.disabled',
              },
              // when focused or open, show the text instead of just standard
              color: isOpen ? 'text.primary' : 'text.primary'
            }
          }}
        />
      )}
      sx={{ minWidth: 180 }}
    />
  );
}
