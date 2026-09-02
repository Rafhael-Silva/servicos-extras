import axios from 'axios';
import {
  responseInterceptor,
  responseErrorInterceptor,
} from './interceptors/responseInterceptor';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  responseInterceptor,
  responseErrorInterceptor,
);

export default apiClient;
