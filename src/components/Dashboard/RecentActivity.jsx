import React from 'react';
import { Clock } from 'lucide-react';

const RecentActivity = ({ recentActivity }) => {
  const getActivityIcon = (action) => {
    switch (action) {
      case 'login':
        return '🔐';
      case 'logout':
        return '🚪';
      case 'create':
        return '➕';
      case 'update':
        return '✏️';
      case 'delete':
        return '🗑️';
      case 'export':
        return '📤';
      case 'import':
        return '📥';
      default:
        return '📝';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      {Array.isArray(recentActivity) && recentActivity.length > 0 ? (
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={activity.id || index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">{getActivityIcon(activity.action)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Clock className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No recent activity</p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;