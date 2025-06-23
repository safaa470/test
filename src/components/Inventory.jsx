import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  FileText,
  AlertTriangle,
  Package,
  FolderTree,
  Ruler,
  MapPin,
  Truck,
  Folder,
  List,
  ArrowRightLeft,
  TrendingUp,
  DollarSign,
  History,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw
} from 'lucide-react';
import InventoryModal from './modals/InventoryModal';
import CategoryModal from './modals/CategoryModal';
import UnitModal from './modals/UnitModal';
import LocationModal from './modals/LocationModal';
import SupplierModal from './modals/SupplierModal';
import ManagementModal from './modals/ManagementModal';
import PurchaseHistoryModal from './modals/PurchaseHistoryModal';
import ConfirmationModal from './modals/ConfirmationModal';
import { useConfirmation } from '../hooks/useConfirmation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [showPurchaseHistoryModal, setShowPurchaseHistoryModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [managementType, setManagementType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const { confirmationState, showConfirmation, hideConfirmation } = useConfirmation();

  useEffect(() => {
    fetchInventory();
    fetchDropdownData();
  }, []);

  useEffect(() => {
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

  const handleDelete = async (id, itemName) => {
    const confirmed = await showConfirmation({
      title: 'Delete Inventory Item',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone and will also remove all associated purchase history.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: Trash2
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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />;
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/inventory/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Inventory exported successfully');
    } catch (error) {
      toast.error('Error exporting inventory');
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    axios.post('/api/inventory/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then(response => {
      toast.success(response.data.message);
      if (response.data.errors.length > 0) {
        console.log('Import errors:', response.data.errors);
      }
      fetchInventory();
    })
    .catch(error => {
      toast.error('Error importing inventory');
    });

    event.target.value = '';
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Inventory Report', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Items: ${filteredItems.length}`, 14, 38);
    doc.text(`Low Stock Items: ${filteredItems.filter(item => item.quantity <= item.min_quantity).length}`, 14, 46);

    const tableData = filteredItems.map(item => [
      item.name,
      item.sku,
      item.category_name || 'N/A',
      item.quantity,
      item.base_unit_abbr || 'N/A',
      item.issue_unit_abbr || item.base_unit_abbr || 'N/A',
      `$${item.unit_price}`,
      `$${item.last_purchase_price || 0}`,
      `$${item.average_price || 0}`,
      `$${item.total_value}`
    ]);

    doc.autoTable({
      head: [['Name', 'SKU', 'Category', 'Qty', 'Base Unit', 'Issue Unit', 'Current Price', 'Last Purchase', 'Avg Price', 'Total Value']],
      body: tableData,
      startY: 55,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save('inventory-report.pdf');
    toast.success('PDF generated successfully');
  };

  const handleModalSuccess = () => {
    fetchDropdownData();
  };

  const handleManageClick = (type) => {
    setManagementType(type);
    setShowManagementModal(true);
  };

  const getStockStatusColor = (item) => {
    if (item.quantity === 0) return 'text-red-600';
    if (item.quantity <= item.min_quantity) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStockStatusIcon = (item) => {
    if (item.quantity === 0) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (item.quantity <= item.min_quantity) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return null;
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
          
          <input
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
            id="import-file"
          />
          <label htmlFor="import-file" className="btn-secondary cursor-pointer flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </label>
          
          <button onClick={handleExport} className="btn-success flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          
          <button onClick={generatePDF} className="btn-warning flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Generate PDF
          </button>
          
          <button onClick={handleAdd} className="btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary-50">
              <Package className="h-6 w-6 text-primary-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-50">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {items.filter(item => item.quantity <= item.min_quantity).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-50">
              <Package className="h-6 w-6 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {items.filter(item => item.quantity === 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-50">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${items.reduce((sum, item) => sum + (item.total_value || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Management Buttons Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Management</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <button 
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <FolderTree className="h-5 w-5 text-primary-500 mr-2" />
            <span className="font-medium text-gray-700">Add Category</span>
          </button>
          
          <button 
            onClick={() => setShowSubcategoryModal(true)}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Folder className="h-5 w-5 text-primary-500 mr-2" />
            <span className="font-medium text-gray-700">Add Subcategory</span>
          </button>
          
          <button 
            onClick={() => setShowUnitModal(true)}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Ruler className="h-5 w-5 text-primary-500 mr-2" />
            <span className="font-medium text-gray-700">Add Unit</span>
          </button>
          
          <button 
            onClick={() => setShowLocationModal(true)}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <MapPin className="h-5 w-5 text-primary-500 mr-2" />
            <span className="font-medium text-gray-700">Add Location</span>
          </button>
          
          <button 
            onClick={() => setShowSupplierModal(true)}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Truck className="h-5 w-5 text-primary-500 mr-2" />
            <span className="font-medium text-gray-700">Add Supplier</span>
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowManagementModal(true)}
              className="w-full flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-success-300 hover:bg-success-50 transition-colors"
            >
              <List className="h-5 w-5 text-success-500 mr-2" />
              <span className="font-medium text-gray-700">Manage All</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search items by name, SKU, or category..."
                className="pl-10 form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                className="form-select"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <option value="all">All Stock Levels</option>
                <option value="good">Good Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Item Details
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('category_name')}
                >
                  <div className="flex items-center">
                    Category & Location
                    {getSortIcon('category_name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center">
                    Units & Stock
                    {getSortIcon('quantity')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('unit_price')}
                >
                  <div className="flex items-center">
                    Pricing
                    {getSortIcon('unit_price')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                      {item.description && (
                        <div className="text-xs text-gray-400 mt-1">{item.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{item.category_name || 'No Category'}</div>
                    <div className="text-sm text-gray-500">{item.location_name || 'No Location'}</div>
                    <div className="text-xs text-gray-400">{item.supplier_name || 'No Supplier'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${getStockStatusColor(item)}`}>
                        {item.quantity} {item.base_unit_abbr || 'units'}
                      </span>
                      {getStockStatusIcon(item)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Min: {item.min_quantity} | Max: {item.max_quantity}
                    </div>
                    {item.issue_unit_abbr && item.issue_unit_abbr !== item.base_unit_abbr && (
                      <div className="flex items-center text-xs text-blue-600 mt-1">
                        <ArrowRightLeft className="h-3 w-3 mr-1" />
                        Issue: {item.issue_unit_abbr}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="font-medium text-gray-900">${item.unit_price}</span>
                        <span className="text-xs text-gray-500 ml-1">Current</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <TrendingUp className="h-3 w-3 text-blue-500 mr-1" />
                        <span className="text-blue-600">${item.last_purchase_price || 0}</span>
                        <span className="text-xs text-gray-500 ml-1">Last Purchase</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <History className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-green-600">${item.average_price || 0}</span>
                        <span className="text-xs text-gray-500 ml-1">Average</span>
                      </div>
                      <div className="text-xs text-gray-500 border-t pt-1">
                        Total: ${item.total_value}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewPurchaseHistory(item.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Purchase History"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit Item"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="text-error-600 hover:text-error-900"
                        title="Delete Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first item'}
            </p>
          </div>
        )}
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

      {/* Modals */}
      {showModal && (
        <InventoryModal
          item={editingItem}
          categories={categories}
          units={units}
          locations={locations}
          suppliers={suppliers}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchInventory();
          }}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          categories={categories}
          onClose={() => setShowCategoryModal(false)}
          onSuccess={() => {
            setShowCategoryModal(false);
            handleModalSuccess();
          }}
        />
      )}

      {showSubcategoryModal && (
        <CategoryModal
          categories={categories}
          isSubcategory={true}
          onClose={() => setShowSubcategoryModal(false)}
          onSuccess={() => {
            setShowSubcategoryModal(false);
            handleModalSuccess();
          }}
        />
      )}

      {showUnitModal && (
        <UnitModal
          onClose={() => setShowUnitModal(false)}
          onSuccess={() => {
            setShowUnitModal(false);
            handleModalSuccess();
          }}
        />
      )}

      {showLocationModal && (
        <LocationModal
          onClose={() => setShowLocationModal(false)}
          onSuccess={() => {
            setShowLocationModal(false);
            handleModalSuccess();
          }}
        />
      )}

      {showSupplierModal && (
        <SupplierModal
          onClose={() => setShowSupplierModal(false)}
          onSuccess={() => {
            setShowSupplierModal(false);
            handleModalSuccess();
          }}
        />
      )}

      {showManagementModal && (
        <ManagementModal
          categories={categories}
          units={units}
          locations={locations}
          suppliers={suppliers}
          onClose={() => setShowManagementModal(false)}
          onSuccess={() => {
            setShowManagementModal(false);
            handleModalSuccess();
          }}
        />
      )}

      {showPurchaseHistoryModal && (
        <PurchaseHistoryModal
          itemId={selectedItemId}
          onClose={() => setShowPurchaseHistoryModal(false)}
          onSuccess={() => {
            setShowPurchaseHistoryModal(false);
            fetchInventory();
          }}
        />
      )}
    </div>
  );
};

export default Inventory;