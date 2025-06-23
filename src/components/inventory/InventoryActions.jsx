import React from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Download, 
  Upload, 
  FileText, 
  FolderTree, 
  Ruler, 
  MapPin, 
  Truck, 
  Folder, 
  List 
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const InventoryActions = ({ 
  onImport, 
  onManage, 
  onAddCategory, 
  onAddSubcategory, 
  onAddUnit, 
  onAddLocation, 
  onAddSupplier 
}) => {
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
      onImport();
    })
    .catch(error => {
      toast.error('Error importing inventory');
    });

    event.target.value = '';
  };

  const generatePDF = async () => {
    try {
      const response = await axios.get('/api/inventory');
      const items = response.data;
      
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('Inventory Report', 14, 22);
      
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Total Items: ${items.length}`, 14, 38);
      doc.text(`Low Stock Items: ${items.filter(item => item.quantity <= item.min_quantity).length}`, 14, 46);

      const tableData = items.map(item => [
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
    } catch (error) {
      toast.error('Error generating PDF');
    }
  };

  return (
    <>
      {/* Export/Import Actions */}
      <div className="flex justify-end space-x-3 mb-4">
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
      </div>

      {/* Management Buttons Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Management</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <button 
            onClick={onAddCategory}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <FolderTree className="h-5 w-5 text-primary-500 mr-2" />
            <span className="font-medium text-gray-700">Add Category</span>
          </button>
          
          <button 
            onClick={onAddSubcategory}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Folder className="h-5 w-5 text-primary-500 mr-2" />
            <span className="font-medium text-gray-700">Add Subcategory</span>
          </button>
          
          <button 
            onClick={onAddUnit}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Ruler className="h-5 w-5 text-primary-500 mr-2" />
            <span className="font-medium text-gray-700">Add Unit</span>
          </button>
          
          <button 
            onClick={onAddLocation}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <MapPin className="h-5 w-5 text-primary-500 mr-2" />
            <span className="font-medium text-gray-700">Add Location</span>
          </button>
          
          <button 
            onClick={onAddSupplier}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Truck className="h-5 w-5 text-primary-500 mr-2" />
            <span className="font-medium text-gray-700">Add Supplier</span>
          </button>

          <button 
            onClick={onManage}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-success-300 hover:bg-success-50 transition-colors"
          >
            <List className="h-5 w-5 text-success-500 mr-2" />
            <span className="font-medium text-gray-700">Manage All</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default InventoryActions;