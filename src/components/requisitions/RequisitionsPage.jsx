import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import RequisitionsStats from './RequisitionsStats';
import RequisitionsFilters from './RequisitionsFilters';
import RequisitionsTable from './RequisitionsTable';
import RequisitionsModals from './RequisitionsModals';
import { useConfirmation } from '../../hooks/useConfirmation';
import { useAuth } from '../../contexts/AuthContext';

const RequisitionsPage = () => {
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState([]);
  const [filteredRequisitions, setFilteredRequisitions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [stats, setStats] = useState({});
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [editingRequisition, setEditingRequisition] = useState(null);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  
  const { confirmationState, showConfirmation, hideConfirmation } = useConfirmation();

  useEffect(() => {
    fetchRequisitions();
    fetchStats();
  }, []);

  useEffect(() => {
    filterRequisitions();
  }, [requisitions, searchTerm, statusFilter, priorityFilter]);

  const fetchRequisitions = async () => {
    try {
      const response = await axios.get('/api/requisitions');
      // Ensure response.data is always an array
      const requisitionsData = Array.isArray(response.data) ? response.data : [];
      setRequisitions(requisitionsData);
    } catch (error) {
      toast.error('Error fetching requisitions');
      // Set empty array on error to prevent map errors
      setRequisitions([]);
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

  const filterRequisitions = () => {
    // Ensure requisitions is always an array before filtering
    const requisitionsArray = Array.isArray(requisitions) ? requisitions : [];
    
    let filtered = requisitionsArray.filter(req =>
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
  };

  const handleDelete = async (id, requisitionNumber) => {
    const confirmed = await showConfirmation({
      title: 'Delete Requisition',
      message: `Are you sure you want to delete requisition "${requisitionNumber}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
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

  const handleSubmit = async (id, requisitionNumber) => {
    const confirmed = await showConfirmation({
      title: 'Submit Requisition',
      message: `Are you sure you want to submit requisition "${requisitionNumber}" for approval? Once submitted, you cannot edit it.`,
      confirmText: 'Submit',
      cancelText: 'Cancel',
      type: 'success'
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

  const handleAdd = () => {
    setEditingRequisition(null);
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    fetchRequisitions();
    fetchStats();
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

      <RequisitionsStats stats={stats} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <RequisitionsFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
        />

        <RequisitionsTable
          requisitions={filteredRequisitions}
          onEdit={handleEdit}
          onView={handleView}
          onApprove={handleApprove}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          canEdit={canEdit}
          canSubmit={canSubmit}
          canApprove={canApprove}
        />
      </div>

      <RequisitionsModals
        showModal={showModal}
        setShowModal={setShowModal}
        showViewModal={showViewModal}
        setShowViewModal={setShowViewModal}
        showApprovalModal={showApprovalModal}
        setShowApprovalModal={setShowApprovalModal}
        editingRequisition={editingRequisition}
        selectedRequisition={selectedRequisition}
        onSuccess={handleModalSuccess}
        confirmationState={confirmationState}
        hideConfirmation={hideConfirmation}
      />
    </div>
  );
};

export default RequisitionsPage;