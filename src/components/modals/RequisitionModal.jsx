import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import RequisitionForm from './RequisitionModal/RequisitionForm';
import ItemsSection from './RequisitionModal/ItemsSection';

const RequisitionModal = ({ requisition, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    priority: 'medium',
    justification: '',
    required_date: '',
    workflow_id: 1
  });
  const [items, setItems] = useState([{
    inventory_id: '',
    item_name: '',
    item_description: '',
    quantity_requested: 1,
    unit_id: '',
    estimated_unit_cost: 0,
    notes: '',
    current_stock: 0,
    available_stock: 0,
    needs_purchase: false
  }]);
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [units, setUnits] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    console.log('🔄 RequisitionModal mounted, fetching data...');
    fetchDropdownData();
    
    if (requisition) {
      setFormData({
        title: requisition.title,
        description: requisition.description || '',
        department: requisition.department || '',
        priority: requisition.priority,
        justification: requisition.justification || '',
        required_date: requisition.required_date ? requisition.required_date.split('T')[0] : '',
        workflow_id: requisition.workflow_id || 1
      });
      
      // Fetch requisition items if editing
      fetchRequisitionItems();
    }
  }, [requisition]);

  const fetchDropdownData = async () => {
    try {
      console.log('📡 Fetching dropdown data...');
      const [inventoryRes, unitsRes, workflowsRes, departmentsRes] = await Promise.all([
        axios.get('/api/inventory').catch(() => ({ data: [] })),
        axios.get('/api/units').catch(() => ({ data: [] })),
        axios.get('/api/workflows').catch(() => ({ data: [] })),
        axios.get('/api/departments').catch(() => ({ data: [] }))
      ]);

      console.log('📦 Inventory data received:', inventoryRes.data.length, 'items');
      console.log('🏢 Departments data received:', departmentsRes.data.length, 'departments');
      
      // Log first few inventory items to check structure
      if (inventoryRes.data.length > 0) {
        console.log('📋 Sample inventory item:', inventoryRes.data[0]);
      }

      // Ensure all responses are arrays before setting state
      setInventory(Array.isArray(inventoryRes.data) ? inventoryRes.data : []);
      setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : []);
      setDepartments(Array.isArray(departmentsRes.data) ? departmentsRes.data : []);
      
      // Use workflows from API or fallback to static ones
      if (workflowsRes.data && Array.isArray(workflowsRes.data) && workflowsRes.data.length > 0) {
        setWorkflows(workflowsRes.data);
      } else {
        // Fallback to static workflows if API fails
        setWorkflows([
          { id: 1, name: 'Standard Approval' },
          { id: 2, name: 'High Value Approval' },
          { id: 3, name: 'Emergency Approval' }
        ]);
      }
    } catch (error) {
      console.error('❌ Error fetching dropdown data:', error);
      // Set fallback data
      setInventory([]);
      setUnits([]);
      setDepartments([]);
      setWorkflows([
        { id: 1, name: 'Standard Approval' },
        { id: 2, name: 'High Value Approval' },
        { id: 3, name: 'Emergency Approval' }
      ]);
    }
  };

  const fetchRequisitionItems = async () => {
    if (!requisition) return;
    
    try {
      const response = await axios.get(`/api/requisitions/${requisition.id}`);
      if (response.data.items && Array.isArray(response.data.items) && response.data.items.length > 0) {
        setItems(response.data.items.map(item => ({
          id: item.id,
          inventory_id: item.inventory_id || '',
          item_name: item.item_name,
          item_description: item.item_description || '',
          quantity_requested: item.quantity_requested,
          unit_id: item.unit_id || '',
          estimated_unit_cost: item.estimated_unit_cost || 0,
          notes: item.notes || '',
          current_stock: 0,
          available_stock: 0,
          needs_purchase: false
        })));
      } else {
        // Ensure items is always an array
        setItems([{
          inventory_id: '',
          item_name: '',
          item_description: '',
          quantity_requested: 1,
          unit_id: '',
          estimated_unit_cost: 0,
          notes: '',
          current_stock: 0,
          available_stock: 0,
          needs_purchase: false
        }]);
      }
    } catch (error) {
      console.error('Error fetching requisition items:', error);
      // Ensure items is always an array even on error
      setItems([{
        inventory_id: '',
        item_name: '',
        item_description: '',
        quantity_requested: 1,
        unit_id: '',
        estimated_unit_cost: 0,
        notes: '',
        current_stock: 0,
        available_stock: 0,
        needs_purchase: false
      }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Ensure items is always an array
    const itemsArray = Array.isArray(items) ? items : [];

    if (itemsArray.length === 0) {
      toast.error('At least one item is required');
      setLoading(false);
      return;
    }

    // Validate items
    for (let i = 0; i < itemsArray.length; i++) {
      const item = itemsArray[i];
      if (!item.item_name.trim()) {
        toast.error(`Item ${i + 1}: Name is required`);
        setLoading(false);
        return;
      }
      if (item.quantity_requested <= 0) {
        toast.error(`Item ${i + 1}: Quantity must be greater than 0`);
        setLoading(false);
        return;
      }
    }

    try {
      const submitData = {
        ...formData,
        items: itemsArray.map(item => ({
          ...item,
          quantity_requested: parseInt(item.quantity_requested),
          estimated_unit_cost: parseFloat(item.estimated_unit_cost) || 0
        }))
      };

      if (requisition) {
        await axios.put(`/api/requisitions/${requisition.id}`, submitData);
        toast.success('Requisition updated successfully');
      } else {
        await axios.post('/api/requisitions', submitData);
        toast.success('Requisition created successfully');
        
        // Reset form for new entries but keep modal open
        setFormData({
          title: '',
          description: '',
          department: '',
          priority: 'medium',
          justification: '',
          required_date: '',
          workflow_id: 1
        });
        setItems([{
          inventory_id: '',
          item_name: '',
          item_description: '',
          quantity_requested: 1,
          unit_id: '',
          estimated_unit_cost: 0,
          notes: '',
          current_stock: 0,
          available_stock: 0,
          needs_purchase: false
        }]);
      }
      
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

  const handleItemChange = (index, field, value) => {
    // Ensure items is always an array
    const itemsArray = Array.isArray(items) ? items : [];
    const newItems = [...itemsArray];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill item details when inventory item is selected
    if (field === 'inventory_id' && value) {
      const inventoryArray = Array.isArray(inventory) ? inventory : [];
      const inventoryItem = inventoryArray.find(item => item.id == value);
      if (inventoryItem) {
        console.log('🎯 Selected inventory item:', inventoryItem);
        newItems[index].item_name = inventoryItem.name;
        newItems[index].item_description = inventoryItem.description || '';
        newItems[index].unit_id = inventoryItem.base_unit_id;
        newItems[index].estimated_unit_cost = inventoryItem.unit_price || 0;
        newItems[index].current_stock = inventoryItem.quantity || 0;
        newItems[index].available_stock = inventoryItem.quantity || 0;
        
        // Check if purchase is needed
        const requestedQty = newItems[index].quantity_requested || 0;
        newItems[index].needs_purchase = requestedQty > inventoryItem.quantity;
        
        console.log('📊 Stock info updated:', {
          stock: inventoryItem.quantity,
          requested: requestedQty,
          needsPurchase: newItems[index].needs_purchase
        });
      }
    }
    
    // Update needs_purchase when quantity changes
    if (field === 'quantity_requested') {
      const requestedQty = parseInt(value) || 0;
      newItems[index].needs_purchase = requestedQty > newItems[index].current_stock;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    const itemsArray = Array.isArray(items) ? items : [];
    setItems([...itemsArray, {
      inventory_id: '',
      item_name: '',
      item_description: '',
      quantity_requested: 1,
      unit_id: '',
      estimated_unit_cost: 0,
      notes: '',
      current_stock: 0,
      available_stock: 0,
      needs_purchase: false
    }]);
  };

  const removeItem = (index) => {
    const itemsArray = Array.isArray(items) ? items : [];
    if (itemsArray.length > 1) {
      setItems(itemsArray.filter((_, i) => i !== index));
    }
  };

  const calculateTotalCost = () => {
    const itemsArray = Array.isArray(items) ? items : [];
    return itemsArray.reduce((total, item) => 
      total + (item.quantity_requested * (item.estimated_unit_cost || 0)), 0
    );
  };

  const getStockStatus = (item) => {
    if (!item.inventory_id) return null;
    
    const requestedQty = item.quantity_requested || 0;
    const currentStock = item.current_stock || 0;
    
    if (currentStock === 0) {
      return {
        type: 'out-of-stock',
        message: 'Out of Stock - Will create purchase order',
        color: 'text-red-600 bg-red-50 border-red-200'
      };
    } else if (requestedQty > currentStock) {
      return {
        type: 'partial-stock',
        message: `Partial Stock: ${currentStock} available, ${requestedQty - currentStock} needs purchase`,
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
      };
    } else {
      return {
        type: 'in-stock',
        message: `In Stock: ${currentStock} available`,
        color: 'text-green-600 bg-green-50 border-green-200'
      };
    }
  };

  const getStockBadgeColor = (stock) => {
    if (stock === 0) return 'bg-red-100 text-red-800';
    if (stock <= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  // ENHANCED: This function formats the inventory dropdown options with stock info
  const formatInventoryOption = (invItem) => {
    const stock = invItem.quantity || 0;
    let stockText = `Stock: ${stock}`;
    
    if (stock === 0) {
      stockText += ' [OUT OF STOCK]';
    } else if (stock <= 10) {
      stockText += ' [LOW STOCK]';
    }
    
    return `${invItem.name} (${invItem.sku}) - ${stockText}`;
  };

  // Ensure all arrays are properly initialized with additional safety checks
  const inventoryArray = Array.isArray(inventory) ? inventory : [];
  const unitsArray = Array.isArray(units) ? units : [];
  const departmentsArray = Array.isArray(departments) ? departments : [];
  const workflowsArray = Array.isArray(workflows) ? workflows : [];
  const itemsArray = Array.isArray(items) ? items : [];

  console.log('🔍 Current inventory count:', inventoryArray.length);
  console.log('🔍 Current departments count:', departmentsArray.length);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {requisition ? 'Edit Requisition' : 'Create New Requisition'}
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
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <RequisitionForm 
              formData={formData}
              handleChange={handleChange}
              departments={departmentsArray}
              workflows={workflowsArray}
            />

            <ItemsSection
              items={itemsArray}
              handleItemChange={handleItemChange}
              addItem={addItem}
              removeItem={removeItem}
              inventory={inventoryArray}
              units={unitsArray}
              formatInventoryOption={formatInventoryOption}
              getStockBadgeColor={getStockBadgeColor}
              getStockStatus={getStockStatus}
              calculateTotalCost={calculateTotalCost}
            />

            {/* Debug Info */}
            <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
              <strong>Debug Info:</strong> Inventory: {inventoryArray.length} items | Departments: {departmentsArray.length} | Units: {unitsArray.length}
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
            {loading ? 'Saving...' : (requisition ? 'Update Requisition' : 'Create Requisition')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequisitionModal;