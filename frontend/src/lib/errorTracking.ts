import axios from 'axios';

interface ErrorPayload {
  error: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
}

export const captureError = async (payload: ErrorPayload) => {
  try {
    const response = await axios.post('/api/v1/errors/frontend', payload);
    return response.data.error_id;
  } catch (error) {
    console.error('Failed to report error:', error);
    // Return a generic ID or undefined if reporting fails
    return 'failed-to-report';
  }
};
