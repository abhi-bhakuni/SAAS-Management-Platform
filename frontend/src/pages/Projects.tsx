import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { billingApi, projectsApi } from '../services/api';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  AvatarGroup,
  Skeleton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { Sidebar } from '../components/Sidebar';
import { CreateProjectModal } from '../components/CreateProjectModal';

export function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.selectedOrgId) {
        setProjects([]);
        setIsLoading(false);
        return;
      }

      try {
        const result = await projectsApi.getProjects();
        setProjects(result.data || result);
      } catch (error) {
        console.error("Failed to fetch projects", error);
        showToast('Failed to load projects. Please refresh.', 'error');
      }
      setIsLoading(false);
    };
    fetchProjects();
  }, [user?.selectedOrgId, user]);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const billingResponse = await billingApi.getMySubscription();
        setSubscription(billingResponse.subscription ?? null);
      } catch (error) {
        console.error('Failed to load subscription data', error);
      }
    };

    if (user?.selectedOrgId) {
      fetchSubscription();
    }
  }, [user?.selectedOrgId, user]);

  const currentPlan = subscription?.subscriptionPlan;
  const projectLimit = Number(currentPlan?.limits?.projects ?? 5);
  const isProjectLimitReached = projects.length >= projectLimit;

  const handleOpenModal = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isProjectLimitReached) {
      showToast(`Free plan allows only ${projectLimit} projects. Upgrade to add more.`, 'warning');
      return;
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => setIsModalOpen(false);

  const refreshProjects = async () => {
    try {
      const result = await projectsApi.getProjects();
      setProjects(result.data || result);
    } catch {
      showToast('Failed to refresh projects.', 'error');
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#0F0F11', pt: { xs: '56px', md: 0 } }}>
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
            disabled={isProjectLimitReached || user?.orgRole === 'MEMBER'}
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
                  disabled={user?.orgRole === 'MEMBER'}
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

      <CreateProjectModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onCreated={refreshProjects}
      />
    </Box>
  );
}
