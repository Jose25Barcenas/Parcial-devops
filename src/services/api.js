const API_BASE = '/api/v1';

export function getStoredToken() {
  try {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  } catch {
    return null;
  }
}

export function getStoredUser() {
  try {
    return localStorage.getItem('user') || sessionStorage.getItem('user');
  } catch {
    return null;
  }
}

export function storeSession(token, user, remember = true) {
  clearSession();
  try {
    const store = remember ? localStorage : sessionStorage;
    store.setItem('token', token);
    store.setItem('user', JSON.stringify(user));
  } catch {
    // almacenamiento no disponible (modo privado/cuota): la sesion vive en memoria
  }
}

export function clearSession() {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  } catch {
    // almacenamiento no disponible
  }
}

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const { headers: optionHeaders, ...rest } = options;
  const config = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...optionHeaders,
    },
  };

  // Remove Content-Type for FormData (browser sets it automatically with boundary)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, config);
  } catch {
    throw new Error('Error de conexion con el servidor');
  }

  if (response.status === 401) {
    if (token) {
      clearSession();
      window.location.href = '/';
      throw new Error('Sesion expirada');
    }
    const error = await response.json().catch(() => ({}));
    const err = new Error(error.message || 'Credenciales invalidas');
    err.status = 401;
    throw err;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const firstFieldError = error.errors ? Object.values(error.errors)[0] : null;
    const err = new Error(error.message || firstFieldError || 'Error del servidor');
    err.status = response.status;
    err.errors = error.errors;
    throw err;
  }

  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  get: (url) => request(url),
  post: (url, data) => request(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url, data) => request(url, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (url, data) => request(url, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (url) => request(url, { method: 'DELETE' }),
  upload: (url, formData) => request(url, { method: 'POST', body: formData }),
  uploadPatch: (url, formData) => request(url, { method: 'PATCH', body: formData }),
};
