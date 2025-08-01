'use client';

import { useState, useEffect } from 'react';
import { 
  MessageSquare, Filter, Search, Eye, Edit, Trash2, 
  Clock, CheckCircle, XCircle, AlertCircle, User, Calendar,
  TrendingUp, BarChart3, Users, MessageCircle
} from 'lucide-react';
import { feedbackService, FeedbackRequest, FeedbackSummary, FeedbackTrend } from '../../services/feedbackService';
import { toast } from 'sonner';

interface FeedbackDashboardProps {
  className?: string;
}

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  planned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
} as const;

const PRIORITY_COLORS = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  critical: 'text-red-600',
} as const;

const TYPE_ICONS = {
  feature: '✨',
  modification: '🔧',
  improvement: '📈',
  bug_report: '🐛',
} as const;

export const FeedbackDashboard = ({ className = '' }: FeedbackDashboardProps) => {
  const [feedbackRequests, setFeedbackRequests] = useState<FeedbackRequest[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [trends, setTrends] = useState<FeedbackTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<FeedbackRequest | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    type: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadData();
  }, [page, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load feedback requests
      const params: any = {
        skip: (page - 1) * 20,
        limit: 20,
      };

      if (filters.status) params.status = [filters.status];
      if (filters.priority) params.priority = [filters.priority];
      if (filters.type) params.request_type = [filters.type];
      if (filters.search) params.search = filters.search;

      const [requestsResponse, summaryData, trendsData] = await Promise.all([
        feedbackService.getFeedbackRequests(params),
        feedbackService.getFeedbackSummary(),
        feedbackService.getFeedbackTrends(30),
      ]);

      setFeedbackRequests(requestsResponse.items);
      setTotalPages(requestsResponse.total_pages);
      setSummary(summaryData);
      setTrends(trendsData);
    } catch (error: any) {
      console.error('Error loading feedback data:', error);
      toast.error('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: number, newStatus: string) => {
    try {
      await feedbackService.updateFeedbackStatus(requestId, newStatus);
      toast.success('Status updated successfully');
      loadData();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !feedbackRequests.length) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback Management</h1>
          <p className="text-gray-600">Manage user feedback and feature requests</p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_requests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Open</p>
                <p className="text-2xl font-bold text-gray-900">{summary.open_requests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{summary.in_progress_requests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{summary.completed_requests}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search requests..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="feature">Feature Request</option>
              <option value="modification">Modification</option>
              <option value="improvement">Improvement</option>
              <option value="bug_report">Bug Report</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback Requests Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Feedback Requests</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feedbackRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">
                        {TYPE_ICONS[request.request_type as keyof typeof TYPE_ICONS]}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.module && (
                            <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-2">
                              {request.module}
                            </span>
                          )}
                          {request.request_type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm text-gray-900">{request.user_name}</div>
                        <div className="text-sm text-gray-500">{request.user_email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={request.status}
                      onChange={(e) => handleStatusUpdate(request.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${
                        STATUS_COLORS[request.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="open">Open</option>
                      <option value="in_review">In Review</option>
                      <option value="planned">Planned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      PRIORITY_COLORS[request.priority as keyof typeof PRIORITY_COLORS] || 'text-gray-600'
                    }`}>
                      {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(request.created_at)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <span className="flex items-center text-gray-500">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {request.comment_count}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <FeedbackRequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
};

// Request Details Modal Component
interface FeedbackRequestModalProps {
  request: FeedbackRequest;
  onClose: () => void;
  onUpdate: () => void;
}

const FeedbackRequestModal = ({ request, onClose, onUpdate }: FeedbackRequestModalProps) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [request.id]);

  const loadComments = async () => {
    try {
      const commentsData = await feedbackService.getFeedbackComments(request.id, true);
      setComments(commentsData);
    } catch (error: any) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setLoading(true);
      await feedbackService.createFeedbackComment({
        feedback_request_id: request.id,
        comment: newComment,
        is_internal: true,
      });
      setNewComment('');
      toast.success('Comment added successfully');
      loadComments();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Feedback Request Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Request Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">{request.title}</h3>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <span>By {request.user_name}</span>
              <span>•</span>
              <span>{formatDate(request.created_at)}</span>
              <span>•</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]
              }`}>
                {request.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Description</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
          </div>

          {/* Comments */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Internal Comments</h4>
            <div className="space-y-4 mb-4">
              {comments.map((comment: any) => (
                <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{comment.user_name}</span>
                    <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-gray-700">{comment.comment}</p>
                </div>
              ))}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add an internal comment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Comment'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
