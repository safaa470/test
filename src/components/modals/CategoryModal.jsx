import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

const CategoryModal = ({ categories, item, isSubcategory = false, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    parent_id: isSubcategory ? '' : null,
    description: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        parent_id: item.parent_id || '',
        description: item.description || ''
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (item) {
        await axios.put(`/api/categories/${item.id}`, formData);
        toast.success('Category updated successfully');
      } else {
        await axios.post('/api/categories', formData);
        toast.success(`${isSubcategory ? 'Subcategory' : 'Category'} created successfully`);
      }
      
      // Reset form for new entries but keep modal open
      if (!item) {
        setFormData({
          name: '',
          parent_id: isSubcategory ? '' : null,
          description: ''
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get parent categories (categories without parent_id)
  const parentCategories = categories.filter(cat => !cat.parent_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {item ? 'Edit Category' : `Add New ${isSubcategory ? 'Subcategory' : 'Category'}`}
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
                {isSubcategory ? 'Subcategory' : 'Category'} Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                placeholder={`Enter ${isSubcategory ? 'subcategory' : 'category'} name`}
              />
            </div>

            {isSubcategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category *
                </label>
                <select
                  name="parent_id"
                  required
                  className="form-select"
                  value={formData.parent_id}
                  onChange={handleChange}
                >
                  <option value="">Select Parent Category</option>
                  {parentCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the main category this subcategory belongs to
                </p>
              </div>
            )}

            {!isSubcategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  name="parent_id"
                  className="form-select"
                  value={formData.parent_id || ''}
                  onChange={handleChange}
                >
                  <option value="">None (Main Category)</option>
                  {parentCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to create a main category, or select a parent to create a subcategory
                </p>
              </div>
            )}

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
                placeholder={`Enter ${isSubcategory ? 'subcategory' : 'category'} description`}
              />
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
            {loading ? 'Saving...' : (item ? 'Update Category' : `Create ${isSubcategory ? 'Subcategory' : 'Category'}`)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;