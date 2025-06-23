import React from 'react';
import InventoryModal from '../modals/InventoryModal';
import CategoryModal from '../modals/CategoryModal';
import UnitModal from '../modals/UnitModal';
import LocationModal from '../modals/LocationModal';
import SupplierModal from '../modals/SupplierModal';
import ManagementModal from '../modals/ManagementModal';
import PurchaseHistoryModal from '../modals/PurchaseHistoryModal';
import ConfirmationModal from '../modals/ConfirmationModal';

const InventoryModals = ({
  showModal,
  setShowModal,
  showCategoryModal,
  setShowCategoryModal,
  showSubcategoryModal,
  setShowSubcategoryModal,
  showUnitModal,
  setShowUnitModal,
  showLocationModal,
  setShowLocationModal,
  showSupplierModal,
  setShowSupplierModal,
  showManagementModal,
  setShowManagementModal,
  showPurchaseHistoryModal,
  setShowPurchaseHistoryModal,
  editingItem,
  selectedItemId,
  categories,
  units,
  locations,
  suppliers,
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

      {/* Inventory Modal */}
      {showModal && (
        <InventoryModal
          item={editingItem}
          categories={categories}
          units={units}
          locations={locations}
          suppliers={suppliers}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            onSuccess();
          }}
        />
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          categories={categories}
          onClose={() => setShowCategoryModal(false)}
          onSuccess={() => {
            setShowCategoryModal(false);
            onSuccess();
          }}
        />
      )}

      {/* Subcategory Modal */}
      {showSubcategoryModal && (
        <CategoryModal
          categories={categories}
          isSubcategory={true}
          onClose={() => setShowSubcategoryModal(false)}
          onSuccess={() => {
            setShowSubcategoryModal(false);
            onSuccess();
          }}
        />
      )}

      {/* Unit Modal */}
      {showUnitModal && (
        <UnitModal
          onClose={() => setShowUnitModal(false)}
          onSuccess={() => {
            setShowUnitModal(false);
            onSuccess();
          }}
        />
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <LocationModal
          onClose={() => setShowLocationModal(false)}
          onSuccess={() => {
            setShowLocationModal(false);
            onSuccess();
          }}
        />
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <SupplierModal
          onClose={() => setShowSupplierModal(false)}
          onSuccess={() => {
            setShowSupplierModal(false);
            onSuccess();
          }}
        />
      )}

      {/* Management Modal */}
      {showManagementModal && (
        <ManagementModal
          categories={categories}
          units={units}
          locations={locations}
          suppliers={suppliers}
          onClose={() => setShowManagementModal(false)}
          onSuccess={() => {
            setShowManagementModal(false);
            onSuccess();
          }}
        />
      )}

      {/* Purchase History Modal */}
      {showPurchaseHistoryModal && (
        <PurchaseHistoryModal
          itemId={selectedItemId}
          onClose={() => setShowPurchaseHistoryModal(false)}
          onSuccess={() => {
            setShowPurchaseHistoryModal(false);
            onSuccess();
          }}
        />
      )}
    </>
  );
};

export default InventoryModals;