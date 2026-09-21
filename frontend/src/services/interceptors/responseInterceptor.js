export function responseInterceptor(response) {
  return response;
}

export function responseErrorInterceptor(error) {
  if (!error.response) {
    error.message = 'Não foi possível conectar ao servidor.';
    return Promise.reject(error);
  }

  return Promise.reject(error);
}
