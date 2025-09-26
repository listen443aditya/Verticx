import React from 'react';
import Card from './Card.tsx';
import Button from './Button.tsx';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  confirmVariant?: 'primary' | 'secondary' | 'danger';
  isConfirming?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  isConfirming = false,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      aria-modal="true"
      role="dialog"
    >
      <Card className="w-full max-w-md">
        <h2 className={`text-xl font-bold mb-4 ${confirmVariant === 'danger' ? 'text-red-600' : 'text-text-primary-dark'}`}>
          {title}
        </h2>
        <div className="text-text-secondary-dark mb-6">{message}</div>
        <div className="flex justify-end gap-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isConfirming}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? `${confirmText}ing...` : confirmText}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmationModal;
