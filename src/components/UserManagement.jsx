import React from 'react';
import UserManagementPage from './users/UserManagementPage';

// This is a wrapper component to maintain backward compatibility
const UserManagement = () => {
  return <UserManagementPage />;
};

export default UserManagement;