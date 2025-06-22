import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Package, 
  LayoutDashboard,
  Users,
  FileText,
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/inventory', icon: Package, label: 'Inventory' },
    { to: '/requisitions', icon: FileText, label: 'Requisitions' },
  ];

  // Add admin-only routes
  if (user?.role === 'admin') {
    navItems.push(
      { to: '/users', icon: Users, label: 'User Management' }
    );
  }

  return (
    <div className="bg-white w-64 shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Package className="h-8 w-8 text-primary-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">WMS</h1>
            <p className="text-xs text-gray-600">Warehouse Management</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200 ${
                isActive ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500' : ''
              }`
            }
          >
            <Icon className="h-5 w-5 mr-3" />
            <span className="font-medium">{label}</span>
            <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;