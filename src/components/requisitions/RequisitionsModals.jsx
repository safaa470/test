import React from 'react';
import RequisitionModal from '../modals/RequisitionModal';
import RequisitionViewModal from '../modals/RequisitionViewModal';
import ApprovalModal from '../modals/ApprovalModal';
import ConfirmationModal from '../modals/ConfirmationModal';

const RequisitionsModals = ({
  showModal,
  setShowModal,
  showViewModal,
  setShowViewModal,
  showApprovalModal,
  setShowApprovalModal,
  editingRequisition,
  selectedRequisition,
  onSuccess,
  confirmationState,
  hideConfirmation
}) => {
  return (
    <>
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

      {/* Requisition Modal */}
      {showModal && (
        <RequisitionModal
          requisition={editingRequisition}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            onSuccess();
          }}
        />
      )}

      {/* View Modal */}
      {showViewModal && (
        <RequisitionViewModal
          requisition={selectedRequisition}
          onClose={() => setShowViewModal(false)}
          onSuccess={() => {
            setShowViewModal(false);
            onSuccess();
          }}
        />
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <ApprovalModal
          requisition={selectedRequisition}
          onClose={() => setShowApprovalModal(false)}
          onSuccess={() => {
            setShowApprovalModal(false);
            onSuccess();
          }}
        />
      )}
    </>
  );
};

export default RequisitionsModals;