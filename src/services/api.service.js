const API_BASE_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://royalflush.red/api';


// Session expiry handler - will show toast and redirect
let sessionExpiredHandled = false;

const handleSessionExpired = () => {
  if (sessionExpiredHandled) return; // Prevent multiple redirects
  sessionExpiredHandled = true;
  
  // Clear auth data
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  
  // Create and show toast notification
  const toast = document.createElement('div');
  toast.id = 'session-expired-toast';
  toast.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideIn 0.3s ease-out;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div>
        <p style="font-weight: 600; margin: 0;">Session Expired</p>
        <p style="font-size: 14px; opacity: 0.9; margin: 4px 0 0 0;">Redirecting to login...</p>
      </div>
    </div>
    <style>
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>
  `;
  document.body.appendChild(toast);
  
  // Redirect after showing message
  setTimeout(() => {
    sessionExpiredHandled = false;
    window.location.href = '/login';
  }, 2000);
};

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get authorization headers
  getAuthHeaders(token) {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Generic request handler
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(options.token),
        ...options.headers
      }
    };

    // Remove token from config after using it
    delete config.token;

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errorMessage = error.message || `HTTP ${response.status}: ${response.statusText}`;
        
        // Handle session expiry (401 Unauthorized)
        if (response.status === 401 || 
            errorMessage.toLowerCase().includes('invalid') && errorMessage.toLowerCase().includes('session') ||
            errorMessage.toLowerCase().includes('expired') ||
            errorMessage.toLowerCase().includes('token') ||
            errorMessage.toLowerCase().includes('please login')) {
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

  // GET request
  async get(endpoint, token = null) {
    return this.request(endpoint, {
      method: 'GET',
      token
    });
  }

  // POST request
  async post(endpoint, data, token = null) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      token
    });
  }

  // PUT request
  async put(endpoint, data, token = null) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      token
    });
  }

  // DELETE request
  async delete(endpoint, token = null) {
    return this.request(endpoint, {
      method: 'DELETE',
      token
    });
  }

  // Handle API errors
  handleError(error) {
    console.error('API Error:', error);
    
    if (error.message.includes('401') || 
        error.message.toLowerCase().includes('session') ||
        error.message.toLowerCase().includes('expired') ||
        error.message.toLowerCase().includes('token')) {
      handleSessionExpired();
      return;
    }

    if (error.message.includes('403')) {
      throw new Error('You do not have permission to perform this action');
    }

    if (error.message.includes('404')) {
      throw new Error('Resource not found');
    }

    if (error.message.includes('500')) {
      throw new Error('Server error. Please try again later');
    }

    throw error;
  }
}

export default new ApiService();  