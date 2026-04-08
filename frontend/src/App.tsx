import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { Dashboard } from './pages/Dashboard';
import { GlobalTasks } from './pages/GlobalTasks';
import { ActivityPage } from './pages/ActivityPage';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Custom modern dark theme for professional SaaS look
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFFFFF',
      light: '#FFFFFF',
      dark: '#E2E2E2',
    },
    background: {
      default: '#0F0F11', // Deep charcoal-black background
      paper: '#18181B',   // Slightly lighter card background
    },
    text: {
      primary: '#EDEDED',
      secondary: '#A1A1AA',
    },
    divider: '#2A2A2E',
    action: {
      hover: 'rgba(255, 255, 255, 0.05)',
      selected: 'rgba(255, 255, 255, 0.08)',
    }
  },
  typography: {
    fontFamily: '"Inter", "Outfit", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #2A2A2E',
          backgroundColor: '#18181B',
          backgroundImage: 'none', // Remove MUI elevation overlay
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Auth />} />
            
            {/* New Saas Routing Structure */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<ProjectDetails />} />
            <Route path="/tasks" element={<GlobalTasks />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Kept for any future strictly private routes */}
            <Route element={<ProtectedRoute />}>
              {/* Add strictly private routes here */}
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
