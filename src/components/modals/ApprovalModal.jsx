import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  MessageSquare,
  AlertTriangle,
  Clock,
  User,
  FileText
} from 'lucide-react';

const ApprovalModal = ({ requisition, onClose, onSuccess }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [action, setAction] = useState('');
  const [comments, setComments] = useState('');

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

  const handleSubmit = async (selectedAction) => {
    if (!selectedAction) {
      toast.error('Please select an action');
      return;
    }

    if (selectedAction === 'rejected' && !comments.trim()) {
      toast.error('Comments are required when rejecting a requisition');
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(`/api/requisitions/${requisition.id}/approve`, {
        action: selectedAction,
        comments: comments.trim()
      });

      const actionText = selectedAction === 'approved' ? 'approved' : 
                        selectedAction === 'rejected' ? 'rejected' : 'returned';
      
      toast.success(`Requisition ${actionText} successfully`);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to process approval');
    } finally {
      setSubmitting(false);
    }
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'approved':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'rejected':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'returned':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'returned':
        return <ArrowLeft className="h-4 w-4" />;
      default:
        return null;
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Review Requisition</h2>
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
              {/* Requisition Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-900 mb-4">Requisition Summary</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700">Title</label>
                    <p className="mt-1 text-sm text-blue-900 font-medium">{details.title}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-700">Requested By</label>
                    <p className="mt-1 text-sm text-blue-900">{details.requested_by_name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-700">Department</label>
                    <p className="mt-1 text-sm text-blue-900">{details.department || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-700">Priority</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      details.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      details.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      details.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {details.priority.toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-700">Total Cost</label>
                    <p className="mt-1 text-lg font-bold text-green-600">
                      ${details.total_estimated_cost.toFixed(2)}
                    </p>
                  </div>
                  
                  {details.required_date && (
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Required Date</label>
                      <p className="mt-1 text-sm text-blue-900">
                        {new Date(details.required_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {details.description && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-blue-700">Description</label>
                    <p className="mt-1 text-sm text-blue-900">{details.description}</p>
                  </div>
                )}

                {details.justification && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-blue-700">Justification</label>
                    <p className="mt-1 text-sm text-blue-900">{details.justification}</p>
                  </div>
                )}
              </div>

              {/* Requested Items */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Items for Review</h3>
                
                <div className="space-y-4">
                  {details.items.map((item, index) => (
                    <div key={item.id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Item</label>
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
                          <label className="block text-sm font-medium text-gray-500">Total</label>
                          <p className="mt-1 text-sm font-medium text-green-600">
                            ${(item.total_estimated_cost || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      {item.item_description && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-500">Description</label>
                          <p className="mt-1 text-sm text-gray-700">{item.item_description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Comments</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments {action === 'rejected' && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      rows="4"
                      className="form-input"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder={
                        action === 'approved' ? 'Optional: Add any comments about the approval...' :
                        action === 'rejected' ? 'Required: Explain why this requisition is being rejected...' :
                        action === 'returned' ? 'Explain what needs to be changed...' :
                        'Add your comments here...'
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Action Panel */}
            <div className="space-y-6">
              {/* Current Step Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-yellow-900 mb-4">Current Approval Step</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">
                        Step {details.current_step}
                      </p>
                      <p className="text-xs text-yellow-700">
                        Waiting for your approval
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Take Action</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setAction('approved')}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                      action === 'approved' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                    }`}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Approve
                  </button>
                  
                  <button
                    onClick={() => setAction('rejected')}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                      action === 'rejected' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                    }`}
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Reject
                  </button>
                  
                  <button
                    onClick={() => setAction('returned')}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                      action === 'returned' 
                        ? 'bg-yellow-600 text-white' 
                        : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'
                    }`}
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Return for Changes
                  </button>
                </div>

                {action && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleSubmit(action)}
                      disabled={submitting || (action === 'rejected' && !comments.trim())}
                      className={`w-full px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getActionColor(action)}`}
                    >
                      {submitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          {getActionIcon(action)}
                          <span className="ml-2">
                            Confirm {action === 'approved' ? 'Approval' : 
                                    action === 'rejected' ? 'Rejection' : 'Return'}
                          </span>
                        </div>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Previous Approvals */}
              {details.approvals.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Previous Approvals</h3>
                  
                  <div className="space-y-3">
                    {details.approvals.map((approval, index) => (
                      <div key={approval.id || index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {approval.action === 'approved' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : approval.action === 'rejected' ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <ArrowLeft className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {approval.approver_name}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {approval.action} • Step {approval.step_order}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(approval.approved_at).toLocaleDateString()}
                          </p>
                          {approval.comments && (
                            <div className="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-700">
                              <MessageSquare className="h-3 w-3 inline mr-1" />
                              {approval.comments}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

export default ApprovalModal;