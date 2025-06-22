import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  X, 
  FileText, 
  User, 
  Calendar, 
  Package, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  MessageSquare
} from 'lucide-react';

const RequisitionViewModal = ({ requisition, onClose, onSuccess }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (requisition) {
      fetchRequisitionDetails();
    }
  }, [requisition]);

  const fetchRequisitionDetails = async () => {
    try {
      const response = await axios.get(`/api/requisitions/${requisition.id}`);
      setDetails(response.data);
    } catch (error) {
      toast.error('Error fetching requisition details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'fulfilled':
        return 'bg-purple-100 text-purple-800';
      case 'partially_fulfilled':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4" />;
      case 'submitted':
      case 'pending_approval':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'fulfilled':
      case 'partially_fulfilled':
        return <Package className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getApprovalIcon = (action) => {
    switch (action) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'returned':
        return <ArrowRight className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
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

  if (!details) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Requisition Details</h2>
            <p className="text-sm text-gray-600">{details.requisition_number}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Title</label>
                    <p className="mt-1 text-sm text-gray-900">{details.title}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Department</label>
                    <p className="mt-1 text-sm text-gray-900">{details.department || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(details.status)}`}>
                        {getStatusIcon(details.status)}
                        <span className="ml-1">{details.status.replace('_', ' ').toUpperCase()}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Priority</label>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(details.priority)}`}>
                        {details.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Requested By</label>
                    <p className="mt-1 text-sm text-gray-900">{details.requested_by_name}</p>
                    <p className="text-xs text-gray-500">{details.requested_by_email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Workflow</label>
                    <p className="mt-1 text-sm text-gray-900">{details.workflow_name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Created Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(details.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {details.required_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Required Date</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(details.required_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {details.description && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{details.description}</p>
                  </div>
                )}

                {details.justification && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-500">Justification</label>
                    <p className="mt-1 text-sm text-gray-900">{details.justification}</p>
                  </div>
                )}
              </div>

              {/* Requested Items */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Requested Items</h3>
                
                <div className="space-y-4">
                  {details.items.map((item, index) => (
                    <div key={item.id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Item Name</label>
                          <p className="mt-1 text-sm font-medium text-gray-900">{item.item_name}</p>
                          {item.inventory_sku && (
                            <p className="text-xs text-gray-500">SKU: {item.inventory_sku}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Quantity</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {item.quantity_requested} {item.unit_abbreviation || 'units'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Unit Cost</label>
                          <p className="mt-1 text-sm text-gray-900">
                            ${(item.estimated_unit_cost || 0).toFixed(2)}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Total Cost</label>
                          <p className="mt-1 text-sm font-medium text-green-600">
                            ${(item.total_estimated_cost || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      {item.item_description && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-500">Description</label>
                          <p className="mt-1 text-sm text-gray-900">{item.item_description}</p>
                        </div>
                      )}
                      
                      {item.notes && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-500">Notes</label>
                          <p className="mt-1 text-sm text-gray-900">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total Cost */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-lg font-medium text-green-900">Total Estimated Cost:</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      ${details.total_estimated_cost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Workflow Progress */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Workflow</h3>
                
                <div className="space-y-4">
                  {details.workflowSteps.map((step, index) => {
                    const isCurrentStep = step.step_order === details.current_step;
                    const isCompleted = details.approvals.some(approval => 
                      approval.workflow_step_id === step.id && approval.action === 'approved'
                    );
                    const isRejected = details.approvals.some(approval => 
                      approval.workflow_step_id === step.id && approval.action === 'rejected'
                    );
                    
                    return (
                      <div key={step.id} className={`flex items-center p-3 rounded-lg ${
                        isCurrentStep ? 'bg-yellow-50 border border-yellow-200' :
                        isCompleted ? 'bg-green-50 border border-green-200' :
                        isRejected ? 'bg-red-50 border border-red-200' :
                        'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : isRejected ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : isCurrentStep ? (
                            <Clock className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Step {step.step_order}: {step.approver_role.charAt(0).toUpperCase() + step.approver_role.slice(1)} Approval
                          </p>
                          <p className="text-xs text-gray-500">
                            {isCompleted ? 'Approved' :
                             isRejected ? 'Rejected' :
                             isCurrentStep ? 'Pending' : 'Waiting'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Approval History */}
              {details.approvals.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Approval History</h3>
                  
                  <div className="space-y-4">
                    {details.approvals.map((approval, index) => (
                      <div key={approval.id || index} className="border-l-4 border-gray-200 pl-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            {getApprovalIcon(approval.action)}
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {approval.approver_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(approval.approved_at).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600 capitalize">
                              {approval.action} at Step {approval.step_order}
                            </p>
                            {approval.comments && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                                <MessageSquare className="h-3 w-3 inline mr-1" />
                                {approval.comments}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Dates */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Key Dates</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Created</p>
                      <p className="text-xs text-gray-500">
                        {new Date(details.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {details.submitted_at && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-blue-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Submitted</p>
                        <p className="text-xs text-gray-500">
                          {new Date(details.submitted_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {details.approved_at && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-green-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Approved</p>
                        <p className="text-xs text-gray-500">
                          {new Date(details.approved_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {details.rejected_at && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-red-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Rejected</p>
                        <p className="text-xs text-gray-500">
                          {new Date(details.rejected_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequisitionViewModal;