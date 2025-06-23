import React from 'react';
import { User, Shield, UserCheck, Clock } from 'lucide-react';

const UserStats = ({ users }) => {
  // Ensure users is always an array
  const usersArray = Array.isArray(users) ? users : [];
  
  const totalUsers = usersArray.length;
  const adminUsers = usersArray.filter(u => u.role === 'admin').length;
  const activeUsers = usersArray.filter(u => u.is_active !== false).length;
  const recentLogins = usersArray.filter(u => 
    u.last_login && new Date(u.last_login) > new Date(Date.now() - 24*60*60*1000)
  ).length;

  const statCards = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: User,
      color: 'text-primary-500',
      bgColor: 'bg-primary-50'
    },
    {
      title: 'Admins',
      value: adminUsers,
      icon: Shield,
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Active Users',
      value: activeUsers,
      icon: UserCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Recent Logins',
      value: recentLogins,
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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
  );
};

export default UserStats;