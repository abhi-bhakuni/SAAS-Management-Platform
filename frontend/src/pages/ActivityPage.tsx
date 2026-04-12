import { useState, useMemo, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Divider,
  Fade,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  Chip,
  Skeleton,
  Fab,
  TextField,
  InputAdornment,
  Drawer,
  Button
} from '@mui/material';
import { Sidebar } from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import FilterListIcon from '@mui/icons-material/FilterList';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

import { activityApi } from '../services/api';

export function ActivityPage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await activityApi.getActivity();
        // Convert ISO strings back to Date objects if needed
        const processed = data.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }));
        setActivities(processed);
      } catch (error) {
        console.error('Failed to fetch activity logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const handleScroll = (e: any) => {
    setShowScrollTop(e.target.scrollTop > 300);
  };

  const filteredActivities = useMemo(() => {
    return activities.filter(item => {
      const matchType = typeFilter === 'all' || item.type.includes(typeFilter);
      const matchProject = projectFilter === 'all' || item.projectId === projectFilter;
      const matchSearch = item.targetName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.user.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchProject && matchSearch;
    });
  }, [activities, typeFilter, projectFilter, searchQuery]);

  const groupedActivities = useMemo(() => {
    const groups: { [key: string]: any[] } = {
      'Today': [],
      'Yesterday': [],
      'Earlier': []
    };

    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    filteredActivities.forEach(activity => {
      const date = new Date(activity.timestamp);
      date.setHours(0,0,0,0);

      if (date.getTime() === today.getTime()) groups['Today'].push(activity);
      else if (date.getTime() === yesterday.getTime()) groups['Yesterday'].push(activity);
      else groups['Earlier'].push(activity);
    });

    return groups;
  }, [filteredActivities]);

  const getActivityIcon = (type: string, color: string) => {
    const sx = { fontSize: 18, color };
    if (type.includes('created')) return <AddCircleOutlineIcon sx={sx} />;
    if (type.includes('moved') || type.includes('status')) return <SwapHorizIcon sx={sx} />;
    if (type.includes('assigned')) return <PersonAddOutlinedIcon sx={sx} />;
    if (type.includes('deleted')) return <DeleteOutlineIcon sx={sx} />;
    return <CheckCircleOutlineIcon sx={sx} />;
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#0F0F11', overflow: 'hidden' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header & Filter Bar */}
        <Box sx={{ 
          p: { xs: 3, md: 5 }, 
          pb: 3,
          borderBottom: '1px solid',
          borderColor: 'rgba(255, 255, 255, 0.05)',
          backgroundColor: '#0F0F11'
        }}>
          <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.02em', mb: 1 }}>
            Activity Feed
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={4}>
            The heartbeat of your workspace. Real-time system logs for every initiative.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                sx={selectStyle}
              >
                <MenuItem value="all">All Activities</MenuItem>
                <MenuItem value="task_created">Creations</MenuItem>
                <MenuItem value="task_moved">Transitions</MenuItem>
                <MenuItem value="task_assigned">Assignments</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                sx={selectStyle}
              >
                <MenuItem value="all">All Projects</MenuItem>
                <MenuItem value="mock-proj-1">Website Redesign</MenuItem>
                <MenuItem value="mock-proj-2">Mobile App</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ ...selectStyle, minWidth: 200, '& .MuiOutlinedInput-root': { py: '2px' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ flexGrow: 1 }} />

            <IconButton sx={{ color: 'text.disabled', '&:hover': { color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}>
              <FilterListIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Feed Content */}
        <Box 
          onScroll={handleScroll}
          sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 3, md: 5 }, scrollBehavior: 'smooth' }}
        >
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)' }} />
                ))}
              </Box>
            ) : filteredActivities.length === 0 ? (
              <Box sx={{ py: 10, textAlign: 'center' }}>
                <ReceiptLongOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.primary">No activity found</Typography>
                <Typography variant="body2" color="text.secondary">Try adjusting your filters to see more results.</Typography>
              </Box>
            ) : (
              Object.entries(groupedActivities).map(([group, items]) => (
                items.length > 0 && (
                  <Box key={group} sx={{ mb: 6 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 800, 
                        color: 'text.disabled', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.1em',
                        display: 'block',
                        mb: 3,
                        pl: 1
                      }}
                    >
                      • {group}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {items.map((activity, idx) => (
                        <Fade in={true} timeout={400 + idx * 50} key={activity.id}>
                          <Box 
                            onClick={() => setSelectedActivity(activity)}
                            sx={{ 
                              p: 2, 
                              borderRadius: '12px', 
                              backgroundColor: '#18181B', 
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              display: 'flex',
                              gap: 2.5,
                              alignItems: 'center',
                              transition: 'all 0.2s ease-in-out',
                              cursor: 'pointer',
                              '&:hover': { 
                                backgroundColor: '#27272A', 
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                transform: 'translateX(4px)'
                              }
                            }}
                          >
                            {/* Avatar */}
                            <Avatar 
                              src={activity.avatar} 
                              sx={{ width: 40, height: 40, border: '1px solid rgba(255, 255, 255, 0.1)' }} 
                            />

                            {/* Main Content */}
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, lineHeight: 1.4 }}>
                                <Box component="span" sx={{ fontWeight: 800, color: '#FFFFFF', mr: 1 }}>{activity.user}</Box>
                                {activity.description} 
                                <Box 
                                  onClick={(e) => { e.stopPropagation(); navigate(`/projects/${activity.projectId}`); }}
                                  component="span" 
                                  sx={{ 
                                    mx: 1, 
                                    fontWeight: 700, 
                                    color: activity.color, 
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' } 
                                  }}
                                >
                                  '{activity.targetName}'
                                </Box>
                                {activity.toStatus && (
                                  <>
                                    to 
                                    <Chip 
                                      label={activity.toStatus} 
                                      size="small" 
                                      sx={{ 
                                        ml: 1, 
                                        height: 20, 
                                        fontSize: '0.65rem', 
                                        fontWeight: 800, 
                                        backgroundColor: activity.color + '20', 
                                        color: activity.color,
                                        border: '1px solid ' + activity.color + '30'
                                      }} 
                                    />
                                  </>
                                )}
                              </Typography>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Tooltip title={activity.timestamp.toLocaleString()} arrow placement="top">
                                  <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                                    {formatRelativeTime(activity.timestamp)}
                                  </Typography>
                                </Tooltip>
                                <Divider orientation="vertical" flexItem sx={{ height: 10, alignSelf: 'center', opacity: 0.1 }} />
                                <Box 
                                  onClick={(e) => { e.stopPropagation(); navigate(`/projects/${activity.projectId}`); }}
                                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover': { '& span': { color: '#FFFFFF' } } }}
                                >
                                  <LayersOutlinedIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                  <Typography variant="caption" component="span" sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.7rem', transition: 'color 0.2s' }}>
                                    {activity.project}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>

                            {/* Icon Indicator */}
                            <Box sx={{ 
                              width: 32, 
                              height: 32, 
                              borderRadius: '8px', 
                              backgroundColor: 'rgba(255, 255, 255, 0.03)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              flexShrink: 0
                            }}>
                              {getActivityIcon(activity.type, activity.color)}
                            </Box>
                          </Box>
                        </Fade>
                      ))}
                    </Box>
                  </Box>
                )
              ))
            )}
          </Box>
        </Box>

        {/* Scroll Top Button */}
        <Fade in={showScrollTop}>
          <Fab 
            size="small" 
            onClick={() => {
              const scrollEl = document.querySelector('[onScroll]');
              scrollEl?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            sx={{ 
              position: 'absolute', 
              bottom: 40, 
              right: 40, 
              backgroundColor: '#FFFFFF', 
              color: '#000000',
              '&:hover': { backgroundColor: '#E2E2E2' }
            }}
          >
            <KeyboardArrowUpIcon />
          </Fab>
        </Fade>
      </Box>

      {/* Activity Detail Drawer */}
      <Drawer
        anchor="right"
        open={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        PaperProps={{
          sx: { 
            width: { xs: '100vw', sm: 400 }, 
            backgroundColor: '#141416', 
            borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundImage: 'none'
          }
        }}
      >
        <Box sx={{ h: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Typography variant="h6" fontWeight="700">Activity Details</Typography>
            <IconButton onClick={() => setSelectedActivity(null)} sx={{ color: 'text.disabled' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {selectedActivity && (
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={selectedActivity.avatar} sx={{ width: 48, height: 48 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight="800">{selectedActivity.user}</Typography>
                  <Typography variant="caption" color="text.disabled">{selectedActivity.timestamp.toLocaleString()}</Typography>
                </Box>
              </Box>

              <Divider sx={{ opacity: 0.05 }} />

              <Box>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>Event</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {getActivityIcon(selectedActivity.type, selectedActivity.color)}
                  <Typography variant="body1" fontWeight="600">{selectedActivity.description}</Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>Target</Typography>
                <Typography variant="h6" fontWeight="800" color={selectedActivity.color}>{selectedActivity.targetName}</Typography>
                <Typography variant="caption" color="text.disabled">ID: {selectedActivity.targetId || 'N/A'}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>Project</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LayersOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                  <Typography variant="body2" fontWeight="700">{selectedActivity.project}</Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>Additional Details</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.6 }}>
                  "{selectedActivity.detail}"
                </Typography>
              </Box>

              <Box sx={{ mt: 'auto', pt: 4 }}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  onClick={() => navigate(`/projects/${selectedActivity.projectId}`)}
                  sx={{ 
                    borderRadius: '8px', 
                    color: '#FFFFFF', 
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    textTransform: 'none',
                    fontWeight: 700,
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.2)' }
                  }}
                >
                  View in Context
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}

const selectStyle = { 
  borderRadius: '8px', 
  fontSize: '0.85rem', 
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.1)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' }
};

function formatRelativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}
