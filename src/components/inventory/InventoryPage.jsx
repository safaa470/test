import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, RefreshCw } from 'lucide-react';
import InventoryStats from './InventoryStats';
import InventoryFilters from './InventoryFilters';
import InventoryTable from './InventoryTable';
import InventoryActions from './InventoryActions';
import InventoryModals from './InventoryModals';
import { useConfirmation } from '../../hooks/useConfirmation';

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [showPurchaseHistoryModal, setShowPurchaseHistoryModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  const { confirmationState, showConfirmation, hideConfirmation } = useConfirmation();

  useEffect(() => {
    console.log('🔄 InventoryPage mounted, fetching data...');
    fetchInventory();
    fetchDropdownData();
  }, []);

  useEffect(() => {
    filterAndSortItems();
  }, [items, searchTerm, categoryFilter, stockFilter, sortField, sortDirection]);

  const fetchInventory = async () => {
    console.log('📡 Fetching inventory from API...');
    try {
      const response = await axios.get('/api/inventory');
      console.log('📊 API Response:', {
        status: response.status,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        length: Array.isArray(response.data) ? response.data.length : 'N/A'
      });
      
      // Ensure response.data is always an array
      const inventoryData = Array.isArray(response.data) ? response.data : [];
      console.log('📦 Setting inventory items:', inventoryData.length, 'items');
      
      // Log first few items for debugging
      if (inventoryData.length > 0) {
        console.log('📋 Sample items:', inventoryData.slice(0, 3).map(item => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity
        })));
      } else {
        console.log('⚠️ No inventory items received from API');
      }
      
      setItems(inventoryData);
    } catch (error) {
      console.error('❌ Error fetching inventory:', error);
      toast.error('Error fetching inventory: ' + (error.response?.data?.error || error.message));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshInventory = async () => {
    setRefreshing(true);
    try {
      await fetchInventory();
      toast.success('Inventory refreshed');
    } catch (error) {
      toast.error('Error refreshing inventory');
    } finally {
      setRefreshing(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      console.log('📡 Fetching dropdown data...');
      const [categoriesRes, unitsRes, locationsRes, suppliersRes] = await Promise.all([
        axios.get('/api/categories').catch(() => ({ data: [] })),
        axios.get('/api/units').catch(() => ({ data: [] })),
        axios.get('/api/locations').catch(() => ({ data: [] })),
        axios.get('/api/suppliers').catch(() => ({ data: [] }))
      ]);

      // Ensure all responses are arrays before setting state
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : []);
      setLocations(Array.isArray(locationsRes.data) ? locationsRes.data : []);
      setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : []);
      
      console.log('📊 Dropdown data loaded:', {
        categories: categoriesRes.data.length,
        units: unitsRes.data.length,
        locations: locationsRes.data.length,
        suppliers: suppliersRes.data.length
      });
    } catch (error) {
      console.error('❌ Error fetching dropdown data:', error);
      toast.error('Error fetching dropdown data');
      // Set fallback empty arrays
      setCategories([]);
      setUnits([]);
      setLocations([]);
      setSuppliers([]);
    }
  };

  const filterAndSortItems = () => {
    // Ensure items is always an array before filtering
    const itemsArray = Array.isArray(items) ? items : [];
    console.log('🔍 Filtering items:', itemsArray.length, 'total items');
    
    let filtered = itemsArray.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category_name && item.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category_id == categoryFilter);
    }

    // Apply stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(item => item.quantity <= item.min_quantity);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(item => item.quantity === 0);
    } else if (stockFilter === 'good') {
      filtered = filtered.filter(item => item.quantity > item.min_quantity);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle numeric fields
      if (['quantity', 'min_quantity', 'max_quantity', 'unit_price', 'total_value'].includes(sortField)) {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
      // Handle string fields
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    console.log('📋 Filtered items:', filtered.length, 'items after filtering');
    setFilteredItems(filtered);
  };

  const handleDelete = async (id, itemName) => {
    const confirmed = await showConfirmation({
      title: 'Delete Inventory Item',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone and will also remove all associated purchase history.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      try {
        await axios.delete(`/api/inventory/${id}`);
        toast.success('Item deleted successfully');
        fetchInventory();
      } catch (error) {
        toast.error('Error deleting item');
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleViewPurchaseHistory = (itemId) => {
    setSelectedItemId(itemId);
    setShowPurchaseHistoryModal(true);
  };

  const handleModalSuccess = () => {
    fetchDropdownData();
    fetchInventory();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-gray-600">Loading inventory...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your warehouse items and settings 
            {Array.isArray(items) && items.length > 0 && (
              <span className="text-primary-600 font-medium"> • {items.length} items loaded</span>
            )}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={refreshInventory}
            disabled={refreshing}
            className="btn-secondary flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button onClick={handleAdd} className="btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      <InventoryStats items={Array.isArray(items) ? items : []} />

      <InventoryActions
        onImport={fetchInventory}
        onManage={() => setShowManagementModal(true)}
        onAddCategory={() => setShowCategoryModal(true)}
        onAddSubcategory={() => setShowSubcategoryModal(true)}
        onAddUnit={() => setShowUnitModal(true)}
        onAddLocation={() => setShowLocationModal(true)}
        onAddSupplier={() => setShowSupplierModal(true)}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <InventoryFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          stockFilter={stockFilter}
          setStockFilter={setStockFilter}
          categories={Array.isArray(categories) ? categories : []}
        />

        <InventoryTable
          items={Array.isArray(filteredItems) ? filteredItems : []}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={(field) => {
            if (sortField === field) {
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            } else {
              setSortField(field);
              setSortDirection('asc');
            }
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewPurchaseHistory={handleViewPurchaseHistory}
        />
      </div>

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
          <strong>Debug Info:</strong> 
          Items: {Array.isArray(items) ? items.length : 'Not array'} | 
          Filtered: {Array.isArray(filteredItems) ? filteredItems.length : 'Not array'} | 
          Categories: {Array.isArray(categories) ? categories.length : 'Not array'} | 
          Loading: {loading ? 'Yes' : 'No'}
        </div>
      )}

      <InventoryModals
        showModal={showModal}
        setShowModal={setShowModal}
        showCategoryModal={showCategoryModal}
        setShowCategoryModal={setShowCategoryModal}
        showSubcategoryModal={showSubcategoryModal}
        setShowSubcategoryModal={setShowSubcategoryModal}
        showUnitModal={showUnitModal}
        setShowUnitModal={setShowUnitModal}
        showLocationModal={showLocationModal}
        setShowLocationModal={setShowLocationModal}
        showSupplierModal={showSupplierModal}
        setShowSupplierModal={setShowSupplierModal}
        showManagementModal={showManagementModal}
        setShowManagementModal={setShowManagementModal}
        showPurchaseHistoryModal={showPurchaseHistoryModal}
        setShowPurchaseHistoryModal={setShowPurchaseHistoryModal}
        editingItem={editingItem}
        selectedItemId={selectedItemId}
        categories={Array.isArray(categories) ? categories : []}
        units={Array.isArray(units) ? units : []}
        locations={Array.isArray(locations) ? locations : []}
        suppliers={Array.isArray(suppliers) ? suppliers : []}
        onSuccess={handleModalSuccess}
        confirmationState={confirmationState}
        hideConfirmation={hideConfirmation}
      />
    </div>
  );
};

export default InventoryPage;