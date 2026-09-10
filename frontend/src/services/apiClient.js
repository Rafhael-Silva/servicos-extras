import axios from 'axios';
import { requestInterceptor } from './interceptors/requestInterceptor';
import {
  responseInterceptor,
  responseErrorInterceptor,
} from './interceptors/responseInterceptor';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  withCredentials: true,
});

apiClient.interceptors.request.use(requestInterceptor);

apiClient.interceptors.response.use(
  responseInterceptor,
  responseErrorInterceptor,
);

export default apiClient;
