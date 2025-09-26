
import React, { useState } from 'react';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';

interface SendSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => Promise<void>;
  recipientCount: number;
}

const SendSmsModal: React.FC<SendSmsModalProps> = ({ isOpen, onClose, onSend, recipientCount }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const maxChars = 160;

  if (!isOpen) {
    return null;
  }

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    await onSend(message);
    setIsSending(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      aria-modal="true"
      role="dialog"
    >
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold text-text-primary-dark mb-2">Send SMS to Parents</h2>
        <p className="text-text-secondary-dark mb-4">
          This message will be sent to the parents of <strong>{recipientCount}</strong> selected student(s).
        </p>
        
        <div className="space-y-4">
          <div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              maxLength={maxChars}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-text-primary-dark placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
              placeholder="Type your message here..."
              disabled={isSending}
            />
            <p className="text-right text-sm text-text-secondary-dark mt-1">
              {message.length} / {maxChars}
            </p>
          </div>
          <div className="flex justify-end gap-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={isSending || !message.trim()}>
              {isSending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SendSmsModal;
