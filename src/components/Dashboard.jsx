import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, AlertTriangle, DollarSign, FolderTree, TrendingUp, Users, FileText, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    totalCategories: 0
  });
  const [requisitionStats, setRequisitionStats] = useState({
    totalRequisitions: 0,
    pendingApprovals: 0,
    myRequisitions: 0,
    approvedThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRequisitionStats();
    fetchRecentActivity();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRequisitionStats = async () => {
    try {
      const response = await axios.get('/api/requisitions/stats/dashboard');
      setRequisitionStats(response.data);
    } catch (error) {
      console.error('Error fetching requisition stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      if (user?.id) {
        const response = await axios.get(`/api/users/${user.id}/activity`, {
          params: { filter: 'all', days: '7' }
        });
        setRecentActivity(response.data.slice(0, 5)); // Get last 5 activities
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
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

  const statCards = [
    {
      title: 'Total Items',
      value: stats.totalItems,
      icon: Package,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
      change: '-5%',
      changeType: 'negative'
    },
    {
      title: 'Total Value',
      value: `$${stats.totalValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      icon: FolderTree,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+2%',
      changeType: 'positive'
    }
  ];

  const requisitionCards = [
    {
      title: 'Total Requisitions',
      value: requisitionStats.totalRequisitions,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Pending Approvals',
      value: requisitionStats.pendingApprovals,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'My Requisitions',
      value: requisitionStats.myRequisitions,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Approved This Month',
      value: requisitionStats.approvedThisMonth,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.username}! Here's your warehouse overview</p>
      </div>

      {/* Inventory Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${card.bgColor}`}>
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    </div>
                  </div>
                  {card.change && (
                    <div className={`text-sm font-medium ${
                      card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.change}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Requisition Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Requisition Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {requisitionCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full btn-primary text-left flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Add New Item
            </button>
            <button className="w-full btn-secondary text-left flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Create Requisition
            </button>
            <button className="w-full btn-success text-left flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Generate Report
            </button>
            <button className="w-full btn-warning text-left flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Export Inventory
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {recentActivity.length > 0 ? (
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
      </div>

      {/* System Information */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">Online</div>
            <div className="text-sm text-gray-500">System Status</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">Connected</div>
            <div className="text-sm text-gray-500">Database</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">Today</div>
            <div className="text-sm text-gray-500">Last Backup</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">Available</div>
            <div className="text-sm text-gray-500">Network Access</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;