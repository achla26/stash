export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface HttpClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body?: unknown): Promise<T>;
  patch<T>(url: string, body?: unknown): Promise<T>;
  delete<T>(url: string): Promise<T>;
}