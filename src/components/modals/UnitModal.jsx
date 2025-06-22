import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

const UnitModal = ({ item, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    unit_type: 'general',
    base_unit_id: '',
    conversion_factor: 1
  });
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        abbreviation: item.abbreviation,
        unit_type: item.unit_type || 'general',
        base_unit_id: item.base_unit_id || '',
        conversion_factor: item.conversion_factor || 1
      });
    }
  }, [item]);

  const fetchUnits = async () => {
    try {
      const response = await axios.get('/api/units');
      setUnits(response.data);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (item) {
        await axios.put(`/api/units/${item.id}`, formData);
        toast.success('Unit updated successfully');
      } else {
        await axios.post('/api/units', formData);
        toast.success('Unit created successfully');
      }
      
      // Reset form for new entries but keep modal open
      if (!item) {
        setFormData({
          name: '',
          abbreviation: '',
          unit_type: 'general',
          base_unit_id: '',
          conversion_factor: 1
        });
      }
      
      // Refresh units list and call onSuccess to refresh parent data
      await fetchUnits();
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

  // Get base units (units without base_unit_id) for the same type
  const getBaseUnits = () => {
    return units.filter(unit => 
      !unit.base_unit_id && 
      (unit.unit_type === formData.unit_type || formData.unit_type === 'general') &&
      unit.id !== item?.id // Exclude current unit to prevent circular reference
    );
  };

  const unitTypes = [
    { value: 'general', label: 'General' },
    { value: 'weight', label: 'Weight' },
    { value: 'volume', label: 'Volume' },
    { value: 'length', label: 'Length' },
    { value: 'count', label: 'Count' },
    { value: 'packaging', label: 'Packaging' },
    { value: 'area', label: 'Area' },
    { value: 'time', label: 'Time' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {item ? 'Edit Unit' : 'Add New Unit'}
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
                Unit Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Pieces, Kilograms, Liters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Abbreviation *
              </label>
              <input
                type="text"
                name="abbreviation"
                required
                className="form-input"
                value={formData.abbreviation}
                onChange={handleChange}
                placeholder="e.g., pcs, kg, L"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Type
              </label>
              <select
                name="unit_type"
                className="form-select"
                value={formData.unit_type}
                onChange={handleChange}
              >
                {unitTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Group units by type for better organization and conversion
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Unit (for conversion)
              </label>
              <select
                name="base_unit_id"
                className="form-select"
                value={formData.base_unit_id}
                onChange={handleChange}
              >
                <option value="">None (This is a base unit)</option>
                {getBaseUnits().map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.abbreviation})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select a base unit if this unit can be converted to another unit
              </p>
            </div>

            {formData.base_unit_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conversion Factor *
                </label>
                <input
                  type="number"
                  name="conversion_factor"
                  step="0.000001"
                  min="0"
                  required
                  className="form-input"
                  value={formData.conversion_factor}
                  onChange={handleChange}
                  placeholder="e.g., 0.001 (for grams to kg)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How many base units equal 1 of this unit? (e.g., 1 gram = 0.001 kg)
                </p>
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Conversion Examples:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• 1 gram = 0.001 kg (conversion factor: 0.001)</li>
                <li>• 1 pound = 0.453592 kg (conversion factor: 0.453592)</li>
                <li>• 1 milliliter = 0.001 L (conversion factor: 0.001)</li>
                <li>• 1 dozen = 12 pieces (conversion factor: 12)</li>
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
            {loading ? 'Saving...' : (item ? 'Update Unit' : 'Create Unit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitModal;