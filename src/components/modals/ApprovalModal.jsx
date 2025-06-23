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
  FileText,
  Edit3,
  Calculator
} from 'lucide-react';

const ApprovalModal = ({ requisition, onClose, onSuccess }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [action, setAction] = useState('');
  const [comments, setComments] = useState('');
  const [approvalQuantities, setApprovalQuantities] = useState({});
  const [isPartialApproval, setIsPartialApproval] = useState(false);

  useEffect(() => {
    if (requisition) {
      fetchRequisitionDetails();
    }
  }, [requisition]);

  const fetchRequisitionDetails = async () => {
    try {
      const response = await axios.get(`/api/requisitions/${requisition.id}`);
      setDetails(response.data);
      
      // Initialize approval quantities with requested quantities
      const initialQuantities = {};
      (response.data.items || []).forEach(item => {
        initialQuantities[item.id] = item.quantity_requested;
      });
      setApprovalQuantities(initialQuantities);
    } catch (error) {
      toast.error('Error fetching requisition details');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId, quantity) => {
    const newQuantity = Math.max(0, parseInt(quantity) || 0);
    setApprovalQuantities(prev => ({
      ...prev,
      [itemId]: newQuantity
    }));
    
    // Check if this is a partial approval
    const item = details.items.find(i => i.id === itemId);
    if (item && newQuantity < item.quantity_requested) {
      setIsPartialApproval(true);
    } else {
      // Check if any other items have partial quantities
      const hasPartial = details.items.some(item => {
        const approvedQty = itemId === item.id ? newQuantity : (approvalQuantities[item.id] || item.quantity_requested);
        return approvedQty < item.quantity_requested;
      });
      setIsPartialApproval(hasPartial);
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

    // Validate approval quantities
    if (selectedAction === 'approved') {
      const hasInvalidQuantities = details.items.some(item => {
        const approvedQty = approvalQuantities[item.id] || 0;
        return approvedQty < 0 || approvedQty > item.quantity_requested;
      });

      if (hasInvalidQuantities) {
        toast.error('Approved quantities cannot be negative or exceed requested quantities');
        return;
      }

      const hasZeroQuantities = details.items.every(item => {
        const approvedQty = approvalQuantities[item.id] || 0;
        return approvedQty === 0;
      });

      if (hasZeroQuantities) {
        toast.error('At least one item must have an approved quantity greater than 0');
        return;
      }
    }

    setSubmitting(true);

    try {
      const approvalData = {
        action: selectedAction,
        comments: comments.trim(),
        approvalQuantities: selectedAction === 'approved' ? approvalQuantities : null,
        isPartialApproval: selectedAction === 'approved' ? isPartialApproval : false
      };

      await axios.post(`/api/requisitions/${requisition.id}/approve`, approvalData);

      const actionText = selectedAction === 'approved' ? 'approved' : 
                        selectedAction === 'rejected' ? 'rejected' : 'returned';
      
      toast.success(`Requisition ${actionText} successfully${isPartialApproval ? ' (partial approval)' : ''}`);
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

  const calculateTotalApprovedCost = () => {
    return (details.items || []).reduce((total, item) => {
      const approvedQty = approvalQuantities[item.id] || 0;
      return total + (approvedQty * (item.estimated_unit_cost || 0));
    }, 0);
  };

  const getApprovalSummary = () => {
    const totalItems = (details.items || []).length;
    const fullyApprovedItems = (details.items || []).filter(item => 
      (approvalQuantities[item.id] || 0) === item.quantity_requested
    ).length;
    const partiallyApprovedItems = (details.items || []).filter(item => {
      const approvedQty = approvalQuantities[item.id] || 0;
      return approvedQty > 0 && approvedQty < item.quantity_requested;
    }).length;
    const rejectedItems = (details.items || []).filter(item => 
      (approvalQuantities[item.id] || 0) === 0
    ).length;

    return {
      totalItems,
      fullyApprovedItems,
      partiallyApprovedItems,
      rejectedItems
    };
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

  const approvalSummary = getApprovalSummary();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col">
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
                    <label className="block text-sm font-medium text-blue-700">Original Total Cost</label>
                    <p className="mt-1 text-lg font-bold text-blue-600">
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

              {/* Items for Approval */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Items for Approval</h3>
                  <div className="flex items-center text-sm text-gray-600">
                    <Edit3 className="h-4 w-4 mr-1" />
                    Adjust quantities as needed
                  </div>
                </div>
                
                <div className="space-y-4">
                  {(details.items || []).map((item, index) => {
                    const approvedQty = approvalQuantities[item.id] || 0;
                    const isPartial = approvedQty > 0 && approvedQty < item.quantity_requested;
                    const isRejected = approvedQty === 0;
                    const isFullyApproved = approvedQty === item.quantity_requested;
                    
                    return (
                      <div key={item.id || index} className={`border rounded-lg p-4 ${
                        isRejected ? 'border-red-200 bg-red-50' :
                        isPartial ? 'border-yellow-200 bg-yellow-50' :
                        isFullyApproved ? 'border-green-200 bg-green-50' :
                        'border-gray-200 hover:bg-gray-50'
                      }`}>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500">Item</label>
                            <p className="mt-1 text-sm font-medium text-gray-900">{item.item_name}</p>
                            {item.inventory_sku && (
                              <p className="text-xs text-gray-500">SKU: {item.inventory_sku}</p>
                            )}
                            {item.item_description && (
                              <p className="text-xs text-gray-600 mt-1">{item.item_description}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-500">Requested</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {item.quantity_requested} {item.unit_abbreviation || 'units'}
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-500">
                              Approve Quantity *
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={item.quantity_requested}
                              className="mt-1 form-input w-full"
                              value={approvedQty}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              disabled={action === 'rejected' || action === 'returned'}
                            />
                            <div className="flex justify-between mt-1">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.id, 0)}
                                className="text-xs text-red-600 hover:text-red-800"
                                disabled={action === 'rejected' || action === 'returned'}
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.id, item.quantity_requested)}
                                className="text-xs text-green-600 hover:text-green-800"
                                disabled={action === 'rejected' || action === 'returned'}
                              >
                                Full
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-500">Approved Cost</label>
                            <p className="mt-1 text-sm font-medium text-green-600">
                              ${(approvedQty * (item.estimated_unit_cost || 0)).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              @ ${(item.estimated_unit_cost || 0).toFixed(2)} each
                            </p>
                          </div>
                        </div>
                        
                        {/* Status indicator */}
                        <div className="mt-3 flex items-center">
                          {isRejected && (
                            <div className="flex items-center text-red-600">
                              <XCircle className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">Item Rejected</span>
                            </div>
                          )}
                          {isPartial && (
                            <div className="flex items-center text-yellow-600">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">
                                Partial Approval ({approvedQty} of {item.quantity_requested})
                              </span>
                            </div>
                          )}
                          {isFullyApproved && (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">Fully Approved</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Approval Summary */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">Approval Summary</h4>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calculator className="h-4 w-4 mr-1" />
                      Total Approved Cost: ${calculateTotalApprovedCost().toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{approvalSummary.fullyApprovedItems}</div>
                      <div className="text-gray-600">Fully Approved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-600">{approvalSummary.partiallyApprovedItems}</div>
                      <div className="text-gray-600">Partially Approved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{approvalSummary.rejectedItems}</div>
                      <div className="text-gray-600">Rejected</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-600">{approvalSummary.totalItems}</div>
                      <div className="text-gray-600">Total Items</div>
                    </div>
                  </div>
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
                  
                  {isPartialApproval && action === 'approved' && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-yellow-900">Partial Approval Notice</h4>
                          <p className="text-sm text-yellow-800 mt-1">
                            You are approving partial quantities for some items. Please add comments explaining the reason for partial approval.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
                    Approve {isPartialApproval ? '(Partial)' : ''}
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
              {(details.approvals || []).length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Previous Approvals</h3>
                  
                  <div className="space-y-3">
                    {(details.approvals || []).map((approval, index) => (
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