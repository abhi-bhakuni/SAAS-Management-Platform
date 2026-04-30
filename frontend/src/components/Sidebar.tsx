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
  Menu,
  MenuItem,
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
import MenuIcon from '@mui/icons-material/Menu';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const SUPPORT_EMAIL = 'support@nexus.com';

const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 56;

export function Sidebar() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();

  const [manualCollapsed, setManualCollapsed] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Collapsed when small screen OR manually collapsed
  const collapsed = isSmallScreen || manualCollapsed;
  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  const isSupportUser = user?.email === SUPPORT_EMAIL;

  const navItems = isSupportUser ? [
    {
      text: 'Settings',
      icon: <SettingsOutlinedIcon />,
      path: '/settings',
      active: location.pathname.startsWith('/settings'),
    },
    {
      text: 'Support',
      icon: <SupportAgentIcon />,
      path: '/support',
      active: location.pathname.startsWith('/support'),
    },
  ] : [
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
    },
  ];

  if (isSmallScreen) {
    return (
      <>
        {/* Zero-width placeholder keeps the flex-row layout intact */}
        <Box sx={{ width: 0, flexShrink: 0 }} />

        {/* Fixed top bar */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 56,
            zIndex: 1200,
            backgroundColor: '#0F0F11',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            px: 2,
            gap: 1.5,
          }}
        >
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

          <Typography variant="body2" fontWeight={600} color="text.primary" noWrap sx={{ flexGrow: 1 }}>
            {user?.name ?? 'Nexus'}
          </Typography>

          <IconButton
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            size="small"
            sx={{ color: 'text.secondary', '&:hover': { color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.05)' } }}
          >
            <MenuIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                sx: {
                  backgroundColor: '#18181B',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  minWidth: 200,
                  mt: 0.5,
                  backgroundImage: 'none',
                },
              },
            }}
          >
            {navItems.map((item) => (
              <MenuItem
                key={item.text}
                selected={item.active}
                onClick={() => { navigate(item.path); setMenuAnchor(null); }}
                sx={{
                  borderRadius: '6px',
                  mx: 0.5,
                  gap: 1.5,
                  color: item.active ? '#FFFFFF' : 'text.secondary',
                  '&.Mui-selected': { backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFFFFF' },
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 'unset', color: 'inherit', '& svg': { fontSize: 18 } }}>
                  {item.icon}
                </ListItemIcon>
                <Typography variant="body2" fontWeight={item.active ? 700 : 500}>{item.text}</Typography>
              </MenuItem>
            ))}

            <Divider sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.06)' }} />

            {isAuthenticated ? (
              <MenuItem
                onClick={() => { logout(); navigate('/login'); setMenuAnchor(null); }}
                sx={{ borderRadius: '6px', mx: 0.5, gap: 1.5, color: 'text.secondary', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)', color: '#FF4D4D' } }}
              >
                <ListItemIcon sx={{ minWidth: 'unset', color: 'inherit', '& svg': { fontSize: 18 } }}>
                  <LogoutOutlinedIcon />
                </ListItemIcon>
                <Typography variant="body2" fontWeight={500}>Log Out</Typography>
              </MenuItem>
            ) : (
              <MenuItem
                onClick={() => { navigate('/login'); setMenuAnchor(null); }}
                sx={{ borderRadius: '6px', mx: 0.5, gap: 1.5, color: 'text.secondary', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)', color: '#FFFFFF' } }}
              >
                <ListItemIcon sx={{ minWidth: 'unset', color: 'inherit', '& svg': { fontSize: 18 } }}>
                  <LoginOutlinedIcon />
                </ListItemIcon>
                <Typography variant="body2" fontWeight={500}>Sign In</Typography>
              </MenuItem>
            )}
          </Menu>
        </Box>
      </>
    );
  }

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
        <Tooltip title={collapsed ? (user?.name ?? 'Nexus') : ''} placement="right">
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
              {user?.name ?? 'Nexus'}
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
