import React, { useState, useEffect } from 'react';
import { socketService } from '../services/socket';
import type { ActivityEvent } from '../services/socket';

interface ActivityFeedProps {
  orgId: string;
  projectId: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ orgId, projectId }) => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to socket when component mounts
    socketService.connect(orgId, projectId, 'current-user-id'); // TODO: Get actual user ID

    // Listen for connection changes
    const unsubscribeConnection = socketService.onConnectionChange(setIsConnected);

    // Listen for activity events
    const unsubscribeActivity = socketService.onActivity((event: ActivityEvent) => {
      setActivities(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 activities
    });

    return () => {
      unsubscribeConnection();
      unsubscribeActivity();
      socketService.disconnect();
    };
  }, [orgId, projectId]);

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'task_created':
        return '➕';
      case 'task_updated':
        return '✏️';
      case 'task_moved':
        return '↗️';
      case 'task_assigned':
        return '👤';
      case 'task_deleted':
        return '🗑️';
      default:
        return '📝';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Activity Feed</h3>
        <div className={`flex items-center space-x-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}></div>
          <span>{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No recent activity
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-lg">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500">{activity.userName}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">{formatTimestamp(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};