import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import toast from 'react-hot-toast';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Welcome back, {user?.username}!
          </h2>
          <p className="text-sm text-gray-600">
            Manage your warehouse operations efficiently
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-gray-700">
            <User className="h-5 w-5" />
            <span className="font-medium">{user?.username}</span>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
              {user?.role}
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-700 hover:text-error-600 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;