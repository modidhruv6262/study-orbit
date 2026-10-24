const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const apiClient = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token) => localStorage.setItem('token', token),
  clearToken: () => localStorage.removeItem('token'),

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const isUpload = (options.body instanceof FormData) || endpoint.includes('/upload');
    const defaultTimeout = isUpload ? 180000 : 60000; // 3 min for uploads/PDF extraction, 60s for standard (handles Render cold-starts)
    const timeoutDuration = options.timeoutMs || defaultTimeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

    let response;
    try {
      response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        if (isUpload) {
          throw new Error('Upload & PDF processing took longer than expected. Please verify your connection or try a smaller PDF file.');
        }
        throw new Error('The server took longer than expected to respond. The backend may be waking up from sleep (~30-50s on free hosting). Please wait a moment and try again!');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status === 401) {
      let errorMsg = 'Session expired, please login again';
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorData.message || errorMsg;
      } catch (e) {}

      if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        this.clearToken();
        window.dispatchEvent(new Event('auth-expired'));
      }
      throw new Error(errorMsg);
    }

    if (!response.ok) {
      let errorMsg = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorData.message || errorMsg;
      } catch (e) {
        errorMsg = response.statusText;
      }
      throw new Error(errorMsg);
    }

    // Check if response is json or text (e.g. .ics)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  upload(endpoint, formData, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      ...options,
    });
  },
};
