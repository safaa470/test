import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  X, 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  DollarSign, 
  ToggleLeft, 
  ToggleRight,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';
import DepartmentModal from './DepartmentModal';
import ConfirmationModal from './ConfirmationModal';
import { useConfirmation } from '../../hooks/useConfirmation';

const DepartmentManagementModal = ({ onClose, onSuccess }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentStats, setDepartmentStats] = useState(null);
  const { confirmationState, showConfirmation, hideConfirmation } = useConfirmation();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/departments/all');
      // Ensure response.data is an array before setting state
      const departmentsData = Array.isArray(response.data) ? response.data : [];
      setDepartments(departmentsData);
    } catch (error) {
      toast.error('Error fetching departments');
      // Set empty array on error to prevent map errors
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentStats = async (departmentId) => {
    try {
      const response = await axios.get(`/api/departments/${departmentId}/stats`);
      setDepartmentStats(response.data);
    } catch (error) {
      console.error('Error fetching department stats:', error);
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setShowDepartmentModal(true);
  };

  const handleAdd = () => {
    setEditingDepartment(null);
    setShowDepartmentModal(true);
  };

  const handleToggleStatus = async (department) => {
    const action = department.is_active ? 'deactivate' : 'activate';
    const confirmed = await showConfirmation({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Department`,
      message: `Are you sure you want to ${action} "${department.name}"? ${
        department.is_active 
          ? 'This will hide it from requisition dropdowns.' 
          : 'This will make it available in requisition dropdowns again.'
      }`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel',
      type: department.is_active ? 'warning' : 'success',
      icon: department.is_active ? ToggleLeft : ToggleRight
    });

    if (confirmed) {
      try {
        await axios.put(`/api/departments/${department.id}/status`, {
          is_active: !department.is_active
        });
        toast.success(`Department ${!department.is_active ? 'activated' : 'deactivated'} successfully`);
        fetchDepartments();
        onSuccess();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Error updating department status');
      }
    }
  };

  const handleDelete = async (department) => {
    const confirmed = await showConfirmation({
      title: 'Delete Department',
      message: `Are you sure you want to delete "${department.name}"? This action cannot be undone. If the department is used in requisitions or assigned to users, deletion will fail.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: Trash2
    });

    if (confirmed) {
      try {
        await axios.delete(`/api/departments/${department.id}`);
        toast.success('Department deleted successfully');
        fetchDepartments();
        onSuccess();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Error deleting department');
      }
    }
  };

  const handleViewStats = (department) => {
    setSelectedDepartment(department);
    fetchDepartmentStats(department.id);
  };

  const handleDepartmentModalSuccess = () => {
    setShowDepartmentModal(false);
    setEditingDepartment(null);
    fetchDepartments();
    onSuccess();
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <Building className="h-6 w-6 text-primary-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Department Management</h2>
                <p className="text-sm text-gray-600">Manage organizational departments</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleAdd}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              {/* Departments List */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  {departments.map((department) => (
                    <div key={department.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">{department.name}</h3>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(department.is_active)}`}>
                              {department.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          {department.description && (
                            <p className="text-sm text-gray-600 mb-3">{department.description}</p>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <User className="h-4 w-4 mr-2" />
                              <div>
                                <div className="font-medium">Manager</div>
                                <div>{department.manager_name || 'Not assigned'}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-600">
                              <DollarSign className="h-4 w-4 mr-2" />
                              <div>
                                <div className="font-medium">Budget</div>
                                <div>${department.budget ? department.budget.toLocaleString() : '0'}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-600">
                              <TrendingUp className="h-4 w-4 mr-2" />
                              <div>
                                <div className="font-medium">Created</div>
                                <div>{new Date(department.created_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleViewStats(department)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Statistics"
                          >
                            <TrendingUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(department)}
                            className={`${department.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                            title={department.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {department.is_active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(department)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit Department"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(department)}
                            className="text-error-600 hover:text-error-900"
                            title="Delete Department"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {departments.length === 0 && (
                    <div className="text-center py-12">
                      <Building className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No departments</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by creating your first department
                      </p>
                      <button
                        onClick={handleAdd}
                        className="mt-4 btn-primary"
                      >
                        Add Department
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Department Statistics Panel */}
              <div className="lg:col-span-1">
                {selectedDepartment && departmentStats ? (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {selectedDepartment.name} Statistics
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-blue-500 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-500">Users</div>
                            <div className="text-2xl font-bold text-gray-900">
                              {departmentStats.stats.user_count}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-green-500 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-500">Total Requisitions</div>
                            <div className="text-2xl font-bold text-gray-900">
                              {departmentStats.stats.total_requisitions}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-purple-500 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-500">Approved Amount</div>
                            <div className="text-lg font-bold text-gray-900">
                              ${(departmentStats.stats.total_approved_amount || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center">
                          <TrendingUp className="h-5 w-5 text-orange-500 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-500">Budget Utilization</div>
                            <div className="text-lg font-bold text-gray-900">
                              {departmentStats.stats.budget_utilization}%
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white rounded-lg p-3">
                          <div className="text-xs font-medium text-gray-500">Approved</div>
                          <div className="text-lg font-bold text-green-600">
                            {departmentStats.stats.approved_requisitions}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <div className="text-xs font-medium text-gray-500">Pending</div>
                          <div className="text-lg font-bold text-yellow-600">
                            {departmentStats.stats.pending_requisitions}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Department Statistics</h3>
                    <p className="text-sm text-gray-500">
                      Click on a department's statistics icon to view detailed information
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={hideConfirmation}
        onConfirm={confirmationState.onConfirm}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        type={confirmationState.type}
        icon={confirmationState.icon}
      />

      {/* Department Modal */}
      {showDepartmentModal && (
        <DepartmentModal
          department={editingDepartment}
          onClose={() => setShowDepartmentModal(false)}
          onSuccess={handleDepartmentModalSuccess}
        />
      )}
    </>
  );
};

export default DepartmentManagementModal;