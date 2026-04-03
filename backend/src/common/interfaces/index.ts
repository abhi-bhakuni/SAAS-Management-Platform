export interface IResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
  error?: any;
}

export interface IPaginationOptions {
  page: number;
  limit: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
