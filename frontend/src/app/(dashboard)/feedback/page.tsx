'use client';

import { FeedbackDashboard } from '../../../components/feedback';

export default function FeedbackPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Feedback Management</h1>
      <FeedbackDashboard />
    </div>
  );
}
