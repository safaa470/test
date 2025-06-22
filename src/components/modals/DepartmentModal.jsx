import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X, Building, User, DollarSign } from 'lucide-react';

const DepartmentModal = ({ department, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager_name: '',
    budget: 0,
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        description: department.description || '',
        manager_name: department.manager_name || '',
        budget: department.budget || 0,
        is_active: department.is_active !== false
      });
    }
  }, [department]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (department) {
        await axios.put(`/api/departments/${department.id}`, formData);
        toast.success('Department updated successfully');
      } else {
        await axios.post('/api/departments', formData);
        toast.success('Department created successfully');
        
        // Reset form for new entries but keep modal open
        setFormData({
          name: '',
          description: '',
          manager_name: '',
          budget: 0,
          is_active: true
        });
      }
      
      // Call onSuccess to refresh data but don't close modal
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {department ? 'Edit Department' : 'Add New Department'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building className="h-4 w-4 inline mr-1" />
                Department Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Information Technology, Human Resources"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows="3"
                className="form-input"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the department's role and responsibilities"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Department Manager
              </label>
              <input
                type="text"
                name="manager_name"
                className="form-input"
                value={formData.manager_name}
                onChange={handleChange}
                placeholder="Enter manager's name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Annual Budget
              </label>
              <input
                type="number"
                name="budget"
                min="0"
                step="0.01"
                className="form-input"
                value={formData.budget}
                onChange={handleChange}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Annual budget allocation for this department
              </p>
            </div>

            {department && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active Department
                </label>
                <p className="ml-2 text-xs text-gray-500">
                  Inactive departments won't appear in dropdowns
                </p>
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Department Information:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Departments are used to organize requisitions and users</li>
                <li>• Budget tracking helps monitor spending by department</li>
                <li>• Manager information is for reference only</li>
                <li>• Inactive departments are hidden from new requisitions</li>
              </ul>
            </div>
          </form>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
            onClick={handleSubmit}
          >
            {loading ? 'Saving...' : (department ? 'Update Department' : 'Create Department')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentModal;