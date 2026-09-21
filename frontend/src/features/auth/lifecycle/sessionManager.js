let accessToken = null;

const sessionManager = {
  setAccessToken(token) {
    accessToken = token;
  },

  getAccessToken() {
    return accessToken;
  },

  clearAccessToken() {
    accessToken = null;
  },

  getTokenStatus(token) {
    if (!token) {
      return null;
    }

    try {
      const parts = token.split('.');
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = atob(base64);
      const decoded = JSON.parse(payload);
      const exp = decoded.exp;
      if (typeof exp !== 'number') {
        return null;
      }
      const expiration = exp * 1000;

      if (!Number.isFinite(expiration)) {
        return null;
      }

      const timeLeft = expiration - Date.now();

      const expired = timeLeft <= 0 ? true : false;

      return {
        expiration,
        timeLeft,
        expired,
      };
    } catch {
      return null;
    }
  },
};

export default sessionManager;
