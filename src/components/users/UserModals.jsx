import React from 'react';
import UserModal from '../modals/UserModal';
import UserActivityModal from '../modals/UserActivityModal';
import ConfirmationModal from '../modals/ConfirmationModal';

const UserModals = ({
  showModal,
  setShowModal,
  showActivityModal,
  setShowActivityModal,
  editingUser,
  selectedUserId,
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

      {/* User Modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            onSuccess();
          }}
        />
      )}

      {/* Activity Modal */}
      {showActivityModal && (
        <UserActivityModal
          userId={selectedUserId}
          onClose={() => setShowActivityModal(false)}
        />
      )}
    </>
  );
};

export default UserModals;