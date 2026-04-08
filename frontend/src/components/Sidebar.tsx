import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const navItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardOutlinedIcon />, 
      path: '/dashboard', 
      active: location.pathname === '/dashboard' || location.pathname === '/' 
    },
    { 
      text: 'Projects', 
      icon: <FolderOutlinedIcon />, 
      path: '/projects', 
      active: location.pathname.startsWith('/projects') 
    },
    { 
      text: 'Tasks', 
      icon: <CheckBoxOutlinedIcon />, 
      path: '/tasks', 
      active: location.pathname.startsWith('/tasks') 
    },
    { 
      text: 'Activity', 
      icon: <NotificationsOutlinedIcon />, 
      path: '/activity', 
      active: location.pathname.startsWith('/activity') 
    },
    { 
      text: 'Settings', 
      icon: <SettingsOutlinedIcon />, 
      path: '/settings', 
      active: location.pathname.startsWith('/settings') 
    }
  ];

  return (
    <Box sx={{ 
      width: 240, 
      borderRight: '1px solid', 
      borderColor: 'divider', 
      backgroundColor: '#0F0F11', 
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0, // Prevent sidebar from shrinking
      py: 2,
      px: 1.5
    }}>
      {/* Workspace Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, px: 1, py: 1, gap: 1.5 }}>
        <Box sx={{ 
          width: 28, 
          height: 28, 
          borderRadius: '6px', 
          backgroundColor: '#FFFFFF', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#000000'
        }}>
          <WidgetsOutlinedIcon fontSize="small" sx={{ fontSize: 18 }} />
        </Box>
        <Typography variant="body2" fontWeight="600" color="text.primary">
          Acme Workspace
        </Typography>
      </Box>

      {/* Navigation List */}
      <List sx={{ px: 0, flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.2 }}>
            <ListItemButton 
              selected={item.active}
              onClick={() => navigate(item.path)}
              sx={{ 
                borderRadius: '6px',
                py: 0.75,
                px: 1.5,
                transition: 'all 0.1s ease',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  '& .MuiListItemIcon-root': { color: '#FFFFFF' },
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.12)' }
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.04)'
                }
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 32, 
                color: item.active ? '#FFFFFF' : 'text.secondary',
                '& svg': { fontSize: 18 }
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontSize: '0.85rem', 
                  fontWeight: item.active ? 600 : 500,
                  color: item.active ? '#FFFFFF' : 'text.secondary'
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* User Actions */}
      <Box sx={{ px: 0.5, pb: 1 }}>
        <Divider sx={{ mb: 2, opacity: 0.3, borderColor: 'divider' }} />
        {isAuthenticated ? (
          <Button
            fullWidth
            startIcon={<LogoutOutlinedIcon sx={{ fontSize: 18 }} />}
            onClick={() => {
              logout();
              navigate('/login');
            }}
            sx={{ 
              justifyContent: 'flex-start', 
              color: 'text.secondary', 
              px: 1.5,
              py: 1,
              fontSize: '0.85rem',
              borderRadius: '6px',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.04)', color: '#FF4D4D' }
            }}
          >
            Log Out
          </Button>
        ) : (
          <Button
            fullWidth
            variant="contained"
            disableElevation
            startIcon={<LoginOutlinedIcon sx={{ fontSize: 18 }} />}
            onClick={() => navigate('/login')}
            sx={{ 
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              '&:hover': { backgroundColor: '#E2E2E2' }
            }}
          >
            Sign In
          </Button>
        )}
      </Box>
    </Box>
  );
}
