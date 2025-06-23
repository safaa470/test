import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import UserStats from './UserStats';
import UserFilters from './UserFilters';
import UserTable from './UserTable';
import UserModals from './UserModals';
import { useConfirmation } from '../../hooks/useConfirmation';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  const { confirmationState, showConfirmation, hideConfirmation } = useConfirmation();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleDelete = async (id, username) => {
    const confirmed = await showConfirmation({
      title: 'Delete User Account',
      message: `Are you sure you want to delete the user "${username}"? This action cannot be undone and will permanently remove all user data and activity history.`,
      confirmText: 'Delete User',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      try {
        await axios.delete(`/api/users/${id}`);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Error deleting user');
      }
    }
  };

  const handleToggleStatus = async (userId, currentStatus, username) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    const confirmed = await showConfirmation({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} the user "${username}"? ${
        currentStatus 
          ? 'This will prevent them from logging in.' 
          : 'This will allow them to log in again.'
      }`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel',
      type: currentStatus ? 'warning' : 'success'
    });

    if (confirmed) {
      try {
        await axios.put(`/api/users/${userId}/status`, {
          is_active: !currentStatus
        });
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      } catch (error) {
        toast.error('Error updating user status');
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleViewActivity = (userId) => {
    setSelectedUserId(userId);
    setShowActivityModal(true);
  };

  const handleModalSuccess = () => {
    fetchUsers();
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage user accounts, roles, and permissions</p>
        </div>
        
        <button onClick={handleAdd} className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      <UserStats users={users} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <UserFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
        />

        <UserTable
          users={filteredUsers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onViewActivity={handleViewActivity}
        />
      </div>

      <UserModals
        showModal={showModal}
        setShowModal={setShowModal}
        showActivityModal={showActivityModal}
        setShowActivityModal={setShowActivityModal}
        editingUser={editingUser}
        selectedUserId={selectedUserId}
        onSuccess={handleModalSuccess}
        confirmationState={confirmationState}
        hideConfirmation={hideConfirmation}
      />
    </div>
  );
};

export default UserManagementPage;