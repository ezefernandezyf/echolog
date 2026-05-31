import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';

const DEFAULT_API_BASE_URL = '/api';

const resolveApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  return {
    ...config,
    withCredentials: true,
  };
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      return Promise.reject(normalizeApiError(error));
    }

    return Promise.reject(error);
  },
);

export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

interface ApiErrorBody {
  message?: string;
  error?: string;
  details?: unknown;
}

export interface ApiRequestConfig<TBody = unknown> extends Omit<
  AxiosRequestConfig<TBody>,
  'baseURL' | 'data' | 'method' | 'withCredentials'
> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: TBody;
}

function normalizeApiError(error: AxiosError<ApiErrorBody>): ApiError {
  return {
    message: error.response?.data?.message ?? error.response?.data?.error ?? error.message,
    status: error.response?.status,
    details: error.response?.data?.details ?? error.response?.data,
  };
}

export async function fetchJson<TResponse, TBody = unknown>(
  config: ApiRequestConfig<TBody>,
): Promise<TResponse> {
  const response = await apiClient.request<TResponse, AxiosResponse<TResponse>, TBody>({
    ...config,
    method: config.method ?? 'GET',
  });

  return response.data;
}

export function createFetcher<TResponse, TBody>(
  method: ApiRequestConfig<TBody>['method'],
  url: string,
) {
  return (data: TBody) => {
    return fetchJson<TResponse, TBody>({
      url,
      method,
      data,
    });
  };
}

export function createVoidFetcher<TResponse>(method: ApiRequestConfig['method'], url: string) {
  return () => {
    return fetchJson<TResponse, void>({
      url,
      method,
    });
  };
}

export { apiClient };
