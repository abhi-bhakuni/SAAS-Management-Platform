import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Avatar, 
  Divider,
  Button,
  Chip
} from '@mui/material';
import { Sidebar } from '../components/Sidebar';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';

export function Dashboard() {
  const stats = [
    { 
      label: 'Total Projects', 
      value: '12', 
      trend: '+2 this month', 
      icon: <FolderOutlinedIcon sx={{ color: '#60A5FA' }} />,
      color: 'rgba(96, 165, 250, 0.1)'
    },
    { 
      label: 'Active Tasks', 
      value: '48', 
      trend: '+12% from last week', 
      icon: <AssignmentOutlinedIcon sx={{ color: '#FACC15' }} />,
      color: 'rgba(250, 204, 21, 0.1)'
    },
    { 
      label: 'Completed Tasks', 
      value: '156', 
      trend: '+24 since yesterday', 
      icon: <TaskAltIcon sx={{ color: '#4ADE80' }} />,
      color: 'rgba(74, 222, 128, 0.1)'
    }
  ];

  const taskDistribution = [
    { label: 'Todo', value: 45, color: '#FACC15' },
    { label: 'In Progress', value: 30, color: '#60A5FA' },
    { label: 'In Review', value: 15, color: '#C084FC' },
    { label: 'Done', value: 10, color: '#4ADE80' }
  ];

  const recentActivities = [
    { user: 'Alex Riv', action: 'moved task to Done', time: '2m ago' },
    { user: 'Sarah Co', action: 'created new project "Alpha"', time: '1h ago' },
    { user: 'John Doe', action: 'voted on Task #12', time: '3h ago' }
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: 'background.default' }}>
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
          {stats.map((stat) => (
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
          ))}
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
                {taskDistribution.map((item) => (
                  <Box key={item.label}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight="600">{item.label}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.value}%</Typography>
                    </Box>
                    <Box sx={{ position: 'relative', height: 8, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 4 }}>
                      <Box sx={{ 
                        position: 'absolute', 
                        height: '100%', 
                        width: `${item.value}%`, 
                        backgroundColor: item.color, 
                        borderRadius: 4,
                        boxShadow: `0 0 10px ${item.color}44`
                      }} />
                    </Box>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: 4, opacity: 0.05 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.disabled" fontWeight="700">WEEKLY COMPLETION RATE</Typography>
                  <Typography variant="h5" fontWeight="800">76.4%</Typography>
                </Box>
                <Button size="small" sx={{ color: 'primary.main', fontWeight: 700 }}>View Details</Button>
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
                {recentActivities.map((activity, i) => (
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
                      <Typography variant="caption" color="text.disabled">{activity.time}</Typography>
                    </Box>
                  </Box>
                ))}
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
                <Button size="small" sx={{ fontWeight: 700 }}>Launch Setup</Button>
              </Box>
            </Card>
          </Grid>
        </Grid>

      </Box>
    </Box>
  );
}

