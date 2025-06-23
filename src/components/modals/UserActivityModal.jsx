import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X, Clock, User, Activity, Calendar, Filter } from 'lucide-react';

const UserActivityModal = ({ userId, onClose }) => {
  const [activities, setActivities] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7');

  useEffect(() => {
    if (userId) {
      fetchUserActivity();
      fetchUserDetails();
    }
  }, [userId, filter, dateRange]);

  const fetchUserActivity = async () => {
    try {
      const response = await axios.get(`/api/users/${userId}/activity`, {
        params: { filter, days: dateRange }
      });
      setActivities(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Error fetching user activity');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(`/api/users/${userId}`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

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

  const getActivityColor = (action) => {
    switch (action) {
      case 'login':
        return 'text-green-600 bg-green-50';
      case 'logout':
        return 'text-gray-600 bg-gray-50';
      case 'create':
        return 'text-blue-600 bg-blue-50';
      case 'update':
        return 'text-yellow-600 bg-yellow-50';
      case 'delete':
        return 'text-red-600 bg-red-50';
      case 'export':
      case 'import':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-primary-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">User Activity</h2>
              {user && (
                <p className="text-sm text-gray-600">{user.username} ({user.email})</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  className="form-select"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Activities</option>
                  <option value="login">Login/Logout</option>
                  <option value="inventory">Inventory Actions</option>
                  <option value="user">User Management</option>
                  <option value="system">System Actions</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <select
                  className="form-select"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="1">Last 24 hours</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.action)}`}>
                      <span className="text-lg">{getActivityIcon(activity.action)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description || `${activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} action`}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </div>
                      
                      {activity.details && (
                        <p className="mt-1 text-sm text-gray-600">{activity.details}</p>
                      )}
                      
                      {activity.ip_address && (
                        <p className="mt-1 text-xs text-gray-500">
                          IP: {activity.ip_address}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Activity className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No activity found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No activities match your current filters.
                  </p>
                </div>
              )}
            </div>

            {/* Summary Stats */}
            {user && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-900">Total Logins</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {activities.filter(a => a.action === 'login').length}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-green-900">Last Login</div>
                    <div className="text-sm font-semibold text-green-600">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-purple-900">Total Activities</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {activities.length}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserActivityModal;