import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X, Plus, Calendar, DollarSign, Package, User, FileText } from 'lucide-react';

const PurchaseHistoryModal = ({ itemId, onClose, onSuccess }) => {
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    supplier_id: '',
    quantity: 0,
    unit_price: 0,
    notes: ''
  });

  useEffect(() => {
    if (itemId) {
      fetchPurchaseHistory();
      fetchSuppliers();
    }
  }, [itemId]);

  const fetchPurchaseHistory = async () => {
    try {
      const response = await axios.get(`/api/inventory/${itemId}/purchases`);
      setPurchaseHistory(response.data);
    } catch (error) {
      toast.error('Error fetching purchase history');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`/api/inventory/${itemId}/purchase`, formData);
      toast.success('Purchase recorded successfully');
      
      // Reset form but keep modal and add form open
      setFormData({ supplier_id: '', quantity: 0, unit_price: 0, notes: '' });
      
      // Refresh data
      fetchPurchaseHistory();
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record purchase');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Purchase History</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`btn-primary flex items-center ${showAddForm ? 'bg-gray-500 hover:bg-gray-600' : ''}`}
            >
              <Plus className="h-4 w-4 mr-2" />
              {showAddForm ? 'Hide Form' : 'Add Purchase'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {showAddForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-blue-900 mb-4">Record New Purchase</h3>
              <form onSubmit={handleAddPurchase} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      required
                      min="1"
                      className="form-input"
                      value={formData.quantity}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price *
                    </label>
                    <input
                      type="number"
                      name="unit_price"
                      required
                      min="0"
                      step="0.01"
                      className="form-input"
                      value={formData.unit_price}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Amount
                    </label>
                    <input
                      type="text"
                      className="form-input bg-gray-50"
                      value={`$${(formData.quantity * formData.unit_price).toFixed(2)}`}
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows="3"
                    className="form-input"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional notes about this purchase"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Record Purchase
                  </button>
                </div>
              </form>
            </div>
          )}

          {purchaseHistory.length > 0 ? (
            <div className="space-y-4">
              {purchaseHistory.map((purchase) => (
                <div key={purchase.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(purchase.purchase_date).toLocaleDateString()}
                        </div>
                        {purchase.supplier_name && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Package className="h-4 w-4 mr-1" />
                            {purchase.supplier_name}
                          </div>
                        )}
                        {purchase.created_by_name && (
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-4 w-4 mr-1" />
                            {purchase.created_by_name}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Quantity</div>
                          <div className="text-lg font-semibold text-gray-900">{purchase.quantity}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Unit Price</div>
                          <div className="text-lg font-semibold text-gray-900">${purchase.unit_price}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Amount</div>
                          <div className="text-lg font-semibold text-primary-600">${purchase.total_amount}</div>
                        </div>
                      </div>

                      {purchase.notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-start">
                            <FileText className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <div>
                              <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">Notes</div>
                              <div className="text-sm text-blue-800">{purchase.notes}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No purchase history</h3>
              <p className="mt-1 text-sm text-gray-500">
                No purchases have been recorded for this item yet.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 btn-primary"
              >
                Record First Purchase
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseHistoryModal;