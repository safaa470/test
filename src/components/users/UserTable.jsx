import React from 'react';
import { 
  Edit, 
  Trash2, 
  Clock, 
  UserX, 
  UserCheck, 
  User, 
  Mail 
} from 'lucide-react';

const UserTable = ({ 
  users, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onViewActivity 
}) => {
  // Ensure users is always an array
  const usersArray = Array.isArray(users) ? users : [];

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role & Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Activity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {usersArray.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      {user.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.is_active !== false)}`}>
                      {user.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {user.last_login ? (
                    <>
                      <div>{new Date(user.last_login).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(user.last_login).toLocaleTimeString()}
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-400">Never</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onViewActivity(user.id)}
                    className="text-blue-600 hover:text-blue-900"
                    title="View Activity"
                  >
                    <Clock className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onToggleStatus(user.id, user.is_active !== false, user.username)}
                    className={`${user.is_active !== false ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                    title={user.is_active !== false ? 'Deactivate User' : 'Activate User'}
                  >
                    {user.is_active !== false ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => onEdit(user)}
                    className="text-primary-600 hover:text-primary-900"
                    title="Edit User"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(user.id, user.username)}
                    className="text-error-600 hover:text-error-900"
                    title="Delete User"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {usersArray.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or add your first user
          </p>
        </div>
      )}
    </div>
  );
};

export default UserTable;