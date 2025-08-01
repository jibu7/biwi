import axiosInstance from '../lib/axiosInstance';

export interface FeedbackRequestCreate {
  request_type: 'feature' | 'modification' | 'improvement' | 'bug_report';
  module?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  attachments?: any[];
}

export interface FeedbackRequestUpdate {
  request_type?: 'feature' | 'modification' | 'improvement' | 'bug_report';
  module?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  title?: string;
  description?: string;
  status?: 'open' | 'in_review' | 'planned' | 'in_progress' | 'completed' | 'rejected';
  assigned_to_user_id?: number;
  estimated_hours?: number;
  actual_hours?: number;
  attachments?: any[];
}

export interface FeedbackRequest {
  id: number;
  company_id: number;
  user_id: number;
  request_type: string;
  module?: string;
  priority: string;
  title: string;
  description: string;
  status: string;
  assigned_to_user_id?: number;
  estimated_hours?: number;
  actual_hours?: number;
  attachments?: any[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
  user_name?: string;
  user_email?: string;
  assigned_to_name?: string;
  comment_count: number;
}

export interface FeedbackComment {
  id: number;
  feedback_request_id: number;
  user_id: number;
  comment: string;
  is_internal: boolean;
  attachments?: any[];
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
}

export interface FeedbackCommentCreate {
  feedback_request_id: number;
  comment: string;
  is_internal?: boolean;
  attachments?: any[];
}

export interface FeedbackListResponse {
  items: FeedbackRequest[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface FeedbackSummary {
  total_requests: number;
  open_requests: number;
  in_review_requests: number;
  planned_requests: number;
  in_progress_requests: number;
  completed_requests: number;
  rejected_requests: number;
  low_priority: number;
  medium_priority: number;
  high_priority: number;
  critical_priority: number;
  feature_requests: number;
  modification_requests: number;
  improvement_requests: number;
  bug_reports: number;
  module_breakdown: Record<string, number>;
}

export interface FeedbackTrend {
  date: string;
  total_created: number;
  total_completed: number;
  total_open: number;
}

export interface FeedbackFilters {
  status?: string[];
  request_type?: string[];
  priority?: string[];
  module?: string[];
  assigned_to_user_id?: number;
  user_id?: number;
  search?: string;
}

class FeedbackService {
  private baseUrl = '/feedback';

  // Feedback Requests
  async createFeedbackRequest(data: FeedbackRequestCreate): Promise<FeedbackRequest> {
    const response = await axiosInstance.post(`${this.baseUrl}/requests`, data);
    return response.data;
  }

  async getFeedbackRequests(params?: {
    skip?: number;
    limit?: number;
    status?: string[];
    request_type?: string[];
    priority?: string[];
    module?: string[];
    assigned_to_user_id?: number;
    user_id?: number;
    search?: string;
    order_by?: string;
    order_direction?: string;
  }): Promise<FeedbackListResponse> {
    const response = await axiosInstance.get(`${this.baseUrl}/requests`, { params });
    return response.data;
  }

  async getFeedbackRequest(id: number): Promise<FeedbackRequest & { comments: FeedbackComment[] }> {
    const response = await axiosInstance.get(`${this.baseUrl}/requests/${id}`);
    return response.data;
  }

  async updateFeedbackRequest(id: number, data: FeedbackRequestUpdate): Promise<FeedbackRequest> {
    const response = await axiosInstance.put(`${this.baseUrl}/requests/${id}`, data);
    return response.data;
  }

  async deleteFeedbackRequest(id: number): Promise<void> {
    await axiosInstance.delete(`${this.baseUrl}/requests/${id}`);
  }

  async assignFeedbackRequest(id: number, assigned_to_user_id?: number): Promise<{ message: string }> {
    const response = await axiosInstance.post(`${this.baseUrl}/requests/${id}/assign`, { assigned_to_user_id });
    return response.data;
  }

  async updateFeedbackStatus(id: number, status: string): Promise<{ message: string }> {
    const response = await axiosInstance.post(`${this.baseUrl}/requests/${id}/status`, { status });
    return response.data;
  }

  // Comments
  async createFeedbackComment(data: Omit<FeedbackCommentCreate, 'feedback_request_id'> & { feedback_request_id: number }): Promise<FeedbackComment> {
    const { feedback_request_id, ...commentData } = data;
    const response = await axiosInstance.post(`${this.baseUrl}/requests/${feedback_request_id}/comments`, {
      ...commentData,
      feedback_request_id,
    });
    return response.data;
  }

  async getFeedbackComments(requestId: number, includeInternal = false): Promise<FeedbackComment[]> {
    const response = await axiosInstance.get(`${this.baseUrl}/requests/${requestId}/comments`, {
      params: { include_internal: includeInternal },
    });
    return response.data;
  }

  // Analytics
  async getFeedbackSummary(): Promise<FeedbackSummary> {
    const response = await axiosInstance.get(`${this.baseUrl}/summary`);
    return response.data;
  }

  async getFeedbackTrends(days = 30): Promise<FeedbackTrend[]> {
    const response = await axiosInstance.get(`${this.baseUrl}/trends`, { params: { days } });
    return response.data;
  }

  // Categories
  async getFeedbackCategories(includeSystem = true): Promise<any[]> {
    const response = await axiosInstance.get(`${this.baseUrl}/categories`, {
      params: { include_system: includeSystem },
    });
    return response.data;
  }

  async createFeedbackCategory(data: any): Promise<any> {
    const response = await axiosInstance.post(`${this.baseUrl}/categories`, data);
    return response.data;
  }
}

export const feedbackService = new FeedbackService();
