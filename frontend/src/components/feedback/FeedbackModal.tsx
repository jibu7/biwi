'use client';

import { useState, useEffect } from 'react';
import { X, Send, Upload, Loader2 } from 'lucide-react';
import { feedbackService } from '../../services/feedbackService';
import { toast } from 'sonner';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface FeedbackFormData {
  request_type: 'feature' | 'modification' | 'improvement' | 'bug_report';
  module?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  attachments?: any[];
}

const REQUEST_TYPES = [
  { value: 'feature', label: 'Feature Request', description: 'Request a new feature' },
  { value: 'modification', label: 'Modification', description: 'Modify existing functionality' },
  { value: 'improvement', label: 'Improvement', description: 'Enhance existing features' },
  { value: 'bug_report', label: 'Bug Report', description: 'Report a problem or error' },
] as const;

const MODULES = [
  { value: 'GL', label: 'General Ledger' },
  { value: 'AR', label: 'Accounts Receivable' },
  { value: 'AP', label: 'Accounts Payable' },
  { value: 'Inventory', label: 'Inventory Management' },
  { value: 'POS', label: 'Point of Sale' },
  { value: 'Order Entry', label: 'Order Entry' },
  { value: 'BOM', label: 'Bill of Materials' },
  { value: 'Reporting', label: 'Reporting' },
  { value: 'Platform', label: 'Platform/System' },
  { value: 'Other', label: 'Other' },
] as const;

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-green-600 bg-green-50' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-50' },
  { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-50' },
  { value: 'critical', label: 'Critical', color: 'text-red-600 bg-red-50' },
] as const;

export const FeedbackModal = ({ isOpen, onClose }: FeedbackModalProps) => {
  const [formData, setFormData] = useState<FeedbackFormData>({
    request_type: 'feature',
    module: undefined,
    priority: 'medium',
    title: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        request_type: 'feature',
        module: undefined,
        priority: 'medium',
        title: '',
        description: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 5000) {
      newErrors.description = 'Description must be less than 5000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await feedbackService.createFeedbackRequest(formData);
      toast.success('Feedback submitted successfully!');
      onClose();
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast.error(error.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FeedbackFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Send Feedback</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Request Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Request Type *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {REQUEST_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`
                    relative flex flex-col p-4 border rounded-lg cursor-pointer
                    ${formData.request_type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="request_type"
                    value={type.value}
                    checked={formData.request_type === type.value}
                    onChange={(e) => handleInputChange('request_type', e.target.value)}
                    className="sr-only"
                  />
                  <span className="font-medium text-sm">{type.label}</span>
                  <span className="text-xs text-gray-600 mt-1">{type.description}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Module */}
          <div>
            <label htmlFor="module" className="block text-sm font-medium text-gray-700 mb-2">
              Module (Optional)
            </label>
            <select
              id="module"
              value={formData.module || ''}
              onChange={(e) => handleInputChange('module', e.target.value || undefined)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a module...</option>
              {MODULES.map((module) => (
                <option key={module.value} value={module.value}>
                  {module.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Priority *
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((priority) => (
                <label
                  key={priority.value}
                  className={`
                    flex items-center px-3 py-2 rounded-md cursor-pointer border
                    ${formData.priority === priority.value
                      ? `${priority.color} border-current`
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={priority.value}
                    checked={formData.priority === priority.value}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{priority.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Brief description of your request..."
              className={`
                block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                ${errors.title ? 'border-red-300' : 'border-gray-300'}
              `}
              maxLength={200}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">{formData.title.length}/200 characters</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Please provide detailed information about your request..."
              rows={6}
              className={`
                block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                ${errors.description ? 'border-red-300' : 'border-gray-300'}
              `}
              maxLength={5000}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">{formData.description.length}/5000 characters</p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

