import apiClient from '../../../services/apiClient';
import sessionManager from '../lifecycle/sessionManager';

async function register({
  name,
  email,
  password,
  accountType,
  cpf,
  cnpj,
  termsAccepted,
  birthDate,
}) {
  const response = await apiClient.post('/api/auth/register', {
    name,
    email,
    password,
    accountType,
    cpf,
    cnpj,
    termsAccepted,
    birthDate,
  });

  return response.data.message;
}

async function verifyEmail(verificationToken) {
  const response = await apiClient.post('/api/auth/verify-email', {
    verificationToken,
  });

  sessionManager.setAccessToken(response.data.accessToken);

  return {
    user: response.data.user,
    accessToken: response.data.accessToken,
    message: response.data.message,
  };
}

async function resendCode({ email, type }) {
  const response = await apiClient.post('/api/auth/resend-code', {
    email,
    type,
  });

  return response.data.message;
}

async function verifyCode({ email, code, type }) {
  const response = await apiClient.post('/api/auth/verify-code', {
    email,
    code,
    type,
  });

  return {
    verificationToken: response.data.verificationToken,
    message: response.data.message,
  };
}

async function startLogin({ email, password }) {
  const response = await apiClient.post('/api/auth/start-login', {
    email,
    password,
  });

  return response.data.message;
}

async function finalizeLogin(verificationToken) {
  const response = await apiClient.post('/api/auth/finalize-login', {
    verificationToken,
  });

  sessionManager.setAccessToken(response.data.accessToken);

  return {
    user: response.data.user,
    accessToken: response.data.accessToken,
    message: response.data.message,
  };
}

async function logout() {
  const response = await apiClient.post('/api/auth/logout');

  sessionManager.clearAccessToken();

  return response.data.message;
}

async function refreshSession() {
  const response = await apiClient.post('/api/auth/refresh-token');

  sessionManager.setAccessToken(response.data.accessToken);

  return response.data.accessToken;
}

async function forgotPassword(email) {
  const response = await apiClient.post('/api/auth/forgot-password', { email });

  return response.data.message;
}

async function resetPassword({ verificationToken, newPassword }) {
  const response = await apiClient.post('/api/auth/reset-password', {
    verificationToken,
    newPassword,
  });

  return response.data.message;
}

async function changePassword({ currentPassword, newPassword }) {
  const response = await apiClient.patch('/api/auth/change-password', {
    currentPassword,
    newPassword,
  });

  return response.data.message;
}

async function me() {
  const response = await apiClient.get('/api/auth/me');

  return {
    id: response.data.id,
    name: response.data.name,
    email: response.data.email,
    accountType: response.data.accountType,
    userAge: response.data.userAge,
  };
}

export {
  refreshSession,
  register,
  verifyEmail,
  resendCode,
  verifyCode,
  startLogin,
  finalizeLogin,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
};
