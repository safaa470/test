import { useState } from 'react';

export const useConfirmation = () => {
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'default',
    icon: null,
    onConfirm: () => {},
    onCancel: () => {}
  });

  const showConfirmation = ({
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "default",
    icon = null,
    onConfirm = () => {},
    onCancel = () => {}
  }) => {
    return new Promise((resolve) => {
      setConfirmationState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        icon,
        onConfirm: () => {
          onConfirm();
          resolve(true);
        },
        onCancel: () => {
          onCancel();
          resolve(false);
        }
      });
    });
  };

  const hideConfirmation = () => {
    setConfirmationState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    confirmationState,
    showConfirmation,
    hideConfirmation
  };
};