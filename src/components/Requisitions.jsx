import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Calendar,
  User,
  DollarSign,
  Package,
  Send,
  ArrowRight,
  Download
} from 'lucide-react';
import RequisitionModal from './modals/RequisitionModal';
import RequisitionViewModal from './modals/RequisitionViewModal';
import ApprovalModal from './modals/ApprovalModal';
import ConfirmationModal from './modals/ConfirmationModal';
import { useConfirmation } from '../hooks/useConfirmation';
import { useAuth } from '../contexts/AuthContext';

const Requisitions = () => {
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState([]);
  const [filteredRequisitions, setFilteredRequisitions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [editingRequisition, setEditingRequisition] = useState(null);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [stats, setStats] = useState({});
  const { confirmationState, showConfirmation, hideConfirmation } = useConfirmation();

  useEffect(() => {
    fetchRequisitions();
    fetchStats();
  }, []);

  useEffect(() => {
    let filtered = requisitions.filter(req =>
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requisition_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requested_by_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(req => req.priority === priorityFilter);
    }

    setFilteredRequisitions(filtered);
  }, [requisitions, searchTerm, statusFilter, priorityFilter]);

  const fetchRequisitions = async () => {
    try {
      const response = await axios.get('/api/requisitions');
      setRequisitions(response.data);
    } catch (error) {
      toast.error('Error fetching requisitions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/requisitions/stats/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDelete = async (id, requisitionNumber) => {
    const confirmed = await showConfirmation({
      title: 'Delete Requisition',
      message: `Are you sure you want to delete requisition "${requisitionNumber}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: Trash2
    });

    if (confirmed) {
      try {
        await axios.delete(`/api/requisitions/${id}`);
        toast.success('Requisition deleted successfully');
        fetchRequisitions();
        fetchStats();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Error deleting requisition');
      }
    }
  };

  const handleEdit = (requisition) => {
    setEditingRequisition(requisition);
    setShowModal(true);
  };

  const handleView = (requisition) => {
    setSelectedRequisition(requisition);
    setShowViewModal(true);
  };

  const handleApprove = (requisition) => {
    setSelectedRequisition(requisition);
    setShowApprovalModal(true);
  };

  const handleSubmit = async (id, requisitionNumber) => {
    const confirmed = await showConfirmation({
      title: 'Submit Requisition',
      message: `Are you sure you want to submit requisition "${requisitionNumber}" for approval? Once submitted, you cannot edit it.`,
      confirmText: 'Submit',
      cancelText: 'Cancel',
      type: 'success',
      icon: Send
    });

    if (confirmed) {
      try {
        await axios.post(`/api/requisitions/${id}/submit`);
        toast.success('Requisition submitted successfully');
        fetchRequisitions();
        fetchStats();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Error submitting requisition');
      }
    }
  };

  const handleAdd = () => {
    setEditingRequisition(null);
    setShowModal(true);
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
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const canEdit = (requisition) => {
    return requisition.status === 'draft' && requisition.requested_by === user.id;
  };

  const canSubmit = (requisition) => {
    return requisition.status === 'draft' && requisition.requested_by === user.id;
  };

  const canApprove = (requisition) => {
    return ['submitted', 'pending_approval'].includes(requisition.status) && 
           (user.role === 'admin' || user.role === 'manager');
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
          <h1 className="text-3xl font-bold text-gray-900">Requisitions</h1>
          <p className="text-gray-600 mt-2">Manage purchase requisitions and approval workflow</p>
        </div>
        
        <button onClick={handleAdd} className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          New Requisition
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary-50">
              <FileText className="h-6 w-6 text-primary-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requisitions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRequisitions || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-50">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-50">
              <User className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">My Requisitions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.myRequisitions || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-50">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedThisMonth || 0}</p>
            </div>
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
                placeholder="Search requisitions by title, number, or requester..."
                className="pl-10 form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="fulfilled">Fulfilled</option>
              </select>

              <select
                className="form-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requisition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requester & Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status & Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items & Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequisitions.map((requisition) => (
                <tr key={requisition.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{requisition.title}</div>
                      <div className="text-sm text-gray-500">{requisition.requisition_number}</div>
                      {requisition.description && (
                        <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                          {requisition.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{requisition.requested_by_name}</div>
                    <div className="text-sm text-gray-500">{requisition.department || 'No Department'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(requisition.status)}`}>
                        {getStatusIcon(requisition.status)}
                        <span className="ml-1">{requisition.status.replace('_', ' ').toUpperCase()}</span>
                      </span>
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(requisition.priority)}`}>
                          {requisition.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {requisition.item_count} item{requisition.item_count !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      ${(requisition.calculated_total_cost || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      Created: {new Date(requisition.created_at).toLocaleDateString()}
                    </div>
                    {requisition.required_date && (
                      <div className="text-sm text-gray-500">
                        Required: {new Date(requisition.required_date).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleView(requisition)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {canEdit(requisition) && (
                        <button
                          onClick={() => handleEdit(requisition)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit Requisition"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      
                      {canSubmit(requisition) && (
                        <button
                          onClick={() => handleSubmit(requisition.id, requisition.requisition_number)}
                          className="text-green-600 hover:text-green-900"
                          title="Submit for Approval"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      
                      {canApprove(requisition) && (
                        <button
                          onClick={() => handleApprove(requisition)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Review & Approve"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                      
                      {canEdit(requisition) && (
                        <button
                          onClick={() => handleDelete(requisition.id, requisition.requisition_number)}
                          className="text-error-600 hover:text-error-900"
                          title="Delete Requisition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequisitions.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No requisitions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating your first requisition'}
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
        <RequisitionModal
          requisition={editingRequisition}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchRequisitions();
            fetchStats();
          }}
        />
      )}

      {showViewModal && (
        <RequisitionViewModal
          requisition={selectedRequisition}
          onClose={() => setShowViewModal(false)}
          onSuccess={() => {
            setShowViewModal(false);
            fetchRequisitions();
            fetchStats();
          }}
        />
      )}

      {showApprovalModal && (
        <ApprovalModal
          requisition={selectedRequisition}
          onClose={() => setShowApprovalModal(false)}
          onSuccess={() => {
            setShowApprovalModal(false);
            fetchRequisitions();
            fetchStats();
          }}
        />
      )}
    </div>
  );
};

export default Requisitions;