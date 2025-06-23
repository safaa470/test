import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import DashboardStats from './Dashboard/DashboardStats';
import QuickActions from './Dashboard/QuickActions';
import RecentActivity from './Dashboard/RecentActivity';
import SystemInfo from './Dashboard/SystemInfo';

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
      setStats(response.data || {
        totalItems: 0,
        lowStockItems: 0,
        totalValue: 0,
        totalCategories: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalItems: 0,
        lowStockItems: 0,
        totalValue: 0,
        totalCategories: 0
      });
    }
  };

  const fetchRequisitionStats = async () => {
    try {
      const response = await axios.get('/api/requisitions/stats/dashboard');
      setRequisitionStats(response.data || {
        totalRequisitions: 0,
        pendingApprovals: 0,
        myRequisitions: 0,
        approvedThisMonth: 0
      });
    } catch (error) {
      console.error('Error fetching requisition stats:', error);
      setRequisitionStats({
        totalRequisitions: 0,
        pendingApprovals: 0,
        myRequisitions: 0,
        approvedThisMonth: 0
      });
    }
  };

  const fetchRecentActivity = async () => {
    try {
      if (user?.id) {
        const response = await axios.get(`/api/users/${user.id}/activity`, {
          params: { filter: 'all', days: '7' }
        });
        // Ensure response.data is an array before setting state
        const activityData = Array.isArray(response.data) ? response.data.slice(0, 5) : [];
        setRecentActivity(activityData);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

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

      <DashboardStats stats={stats} requisitionStats={requisitionStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <RecentActivity recentActivity={recentActivity} />
      </div>

      <SystemInfo />
    </div>
  );
};

export default Dashboard;