import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Avatar, 
  Divider,
  Button,
  Chip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Sidebar } from '../components/Sidebar';
import { dashboardApi, projectsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await dashboardApi.getStats(user?.selectedOrgId ?? "");
        setData(result);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

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
      await projectsApi.createProject(newProject);
      setNewProject({ name: '', description: '' });
      handleCloseModal();
      // Refresh dashboard stats after creating a project
      const result = await dashboardApi.getStats(user?.selectedOrgId ?? "");
      setData(result);
    } catch (error) {
      console.error('Failed to create project', error);
    }
  };

  const stats = data ? [
    { 
      label: 'Total Projects', 
      value: data.stats.totalProjects, 
      trend: data.trends?.totalProjects ?? null, 
      icon: <FolderOutlinedIcon sx={{ color: '#60A5FA' }} />,
      color: 'rgba(96, 165, 250, 0.1)'
    },
    { 
      label: 'Active Tasks', 
      value: data.stats.activeTasks, 
      trend: data.trends?.activeTasks ?? null, 
      icon: <AssignmentOutlinedIcon sx={{ color: '#FACC15' }} />,
      color: 'rgba(250, 204, 21, 0.1)'
    },
    { 
      label: 'Completed Tasks', 
      value: data.stats.completedTasks, 
      trend: data.trends?.completedTasks ?? null, 
      icon: <TaskAltIcon sx={{ color: '#4ADE80' }} />,
      color: 'rgba(74, 222, 128, 0.1)'
    }
  ] : [];

  return (
    <>
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#0F0F11' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: { xs: 3, md: 5 }, overflowY: 'auto' }}>
        
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
          <Box>
            <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.02em' }}>
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overview of your workspace and latest updates.
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
            sx={{ 
              borderRadius: '8px', 
              backgroundColor: '#FFFFFF', 
              color: '#000000',
              fontWeight: 700,
              '&:hover': { backgroundColor: '#E2E2E2' }
            }}
          >
            New Project
          </Button>
        </Box>

        {/* Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {loading ? (
            [1, 2, 3].map(i => (
              <Grid size={{ xs: 12, md: 4 }} key={i}>
                <Skeleton variant="rounded" height={140} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)' }} />
              </Grid>
            ))
          ) : (
            stats.map((stat) => (
              <Grid size={{ xs: 12, md: 4 }} key={stat.label}>
                <Card sx={{ 
                  p: 1.5,
                  backgroundColor: '#18181B', 
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}>
                  <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ 
                        p: 1, 
                        borderRadius: '10px', 
                        backgroundColor: stat.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {stat.icon}
                      </Box>
                      {stat.trend && (
                        <Chip 
                          label={stat.trend} 
                          size="small" 
                          sx={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 700, 
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            color: 'text.secondary',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                          }} 
                        />
                      )}
                    </Box>
                    <Typography variant="h3" fontWeight="800" sx={{ letterSpacing: '-0.02em' }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.disabled" fontWeight="600">
                      {stat.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        <Grid container spacing={4}>
          {/* Quick Stats Chart */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ 
              p: 3, 
              height: '100%',
              backgroundColor: '#18181B', 
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h6" fontWeight="700">Task Distribution</Typography>
                <TrendingUpIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                {loading ? (
                  [1, 2, 3, 4].map(i => <Skeleton key={i} height={30} sx={{ bgcolor: 'rgba(255,255,255,0.02)' }} />)
                ) : (
                  data?.projectStatus.map((item: any, index: number) => {
                    const statusColors: Record<string, string> = {
                      "Completed": "#10B981",
                      "In Progress": "#3B82F6",
                      "Review": "#A855F7"
                    };
                    const color = statusColors[item.name] || ['#10B981', '#3B82F6', '#A855F7'][index % 3];
                    
                    return (
                      <Box key={item.name}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" fontWeight="600">{item.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{item.value}%</Typography>
                        </Box>
                        <Box sx={{ position: 'relative', height: 8, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 4 }}>
                          <Box sx={{ 
                            position: 'absolute', 
                            height: '100%', 
                            width: `${item.value}%`, 
                            backgroundColor: color, 
                            borderRadius: 4,
                            boxShadow: `0 0 10px ${color}44`
                          }} />
                        </Box>
                      </Box>
                    );
                  })
                ) || null}
              </Box>

              <Divider sx={{ my: 4, opacity: 0.05 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.disabled" fontWeight="700">MONTHLY COMPLETION RATE</Typography>
                  <Typography variant="h5" fontWeight="800">
                    {((data?.projectStatus.find((s: any) => s.name === "Completed")?.value ?? 0) * 100) / (data?.projectStatus.reduce((sum: number, s: any) => sum + (s.value ?? 0), 0) || 1)}%
                  </Typography>
                </Box>
                <Button size="small" onClick={() => navigate('/tasks')} sx={{ color: 'primary.main', fontWeight: 700 }}>View Details</Button>
              </Box>
            </Card>
          </Grid>

          {/* Recent Activity Preview */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ 
              p: 3, 
              height: '100%',
              backgroundColor: '#18181B', 
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                <HistoryIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                <Typography variant="h6" fontWeight="700">Recent Activity</Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {loading ? (
                  [1, 2, 3].map(i => <Skeleton key={i} height={50} sx={{ bgcolor: 'rgba(255,255,255,0.02)' }} />)
                ) : (
                  data?.recentActivity.map((activity: any, i: number) => (
                    <Box key={i} sx={{ display: 'flex', gap: 2 }}>
                      <Avatar sx={{ 
                        width: 32, 
                        height: 32, 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        {activity.user[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                          <Box component="span" sx={{ fontWeight: 700 }}>{activity.user}</Box> {activity.action}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">{activity.timestamp}</Typography>
                      </Box>
                    </Box>
                  ))
                ) || null}
              </Box>

              <Divider sx={{ my: 4, opacity: 0.05 }} />

              <Box sx={{ 
                p: 2, 
                borderRadius: '10px', 
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                <Typography variant="caption" color="text.disabled" display="block" mb={1}>
                  HAVE A NEW PROJECT?
                </Typography>
                <Button size="small" onClick={handleOpenModal} sx={{ fontWeight: 700 }}>Launch Setup</Button>
              </Box>
            </Card>
          </Grid>
        </Grid>

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
            disabled={!newProject.name || !newProject.description}
            sx={{
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              py: 0.8,
              backgroundColor: '#FFFFFF',
              color: '#000000',
              '&:hover': { backgroundColor: '#E2E2E2' },
              '&.Mui-disabled': { backgroundColor: '#2A2A2E', color: '#71717A' }
            }}
          >
            Create Project
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

