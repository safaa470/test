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
    fetchInventory();
    fetchDropdownData();
  }, []);

  useEffect(() => {
    filterAndSortItems();
  }, [items, searchTerm, categoryFilter, stockFilter, sortField, sortDirection]);

  const fetchInventory = async () => {
    try {
      const response = await axios.get('/api/inventory');
      setItems(response.data);
    } catch (error) {
      toast.error('Error fetching inventory');
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
      const [categoriesRes, unitsRes, locationsRes, suppliersRes] = await Promise.all([
        axios.get('/api/categories'),
        axios.get('/api/units'),
        axios.get('/api/locations'),
        axios.get('/api/suppliers')
      ]);

      setCategories(categoriesRes.data);
      setUnits(unitsRes.data);
      setLocations(locationsRes.data);
      setSuppliers(suppliersRes.data);
    } catch (error) {
      toast.error('Error fetching dropdown data');
    }
  };

  const filterAndSortItems = () => {
    let filtered = items.filter(item =>
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-2">Manage your warehouse items and settings</p>
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

      <InventoryStats items={items} />

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
          categories={categories}
        />

        <InventoryTable
          items={filteredItems}
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
        categories={categories}
        units={units}
        locations={locations}
        suppliers={suppliers}
        onSuccess={handleModalSuccess}
        confirmationState={confirmationState}
        hideConfirmation={hideConfirmation}
      />
    </div>
  );
};

export default InventoryPage;