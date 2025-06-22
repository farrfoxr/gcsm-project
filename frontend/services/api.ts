import { ApiResponse, SearchFormData } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

export class ApiService {
  static async searchSuppliers(data: SearchFormData): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: data.keyword,
          max_pages: data.max_pages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      return result;
    } catch (error) {
      console.error('API call failed:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch('http://127.0.0.1:5000/health');
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}