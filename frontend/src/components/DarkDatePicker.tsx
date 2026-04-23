import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { Box } from '@mui/material';

interface DarkDatePickerProps {
  value: string; // ISO date string e.g. "2024-05-20"
  onChange: (value: string) => void;
  size?: 'small' | 'medium';
  disablePast?: boolean;
}

export function DarkDatePicker({ value, onChange, size = 'small', disablePast = false }: DarkDatePickerProps) {
  const dayjsValue = value ? dayjs(value) : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {/* minWidth:0 + width:100% constrains the input within the grid cell */}
      <Box sx={{ minWidth: 0, width: '100%' }}>
        <DatePicker
          value={dayjsValue}
          disablePast={disablePast}
          minDate={disablePast ? dayjs() : undefined}
          onChange={(newValue: Dayjs | null) => {
            onChange(newValue ? newValue.format('YYYY-MM-DD') : '');
          }}
          slotProps={{
            textField: {
              size,
              fullWidth: true,
              sx: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.25)' },
                  '&.Mui-focused fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                },
                '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '1.1rem',
                },
                '& input': {
                  color: '#FFFFFF',
                  '&::placeholder': { color: 'rgba(255,255,255,0.3)', opacity: 1 },
                },
              },
            },
            popper: {
              // Portal rendering (default) keeps the calendar floating freely.
              // zIndex 1500 > MUI Dialog's 1300, so calendar renders on top of the modal.
              sx: {
                zIndex: 1500,
                '& .MuiPaper-root': {
                  backgroundColor: '#1C1C1F',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                  color: '#FFFFFF',
                },
                '& .MuiPickersCalendarHeader-root': { color: '#FFFFFF' },
                '& .MuiPickersCalendarHeader-label': { color: '#FFFFFF', fontWeight: 700 },
                '& .MuiPickersArrowSwitcher-button': {
                  color: 'rgba(255,255,255,0.5)',
                  '&:hover': { color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.05)' },
                },
                '& .MuiDayCalendar-weekDayLabel': {
                  color: 'rgba(255,255,255,0.3)',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                },
                '& .MuiPickersDay-root': {
                  color: 'rgba(255,255,255,0.8)',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFFFFF' },
                  '&.Mui-selected': {
                    backgroundColor: '#FFFFFF !important',
                    color: '#000000 !important',
                    fontWeight: 700,
                    '&:hover': { backgroundColor: '#E2E2E2 !important' },
                  },
                  '&.MuiPickersDay-today': {
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: '#FFFFFF',
                    backgroundColor: 'transparent',
                  },
                },
                '& .MuiPickersDay-root.Mui-disabled': {
                  color: 'rgba(255,255,255,0.2)',
                },
              },
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}
