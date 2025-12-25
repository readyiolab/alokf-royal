// ============================================
// FILE: services/apiService.js
// Safe API service with proper session handling
// ============================================

// ================= API BASE URL =================
const API_BASE_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://royalflush.red/api';

// ================= SESSION EXPIRE HANDLER =================
let sessionExpiredHandled = false;

const handleSessionExpired = () => {
  if (sessionExpiredHandled) return;
  sessionExpiredHandled = true;

  // Clear auth data
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');

  // Toast
  const toast = document.createElement('div');
  toast.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 99999;
      display: flex;
      gap: 12px;
      font-family: system-ui;
    ">
      <strong>Session Expired</strong>
      <span>Redirecting to login…</span>
    </div>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    window.location.href = '/login';
  }, 2000);
};

// ================= API SERVICE =================
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;

    // Public endpoints (NO auto logout)
    this.publicEndpoints = [
      '/login',
      '/signup',
      '/send-otp',
      '/verify-otp',
      '/forgot-password',
      '/reset-password'
    ];
  }

  // ================= HEADERS =================
  getHeaders(token) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // ================= CORE REQUEST =================
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = options.token || localStorage.getItem('auth_token');

    const config = {
      method: options.method || 'GET',
      headers: {
        ...this.getHeaders(token),
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `HTTP ${response.status}`;

        // 🔒 NEVER logout on public endpoints
        if (this.publicEndpoints.some(ep => endpoint.includes(ep))) {
          throw new Error(errorMessage);
        }

        // 🔒 ONLY real auth failures trigger logout
        const isAuthExpired =
          response.status === 401 &&
          (
            errorMessage.toLowerCase().includes('jwt') ||
            errorMessage.toLowerCase().includes('unauthorized') ||
            errorMessage.toLowerCase().includes('session expired')
          );

        if (isAuthExpired) {
          handleSessionExpired();
          throw new Error('Session expired');
        }

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // ================= HTTP METHODS =================
  get(endpoint, token = null) {
    return this.request(endpoint, { method: 'GET', token });
  }

  post(endpoint, data, token = null) {
    return this.request(endpoint, { method: 'POST', body: data, token });
  }

  put(endpoint, data, token = null) {
    return this.request(endpoint, { method: 'PUT', body: data, token });
  }

  delete(endpoint, token = null) {
    return this.request(endpoint, { method: 'DELETE', token });
  }
}

// ================= EXPORT =================
export default new ApiService();
