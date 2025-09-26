import React from 'react';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, title, message }) => {
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
        <h2 className="text-xl font-bold text-brand-accent mb-4">{title}</h2>
        <div className="text-text-secondary-dark mb-6">{message}</div>
        <div className="flex justify-end">
          <Button onClick={onClose}>OK</Button>
        </div>
      </Card>
    </div>
  );
};

export default NotificationModal;
