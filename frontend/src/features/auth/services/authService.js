import apiClient from '../../../services/apiClient';

async function refreshSession() {
  const response = await apiClient.post('/refresh-token');

  return response.data.accessToken;
}

export { refreshSession };
