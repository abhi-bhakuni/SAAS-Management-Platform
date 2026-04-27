import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Divider,
  Fade
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { socketService } from '../services/socket';
import type { ActivityEvent } from '../services/socket';

interface ActivityFeedProps {
  orgId: string;
  projectId: string;
}

const getActivityIcon = (type: ActivityEvent['type']) => {
  const iconStyle = { fontSize: 18, color: 'text.secondary' };
  switch (type) {
    case 'task_created': return <AddCircleOutlineIcon sx={{ ...iconStyle, color: '#4ADE80' }} />; // Green
    case 'task_updated': return <EditOutlinedIcon sx={{ ...iconStyle, color: '#60A5FA' }} />; // Blue
    case 'task_moved': return <SwapHorizIcon sx={{ ...iconStyle, color: '#FACC15' }} />; // Yellow
    case 'task_assigned': return <PersonAddOutlinedIcon sx={{ ...iconStyle, color: '#C084FC' }} />; // Purple
    case 'task_deleted': return <DeleteOutlineIcon sx={{ ...iconStyle, color: '#EF4444' }} />; // Red
    default: return <HistoryIcon sx={iconStyle} />;
  }
};

import { activityApi } from '../services/api';

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ orgId, projectId }) => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Fetch historical activities
    const fetchActivities = async () => {
      try {
        const data = await activityApi.getActivity(projectId || undefined);
        const pastActivities = data.map((a: any) => ({
          id: a.id,
          type: a.type as ActivityEvent['type'],
          message: `${a.description} "${a.targetName}"`.trim(),
          userName: a.user,
          projectId: projectId,
          orgId: orgId,
          timestamp: new Date(a.timestamp),
        }));
        setActivities(pastActivities);
      } catch (err) {
        console.error("Failed to load past activities:", err);
      }
    };
    fetchActivities();

    // Connect to socket when component mounts
    socketService.connect(orgId, projectId, 'current-user-id');

    // Listen for connection changes
    const unsubscribeConnection = socketService.onConnectionChange(setIsConnected);

    // Listen for activity events
    const unsubscribeActivity = socketService.onActivity((event: ActivityEvent) => {
      setActivities(prev => [{ ...event, timestamp: new Date() }, ...prev.slice(0, 49)]);
    });

    return () => {
      unsubscribeConnection();
      unsubscribeActivity();
      socketService.disconnect();
    };
  }, [orgId, projectId]);

  const formatTimestamp = (timestamp: Date) => {
    const diffMs = new Date().getTime() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#18181B',
      color: 'text.primary'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2.5, 
        borderBottom: '1px solid', 
        borderColor: 'rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <HistoryIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
          <Typography variant="body1" fontWeight={700} sx={{ letterSpacing: '0.01em' }}>
            Project Activity
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            backgroundColor: isConnected ? '#4ADE80' : '#EF4444',
            boxShadow: isConnected ? '0 0 10px rgba(74, 222, 128, 0.4)' : 'none'
          }} />
          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isConnected ? 'Live' : 'Offline'}
          </Typography>
        </Box>
      </Box>

      {/* Activity List */}
      <List sx={{ flex: 1, overflow: 'visible', p: 0 }}>
        {activities.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.disabled">No recent activity</Typography>
          </Box>
        ) : (
          activities.map((activity, index) => (
            <Fade in={true} key={activity.id} style={{ transitionDelay: `${index * 50}ms` }}>
              <Box>
                <ListItem sx={{ 
                  py: 2, 
                  px: 2.5, 
                  alignItems: 'flex-start',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' }
                }}>
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '8px', 
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid',
                      borderColor: 'rgba(255, 255, 255, 0.05)'
                    }}>
                      {getActivityIcon(activity.type)}
                    </Box>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="#FFFFFF" sx={{ lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                        <Box component="span" sx={{ fontWeight: 700, mr: 0.5 }}>{activity.userName}</Box>
                        {activity.message}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                        {formatTimestamp(activity.timestamp)}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider sx={{ mx: 2.5, borderColor: 'rgba(255, 255, 255, 0.03)' }} />
              </Box>
            </Fade>
          ))
        )}
      </List>
    </Box>
  );
};