import sessionManager from './sessionManager';
import { refreshSession } from '../services/authService';
import { REFRESH_BEFORE_EXPIRATION } from '../../../constants/constants';

let refreshPromise = null;

async function initialize() {
  const currentAccessToken = sessionManager.getAccessToken();

  if (!currentAccessToken) {
    const newAccessToken = await refreshSession();

    return newAccessToken;
  }

  return currentAccessToken;
}

async function checkAndRefreshSession() {
  const currentAccessToken = sessionManager.getAccessToken();

  const statusAccessToken = sessionManager.getTokenStatus(currentAccessToken);

  if (!statusAccessToken) {
    return;
  }

  if (statusAccessToken.timeLeft <= REFRESH_BEFORE_EXPIRATION) {
    if (refreshPromise) {
      return await refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const newAccessToken = await refreshSession();

        return newAccessToken;
      } finally {
        refreshPromise = null;
      }
    })();

    return await refreshPromise;
  }

  return currentAccessToken;
}

export { initialize, checkAndRefreshSession };
