import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Alert, Snackbar, Slide, type SlideProps } from '@mui/material';

type ToastSeverity = 'success' | 'error' | 'info' | 'warning';

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

interface ToastState {
  open: boolean;
  message: string;
  severity: ToastSeverity;
}

interface ToastContextValue {
  showToast: (message: string, severity?: ToastSeverity) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showToast = (message: string, severity: ToastSeverity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleClose = () => {
    setToast((current) => ({ ...current, open: false }));
  };

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionComponent={SlideTransition}
        transitionDuration={{ enter: 300, exit: 180 }}
      >
        <Alert onClose={handleClose} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
