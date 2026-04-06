import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsApi } from '../services/api';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActionArea,
  Avatar,
  AvatarGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';

export function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  useEffect(() => {
    const fetchProjects = async () => {
      if (user?.selectedOrgId) {
        try {
          // The API returns { data: [...], meta: {...} } or just [...]
          const result = await projectsApi.getProjects(user.selectedOrgId);
          setProjects(result.data || result);
        } catch (error) {
          console.error("Failed to fetch projects", error);
        }
      }
      setIsLoading(false);
    };
    fetchProjects();
  }, [user?.selectedOrgId]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleCreateProject = async () => {
    if (!newProject.name || !user?.selectedOrgId) return;
    try {
      const created = await projectsApi.createProject(user.selectedOrgId, newProject);
      setProjects([created, ...projects]);
      setNewProject({ name: '', description: '' });
      handleCloseModal();
    } catch (error) {
      console.error("Failed to create project", error);
    }
  };

  const navItems = [
    { text: 'Dashboard', icon: <DashboardOutlinedIcon />, active: false },
    { text: 'Projects', icon: <FolderOutlinedIcon />, active: true },
    { text: 'Tasks', icon: <CheckBoxOutlinedIcon />, active: false },
    { text: 'Settings', icon: <SettingsOutlinedIcon />, active: false }
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'background.default' }}>
      
      {/* Left Sidebar */}
      <Box sx={{ 
        width: 260, 
        borderRight: '1px solid', 
        borderColor: 'divider', 
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        py: 3,
        px: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, px: 2, gap: 1.5 }}>
          <Box sx={{ 
            width: 32, 
            height: 32, 
            borderRadius: '8px', 
            backgroundColor: 'text.primary', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'background.paper'
          }}>
            <WidgetsOutlinedIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle1" fontWeight="600" color="text.primary">
            Startup Workspace
          </Typography>
        </Box>

        <List sx={{ px: 0 }}>
          {navItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                selected={item.active}
                sx={{ 
                  borderRadius: '8px',
                  py: 1,
                  px: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                    color: 'text.primary',
                    '& .MuiListItemIcon-root': { color: 'text.primary' }
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 36, 
                  color: item.active ? 'text.primary' : 'text.secondary',
                  '& svg': { fontSize: 20 }
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontSize: '0.9rem', 
                    fontWeight: item.active ? 600 : 500,
                    color: item.active ? 'text.primary' : 'text.secondary'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Navigation Bar */}
        <Box sx={{ 
          height: 64, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          px: 4,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}>
          <Typography variant="h6" fontWeight="600" color="text.primary">
            Projects
          </Typography>
          
          <Button 
            variant="contained" 
            disableElevation
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              py: 0.8,
              backgroundColor: 'text.primary',
              color: 'background.paper',
              '&:hover': {
                backgroundColor: 'grey.800',
              }
            }}
          >
            New Project
          </Button>
        </Box>

        {/* Scrollable Area */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 3, md: 5 } }}>
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            
            {isLoading ? (
              <Box sx={{ textAlign: 'center', py: 12 }}>
                 <Typography color="text.secondary">Loading projects...</Typography>
              </Box>
            ) : projects.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 12, 
                backgroundColor: 'background.paper',
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: '12px'
              }}>
                <FolderOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.primary" fontWeight="600" gutterBottom>
                  No projects yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first project to get started organizing your tasks.
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  onClick={handleOpenModal}
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500 }}
                >
                  Create Project
                </Button>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
                gap: 3 
              }}>
                {projects.map((project) => (
                  <Card 
                    key={project.id}
                    elevation={0}
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: 'background.paper',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 24px -10px rgba(0,0,0,0.06)',
                        borderColor: 'primary.light'
                      }
                    }}
                  >
                    <CardActionArea 
                      onClick={() => navigate(`/projects/${project.id}`)}
                      sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', p: 1 }}
                    >
                      <CardContent sx={{ flexGrow: 1, width: '100%', p: 2 }}>
                        <Typography variant="subtitle1" fontWeight="600" component="div" sx={{ mb: 1, color: 'text.primary' }}>
                          {project.name}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                          {project.description}
                        </Typography>

                        <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <AvatarGroup max={4} sx={{ 
                            '& .MuiAvatar-root': { 
                              width: 24, 
                              height: 24, 
                              fontSize: '0.7rem', 
                              borderColor: 'background.paper',
                              borderWidth: 2
                            } 
                          }}>
                            {/* Dummy avatars for visual continuity since API members aren't directly nested */}
                            <Avatar alt="Member 1" src={`https://i.pravatar.cc/150?u=${project.id}0`} />
                          </AvatarGroup>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                            <AccessTimeOutlinedIcon sx={{ fontSize: 14, mr: 0.5 }} />
                            <Typography variant="caption" sx={{ fontWeight: 400 }}>
                              {new Date(project.updatedAt || project.createdAt || Date.now()).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* New Project Modal */}
      <Dialog 
        open={isModalOpen} 
        onClose={handleCloseModal}
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: '12px',
            width: '100%',
            maxWidth: 400,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem', pb: 1, pt: 2.5 }}>New Project</DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            variant="outlined"
            size="small"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            sx={{ mb: 2, mt: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            size="small"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseModal} sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 500, borderRadius: '6px' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateProject} 
            variant="contained"
            disableElevation
            disabled={!newProject.name}
            sx={{ 
              borderRadius: '6px', 
              textTransform: 'none', 
              fontWeight: 500,
              backgroundColor: 'text.primary',
              color: 'background.paper',
              '&:hover': {
                backgroundColor: 'grey.800',
              }
            }}
          >
            Create Project
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
