import React from 'react';
import { Package, FileText, TrendingUp, DollarSign } from 'lucide-react';

const QuickActions = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <button className="w-full btn-primary text-left flex items-center">
          <Package className="h-4 w-4 mr-2" />
          Add New Item
        </button>
        <button className="w-full btn-secondary text-left flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Create Requisition
        </button>
        <button className="w-full btn-success text-left flex items-center">
          <TrendingUp className="h-4 w-4 mr-2" />
          Generate Report
        </button>
        <button className="w-full btn-warning text-left flex items-center">
          <DollarSign className="h-4 w-4 mr-2" />
          Export Inventory
        </button>
      </div>
    </div>
  );
};

export default QuickActions;