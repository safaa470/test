import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X, Calculator, AlertTriangle, Info } from 'lucide-react';

const InventoryModal = ({ item, categories, units, locations, suppliers, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category_id: '',
    base_unit_id: '',
    issue_unit_id: '',
    location_id: '',
    supplier_id: '',
    quantity: 0,
    min_quantity: 0,
    max_quantity: 0,
    unit_price: 0
  });
  const [loading, setLoading] = useState(false);
  const [compatibleUnits, setCompatibleUnits] = useState([]);
  const [conversionPreview, setConversionPreview] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        sku: item.sku,
        description: item.description || '',
        category_id: item.category_id || '',
        base_unit_id: item.base_unit_id || '',
        issue_unit_id: item.issue_unit_id || '',
        location_id: item.location_id || '',
        supplier_id: item.supplier_id || '',
        quantity: item.quantity,
        min_quantity: item.min_quantity,
        max_quantity: item.max_quantity,
        unit_price: item.unit_price
      });
    }
  }, [item]);

  useEffect(() => {
    if (formData.base_unit_id) {
      fetchCompatibleUnits(formData.base_unit_id);
    }
  }, [formData.base_unit_id]);

  useEffect(() => {
    if (formData.base_unit_id && formData.issue_unit_id && formData.quantity > 0) {
      calculateConversion();
    } else {
      setConversionPreview(null);
    }
  }, [formData.base_unit_id, formData.issue_unit_id, formData.quantity]);

  const fetchCompatibleUnits = async (unitId) => {
    try {
      const response = await axios.get(`/api/units/compatible/${unitId}`);
      setCompatibleUnits(response.data);
    } catch (error) {
      console.error('Error fetching compatible units:', error);
      setCompatibleUnits([]);
    }
  };

  const calculateConversion = async () => {
    if (formData.base_unit_id === formData.issue_unit_id) {
      setConversionPreview({
        baseQuantity: formData.quantity,
        issueQuantity: formData.quantity,
        baseUnit: units.find(u => u.id == formData.base_unit_id)?.abbreviation || '',
        issueUnit: units.find(u => u.id == formData.issue_unit_id)?.abbreviation || ''
      });
      return;
    }

    try {
      const response = await axios.get(
        `/api/units/convert/${formData.base_unit_id}/${formData.issue_unit_id}/${formData.quantity}`
      );
      
      setConversionPreview({
        baseQuantity: formData.quantity,
        issueQuantity: response.data.convertedQuantity,
        baseUnit: units.find(u => u.id == formData.base_unit_id)?.abbreviation || '',
        issueUnit: units.find(u => u.id == formData.issue_unit_id)?.abbreviation || ''
      });
    } catch (error) {
      console.error('Error calculating conversion:', error);
      setConversionPreview(null);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Item name is required';
    }

    if (!formData.sku.trim()) {
      errors.sku = 'SKU is required';
    }

    if (formData.quantity < 0) {
      errors.quantity = 'Quantity cannot be negative';
    }

    if (formData.min_quantity < 0) {
      errors.min_quantity = 'Minimum quantity cannot be negative';
    }

    if (formData.max_quantity < 0) {
      errors.max_quantity = 'Maximum quantity cannot be negative';
    }

    if (formData.min_quantity > formData.max_quantity && formData.max_quantity > 0) {
      errors.max_quantity = 'Maximum quantity must be greater than minimum quantity';
    }

    if (formData.unit_price < 0) {
      errors.unit_price = 'Unit price cannot be negative';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setLoading(true);

    try {
      if (item) {
        await axios.put(`/api/inventory/${item.id}`, formData);
        toast.success('Item updated successfully');
      } else {
        await axios.post('/api/inventory', formData);
        toast.success('Item added successfully');
        
        // Reset form for new entries but keep modal open
        setFormData({
          name: '',
          sku: '',
          description: '',
          category_id: '',
          base_unit_id: '',
          issue_unit_id: '',
          location_id: '',
          supplier_id: '',
          quantity: 0,
          min_quantity: 0,
          max_quantity: 0,
          unit_price: 0
        });
        setConversionPreview(null);
        setValidationErrors({});
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

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Organize categories hierarchically
  const organizeCategories = () => {
    const mainCategories = categories.filter(cat => !cat.parent_id);
    const subCategories = categories.filter(cat => cat.parent_id);
    
    return mainCategories.map(mainCat => ({
      ...mainCat,
      subcategories: subCategories.filter(subCat => subCat.parent_id === mainCat.id)
    }));
  };

  const organizedCategories = organizeCategories();

  const getFieldError = (fieldName) => {
    return validationErrors[fieldName] ? 'border-red-300' : '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {item ? 'Edit Item' : 'Add New Item'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className={`form-input ${getFieldError('name')}`}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter item name"
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  name="sku"
                  required
                  className={`form-input ${getFieldError('sku')}`}
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="Enter unique SKU"
                />
                {validationErrors.sku && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.sku}</p>
                )}
              </div>
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
                placeholder="Enter item description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category_id"
                  className="form-select"
                  value={formData.category_id}
                  onChange={handleChange}
                >
                  <option value="">Select Category</option>
                  {organizedCategories.map(mainCategory => (
                    <React.Fragment key={mainCategory.id}>
                      {/* Main Category */}
                      <option value={mainCategory.id} className="font-semibold">
                        {mainCategory.name}
                      </option>
                      {/* Subcategories */}
                      {mainCategory.subcategories.map(subCategory => (
                        <option key={subCategory.id} value={subCategory.id} className="pl-4">
                          ├─ {subCategory.name}
                        </option>
                      ))}
                    </React.Fragment>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Main categories are shown in bold, subcategories are indented
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Unit (Storage) *
                </label>
                <select
                  name="base_unit_id"
                  required
                  className="form-select"
                  value={formData.base_unit_id}
                  onChange={handleChange}
                >
                  <option value="">Select Base Unit</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.abbreviation}) - {unit.unit_type}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Unit used for receiving and storing inventory
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Unit (Distribution)
                </label>
                <select
                  name="issue_unit_id"
                  className="form-select"
                  value={formData.issue_unit_id}
                  onChange={handleChange}
                >
                  <option value="">Same as Base Unit</option>
                  {compatibleUnits.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.abbreviation})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Unit used for issuing/distributing inventory (e.g., receive in KG, issue in grams)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  name="location_id"
                  className="form-select"
                  value={formData.location_id}
                  onChange={handleChange}
                >
                  <option value="">Select Location</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <select
                name="supplier_id"
                className="form-select"
                value={formData.supplier_id}
                onChange={handleChange}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Conversion Preview */}
            {conversionPreview && formData.base_unit_id !== formData.issue_unit_id && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Calculator className="h-4 w-4 text-blue-500 mr-2" />
                  <h4 className="text-sm font-medium text-blue-900">Unit Conversion Preview</h4>
                </div>
                <div className="text-sm text-blue-800">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Storage:</span> {conversionPreview.baseQuantity} {conversionPreview.baseUnit}
                    </div>
                    <div>
                      <span className="font-medium">Issue:</span> {conversionPreview.issueQuantity} {conversionPreview.issueUnit}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-600">
                    Example: You store {conversionPreview.baseQuantity} {conversionPreview.baseUnit}, 
                    but can issue {conversionPreview.issueQuantity} {conversionPreview.issueUnit}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  min="0"
                  step="0.01"
                  className={`form-input ${getFieldError('quantity')}`}
                  value={formData.quantity}
                  onChange={handleChange}
                />
                {validationErrors.quantity && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.quantity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Quantity
                </label>
                <input
                  type="number"
                  name="min_quantity"
                  min="0"
                  step="0.01"
                  className={`form-input ${getFieldError('min_quantity')}`}
                  value={formData.min_quantity}
                  onChange={handleChange}
                />
                {validationErrors.min_quantity && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.min_quantity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Quantity
                </label>
                <input
                  type="number"
                  name="max_quantity"
                  min="0"
                  step="0.01"
                  className={`form-input ${getFieldError('max_quantity')}`}
                  value={formData.max_quantity}
                  onChange={handleChange}
                />
                {validationErrors.max_quantity && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.max_quantity}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price ($)
              </label>
              <input
                type="number"
                name="unit_price"
                min="0"
                step="0.01"
                className={`form-input ${getFieldError('unit_price')}`}
                value={formData.unit_price}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                Price per base unit
              </p>
              {validationErrors.unit_price && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.unit_price}</p>
              )}
            </div>

            {/* Total Value Preview */}
            {formData.quantity > 0 && formData.unit_price > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Info className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-900">
                    Total Value: ${(formData.quantity * formData.unit_price).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Stock Level Warning */}
            {formData.quantity > 0 && formData.min_quantity > 0 && formData.quantity <= formData.min_quantity && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium text-yellow-900">
                    Warning: Current quantity is at or below minimum stock level
                  </span>
                </div>
              </div>
            )}
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
            {loading ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;