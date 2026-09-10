import sessionManager from '../../features/auth/lifecycle/sessionManager';

export function requestInterceptor(config) {
  const accessToken = sessionManager.getAccessToken();

  if (accessToken) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${accessToken}`,
    };
  }

  return config;
}
