import React from 'react';
import { Plus, Trash2, ArrowRightLeft, CheckCircle, AlertTriangle, AlertCircle, DollarSign } from 'lucide-react';

const ItemsSection = ({ 
  items, 
  handleItemChange, 
  addItem, 
  removeItem, 
  inventory, 
  units, 
  formatInventoryOption,
  getStockBadgeColor,
  getStockStatus,
  calculateTotalCost 
}) => {
  // Ensure all arrays are properly initialized
  const itemsArray = Array.isArray(items) ? items : [];
  const inventoryArray = Array.isArray(inventory) ? inventory : [];
  const unitsArray = Array.isArray(units) ? units : [];

  return (
    <div className="bg-blue-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Requested Items</h3>
        <button
          type="button"
          onClick={addItem}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </button>
      </div>

      <div className="space-y-4">
        {itemsArray.map((item, index) => {
          const stockStatus = getStockStatus(item);
          
          return (
            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Item {index + 1}</h4>
                {itemsArray.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inventory Item
                  </label>
                  <select
                    className="form-select"
                    value={item.inventory_id}
                    onChange={(e) => handleItemChange(index, 'inventory_id', e.target.value)}
                  >
                    <option value="">Select from inventory (optional)</option>
                    {inventoryArray.map(invItem => (
                      <option key={invItem.id} value={invItem.id}>
                        {formatInventoryOption(invItem)}
                      </option>
                    ))}
                  </select>
                  {item.inventory_id && (
                    <div className="mt-2">
                      {(() => {
                        const selectedItem = inventoryArray.find(inv => inv.id == item.inventory_id);
                        if (selectedItem) {
                          const stock = selectedItem.quantity || 0;
                          return (
                            <div className="space-y-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockBadgeColor(stock)}`}>
                                Current Stock: {stock} {selectedItem.base_unit_abbr || 'units'}
                              </span>
                              {stock === 0 && (
                                <div className="text-xs text-red-600 font-medium">
                                  ⚠️ Out of Stock - Will create purchase order
                                </div>
                              )}
                              {stock > 0 && stock <= 10 && (
                                <div className="text-xs text-yellow-600 font-medium">
                                  ⚠️ Low Stock Warning
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={item.item_name}
                    onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                    placeholder="Enter item name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="form-input"
                    value={item.quantity_requested}
                    onChange={(e) => handleItemChange(index, 'quantity_requested', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    className="form-select"
                    value={item.unit_id}
                    onChange={(e) => handleItemChange(index, 'unit_id', e.target.value)}
                  >
                    <option value="">Select unit</option>
                    {unitsArray.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} ({unit.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Unit Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={item.estimated_unit_cost}
                    onChange={(e) => handleItemChange(index, 'estimated_unit_cost', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Cost
                  </label>
                  <input
                    type="text"
                    className="form-input bg-gray-50"
                    value={`$${(item.quantity_requested * (item.estimated_unit_cost || 0)).toFixed(2)}`}
                    readOnly
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows="2"
                    className="form-input"
                    value={item.item_description}
                    onChange={(e) => handleItemChange(index, 'item_description', e.target.value)}
                    placeholder="Enter item description"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows="2"
                    className="form-input"
                    value={item.notes}
                    onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                    placeholder="Additional notes for this item"
                  />
                </div>
              </div>

              {/* Stock Status Display */}
              {stockStatus && (
                <div className={`mt-3 p-3 rounded-lg border ${stockStatus.color}`}>
                  <div className="flex items-center">
                    {stockStatus.type === 'in-stock' && <CheckCircle className="h-4 w-4 mr-2" />}
                    {stockStatus.type === 'partial-stock' && <AlertTriangle className="h-4 w-4 mr-2" />}
                    {stockStatus.type === 'out-of-stock' && <AlertCircle className="h-4 w-4 mr-2" />}
                    <span className="text-sm font-medium">{stockStatus.message}</span>
                  </div>
                  {item.needs_purchase && (
                    <div className="mt-2 text-xs">
                      <strong>Note:</strong> This item will be flagged for purchase order creation upon approval.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total Cost Summary */}
      <div className="mt-4 p-4 bg-green-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-lg font-medium text-green-900">Total Estimated Cost:</span>
          </div>
          <span className="text-2xl font-bold text-green-600">
            ${calculateTotalCost().toFixed(2)}
          </span>
        </div>
      </div>

      {/* Purchase Order Notice */}
      {itemsArray.some(item => item.needs_purchase) && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-900">Purchase Order Required</h4>
              <p className="text-sm text-yellow-800 mt-1">
                Some items in this requisition require purchase orders due to insufficient stock. 
                These will be automatically flagged for procurement upon approval.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemsSection;