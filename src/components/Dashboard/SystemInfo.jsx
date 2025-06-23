import React from 'react';

const SystemInfo = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">Online</div>
          <div className="text-sm text-gray-500">System Status</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">Connected</div>
          <div className="text-sm text-gray-500">Database</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">Today</div>
          <div className="text-sm text-gray-500">Last Backup</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">Available</div>
          <div className="text-sm text-gray-500">Network Access</div>
        </div>
      </div>
    </div>
  );
};

export default SystemInfo;