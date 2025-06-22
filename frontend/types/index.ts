export interface Supplier {
  product_title: string;
  product_url: string;
  price: string;
  company_name: string;
  company_url: string;
  years_on_alibaba_search_page: string;
  location_search_page: string;
  min_order: string;
  certifications: string[];
  response_rate: string;
}

export interface ApiResponse {
  status: 'success' | 'error';
  data?: Supplier[];
  message?: string;
}

export interface SearchFormData {
  keyword: string;
  max_pages: number;
}