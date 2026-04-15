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
  Avatar,
  AvatarGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Skeleton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { Sidebar } from '../components/Sidebar';

export function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const result = await projectsApi.getProjects(user?.selectedOrgId);
        setProjects(result.data || result);
      } catch (error) {
        console.error("Failed to fetch projects", error);
      }
      setIsLoading(false);
    };
    fetchProjects();
  }, [user?.selectedOrgId, user]);

  const handleOpenModal = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsModalOpen(true);
  };
  
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

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#0F0F11' }}>
      <Sidebar />

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Navigation Bar */}
        <Box sx={{ 
          height: 60, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          px: 4,
          borderBottom: '1px solid',
          borderColor: 'rgba(255, 255, 255, 0.05)',
          backgroundColor: '#0F0F11'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" sx={{ color: 'text.disabled', fontWeight: 500, cursor: 'pointer', '&:hover': { color: 'text.secondary' } }} onClick={() => navigate('/dashboard')}>
              Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.2)' }}>/</Typography>
            <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
              Projects
            </Typography>
          </Box>
          
          <Button 
            variant="contained" 
            disableElevation
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
            sx={{ 
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              px: 2,
              py: 0.6,
              backgroundColor: '#FFFFFF',
              color: '#000000',
              '&:hover': { backgroundColor: '#E2E2E2' }
            }}
          >
            New Project
          </Button>
        </Box>

        {/* Scrollable Area */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 3, md: 5 } }}>
          <Box sx={{ maxWidth: 1200 }}>
            <Box sx={{ mb: 5 }}>
              <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
                Projects
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your team's workflows and launch new initiatives.
              </Typography>
            </Box>
            
            {isLoading ? (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
                gap: 3 
              }}>
                <Skeleton variant="rounded" height={220} sx={{ borderRadius: '16px', bgcolor: 'rgba(255, 255, 255, 0.05)' }} />
              </Box>
            ) : projects.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 12, 
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                border: '1px dashed',
                borderColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: '12px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                  mb: 3,
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <FolderOutlinedIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
                </Box>
                <Typography variant="h6" color="text.primary" fontWeight="700" gutterBottom>
                  Start your first project
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 320, mx: 'auto', lineHeight: 1.6 }}>
                  Launch a new project to organize your tasks and collaborate with your team in real-time.
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  onClick={handleOpenModal}
                  sx={{ 
                    borderRadius: '8px', 
                    textTransform: 'none', 
                    fontWeight: 700,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    px: 3,
                    '&:hover': {
                      borderColor: '#FFFFFF',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                >
                  Create Project
                </Button>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: 'repeat(2, 1fr)', 
                  lg: 'repeat(3, 1fr)' 
                }, 
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
                      borderRadius: '16px',
                      border: '1px solid',
                      borderColor: 'rgba(255, 255, 255, 0.05)',
                      backgroundColor: '#18181B',
                      transition: 'all 0.2s cubic-bezier(0.165, 0.84, 0.44, 1)',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
                        backgroundColor: '#1C1C20'
                      }
                    }}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 4 }}>
                      <Typography variant="h6" fontWeight="800" sx={{ mb: 1, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                        {project.name}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        mb: 5, 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden', 
                        lineHeight: 1.7,
                        height: '3.4em',
                        fontSize: '0.875rem'
                      }}>
                        {project.description || "Crafting something amazing with this new workspace initialization."}
                      </Typography>
 
                      <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <AvatarGroup max={4} sx={{ 
                          '& .MuiAvatar-root': { 
                            width: 28, 
                            height: 28, 
                            fontSize: '0.75rem', 
                            borderColor: '#18181B',
                            borderWidth: 2,
                            fontWeight: 700,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                          } 
                        }}>
                          <Avatar alt="Member 1" src={`https://i.pravatar.cc/150?u=${project.id}1`} />
                          <Avatar alt="Member 2" src={`https://i.pravatar.cc/150?u=${project.id}2`} />
                          <Avatar sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'text.disabled' }}>+</Avatar>
                        </AvatarGroup>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.disabled', gap: 0.5 }}>
                          <AccessTimeOutlinedIcon sx={{ fontSize: 14 }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {new Date(project.updatedAt || project.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
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
            backgroundColor: '#18181B',
            border: '1px solid',
            borderColor: '#2A2A2E',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', pb: 1, pt: 3, color: '#FFFFFF' }}>
          Create New Project
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Give your project a name and a brief description to get started.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            placeholder="e.g. Website Redesign"
            type="text"
            fullWidth
            variant="outlined"
            size="small"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            sx={{ 
              mb: 3, 
              mt: 1, 
              '& .MuiOutlinedInput-root': { 
                borderRadius: '8px',
                backgroundColor: '#0F0F11',
                '& fieldset': { borderColor: '#2A2A2E' },
                '&:hover fieldset': { borderColor: '#3F3F46' },
              } 
            }}
          />
          <TextField
            margin="dense"
            label="Description"
            placeholder="What is this project about?"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            size="small"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: '8px',
                backgroundColor: '#0F0F11',
                '& fieldset': { borderColor: '#2A2A2E' },
                '&:hover fieldset': { borderColor: '#3F3F46' },
              } 
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 4, pt: 0, gap: 1.5 }}>
          <Button 
            onClick={handleCloseModal} 
            sx={{ 
              color: 'text.secondary', 
              textTransform: 'none', 
              fontWeight: 600, 
              borderRadius: '6px',
              px: 2,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#FFFFFF' }
            }}
          >
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
              fontWeight: 700,
              px: 3,
              py: 0.8,
              backgroundColor: '#FFFFFF',
              color: '#000000',
              '&:hover': {
                backgroundColor: '#E2E2E2',
              },
              '&.Mui-disabled': {
                backgroundColor: '#2A2A2E',
                color: '#71717A'
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
