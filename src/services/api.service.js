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

  // Clear all auth data from localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  sessionStorage.clear();

  // Show notification
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
      animation: slideIn 0.3s ease-out;
    ">
      <strong>Session Expired</strong>
      <span>Redirecting to login…</span>
    </div>
    <style>
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    </style>
  `;
  document.body.appendChild(toast);

  // Immediately redirect to login (no delay)
  window.location.href = '/login';
  
  // Remove toast after 2 seconds
  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
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
  getHeaders(token, isFormData = false) {
    const headers = {};

    // Don't set Content-Type for FormData - browser will set it with boundary
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // ================= CORE REQUEST =================
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = options.token || localStorage.getItem('auth_token');
    const isFormData = options.isFormData || false;

    // Handle FormData vs JSON body
    let body;
    if (isFormData && options.body instanceof FormData) {
      body = options.body; // Use FormData as-is
    } else if (options.body) {
      body = JSON.stringify(options.body);
    }

    const config = {
      method: options.method || 'GET',
      headers: {
        ...this.getHeaders(token, isFormData),
        ...options.headers
      },
      body: body
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

        // 🔒 AUTO LOGOUT on any 401 (Unauthorized) - Token expired or invalid
        if (response.status === 401) {
          handleSessionExpired();
          throw new Error('Session expired. Please login again.');
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

  post(endpoint, data, token = null, isFormData = false) {
    return this.request(endpoint, { method: 'POST', body: data, token, isFormData });
  }

  put(endpoint, data, token = null) {
    return this.request(endpoint, { method: 'PUT', body: data, token });
  }

  delete(endpoint, token = null) {
    return this.request(endpoint, { method: 'DELETE', token });
  }

  // ================= ERROR HANDLER =================
  handleError(error) {
    // Extract error message from various error formats
    // The error from request() is already an Error object with message
    const errorMessage = error.response?.data?.message || 
                        error.data?.message ||
                        error.message || 
                        'An unexpected error occurred';
    const statusCode = error.response?.status || error.statusCode || 500;
    
    // Create a new error with the message and status code
    const err = new Error(errorMessage);
    err.statusCode = statusCode;
    throw err;
  }
}

// ================= EXPORT =================
export default new ApiService();
