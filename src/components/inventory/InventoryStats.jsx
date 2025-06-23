import React from 'react';
import { Package, AlertTriangle, DollarSign } from 'lucide-react';

const InventoryStats = ({ items }) => {
  // Ensure items is always an array
  const itemsArray = Array.isArray(items) ? items : [];
  
  const totalItems = itemsArray.length;
  const lowStockItems = itemsArray.filter(item => item.quantity <= item.min_quantity).length;
  const outOfStockItems = itemsArray.filter(item => item.quantity === 0).length;
  const totalValue = itemsArray.reduce((sum, item) => sum + (item.total_value || 0), 0);

  const statCards = [
    {
      title: 'Total Items',
      value: totalItems,
      icon: Package,
      color: 'text-primary-500',
      bgColor: 'bg-primary-50'
    },
    {
      title: 'Low Stock',
      value: lowStockItems,
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Out of Stock',
      value: outOfStockItems,
      icon: Package,
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Total Value',
      value: `$${totalValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InventoryStats;