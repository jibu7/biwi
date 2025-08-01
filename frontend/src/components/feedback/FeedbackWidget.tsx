'use client';

import { useState } from 'react';
import { MessageSquarePlus, X } from 'lucide-react';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';

interface FeedbackWidgetProps {
  className?: string;
}

export const FeedbackWidget = ({ className = '' }: FeedbackWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating feedback button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 
          bg-blue-600 hover:bg-blue-700 
          text-white 
          p-4 rounded-full 
          shadow-lg hover:shadow-xl 
          transition-all duration-200 
          z-50
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${className}
        `}
        title="Send Feedback"
        aria-label="Send Feedback"
      >
        <MessageSquarePlus size={24} />
      </button>

      {/* Feedback modal */}
      {isOpen && (
        <FeedbackModal 
          isOpen={isOpen}
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
};
