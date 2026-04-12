import { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Button,
  Chip,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery
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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 56;

export function Sidebar() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  // On small screens start collapsed; on large screens start expanded
  const [manualCollapsed, setManualCollapsed] = useState(false);

  // Collapsed when small screen OR manually collapsed
  const collapsed = isSmallScreen || manualCollapsed;
  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

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
    <Box
      sx={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        borderRight: '1px solid',
        borderColor: 'divider',
        backgroundColor: '#0F0F11',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        flexShrink: 0,
        py: 2,
        px: collapsed ? 0.75 : 1.5,
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1), padding 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      {/* Workspace Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 3,
          px: collapsed ? 0.5 : 1,
          py: 1,
          gap: 1.5,
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: 40,
        }}
      >
        <Tooltip title={collapsed ? 'Acme Workspace' : ''} placement="right">
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000',
              flexShrink: 0,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/dashboard')}
          >
            <WidgetsOutlinedIcon fontSize="small" sx={{ fontSize: 18 }} />
          </Box>
        </Tooltip>

        {!collapsed && (
          <>
            <Typography variant="body2" fontWeight="600" color="text.primary" noWrap>
              Acme Workspace
            </Typography>
            {!isAuthenticated && (
              <Chip
                label="Sandbox"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  color: 'text.secondary',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  flexShrink: 0,
                }}
              />
            )}
          </>
        )}
      </Box>

      {/* Navigation List */}
      <List sx={{ px: 0, flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.2 }}>
            <Tooltip title={collapsed ? item.text : ''} placement="right">
              <ListItemButton
                selected={item.active}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '6px',
                  py: 0.75,
                  px: collapsed ? 1 : 1.5,
                  minHeight: 38,
                  justifyContent: collapsed ? 'center' : 'flex-start',
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
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 'unset' : 32,
                    color: item.active ? '#FFFFFF' : 'text.secondary',
                    '& svg': { fontSize: 18 },
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.85rem',
                      fontWeight: item.active ? 600 : 500,
                      color: item.active ? '#FFFFFF' : 'text.secondary',
                      noWrap: true,
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      {/* Bottom Section */}
      <Box sx={{ px: collapsed ? 0.25 : 0.5, pb: 1 }}>
        <Divider sx={{ mb: 2, opacity: 0.3, borderColor: 'divider' }} />

        {/* Collapse / Expand toggle — only visible on large screens */}
        {!isSmallScreen && (
          <Tooltip title={manualCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
            <IconButton
              onClick={() => setManualCollapsed((prev) => !prev)}
              size="small"
              sx={{
                width: '100%',
                borderRadius: '6px',
                py: 0.75,
                mb: 1,
                color: 'text.disabled',
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1 : 1.5,
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.04)', color: 'text.secondary' },
              }}
            >
              {manualCollapsed
                ? <ChevronRightIcon sx={{ fontSize: 18 }} />
                : <ChevronLeftIcon sx={{ fontSize: 18 }} />}
              {!collapsed && (
                <Typography variant="caption" fontWeight="600" sx={{ ml: 1.5, fontSize: '0.85rem' }}>
                  Collapse
                </Typography>
              )}
            </IconButton>
          </Tooltip>
        )}

        {/* Auth Button */}
        {isAuthenticated ? (
          <Tooltip title={collapsed ? 'Log Out' : ''} placement="right">
            <Button
              fullWidth
              startIcon={!collapsed ? <LogoutOutlinedIcon sx={{ fontSize: 18 }} /> : undefined}
              onClick={() => {
                logout();
                navigate('/login');
              }}
              sx={{
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: 'text.secondary',
                px: collapsed ? 1 : 1.5,
                py: 1,
                fontSize: '0.85rem',
                borderRadius: '6px',
                minWidth: 'unset',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.04)', color: '#FF4D4D' }
              }}
            >
              {collapsed
                ? <LogoutOutlinedIcon sx={{ fontSize: 18 }} />
                : 'Log Out'}
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title={collapsed ? 'Sign In' : ''} placement="right">
            <Button
              fullWidth
              variant={collapsed ? 'text' : 'contained'}
              disableElevation
              startIcon={!collapsed ? <LoginOutlinedIcon sx={{ fontSize: 18 }} /> : undefined}
              onClick={() => navigate('/login')}
              sx={{
                borderRadius: '6px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                minWidth: 'unset',
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1 : undefined,
                ...(collapsed
                  ? { color: 'text.secondary', '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)', color: '#FFFFFF' } }
                  : { backgroundColor: '#FFFFFF', color: '#000000', '&:hover': { backgroundColor: '#E2E2E2' } }),
              }}
            >
              {collapsed
                ? <LoginOutlinedIcon sx={{ fontSize: 18 }} />
                : 'Sign In'}
            </Button>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
