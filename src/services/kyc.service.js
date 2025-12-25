import apiService from './api.service';


class KYCService {
  // Get token from localStorage
  getToken() {
    return localStorage.getItem('auth_token');
  }

  // Initiate DigiLocker KYC
  async initiateDigiLockerKYC(token, playerId) {
    try {
      const response = await apiService.post(
        `/kyc/player/${playerId}/digilocker/initiate`,
        {},
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Fetch Aadhaar data after DigiLocker authorization
  async fetchAadhaarData(token, playerId, sessionId) {
    try {
      const response = await apiService.post(
        `/kyc/player/${playerId}/digilocker/${sessionId}/fetch-aadhaar`,
        {},
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Fetch PAN data (optional)
  async fetchPANData(token, playerId, sessionId) {
    try {
      const response = await apiService.post(
        `/kyc/player/${playerId}/digilocker/${sessionId}/fetch-pan`,
        {},
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Create manual KYC
  async createManualKYC(token, playerId, data) {
    try {
      const response = await apiService.post(
        `/kyc/player/${playerId}/kyc`,
        data,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Get KYC status
  async getKYCStatus(token, playerId) {
    try {
      const response = await apiService.get(
        `/kyc/player/${playerId}/kyc`,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Upload KYC document (with token from storage)
  async uploadKYCDocument(playerId, formData) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await fetch(
        `${apiService.baseURL}/kyc/player/${playerId}/kyc/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error('KYC document upload error:', error);
      throw error;
    }
  }

  // Upload KYC document (with explicit token)
  async uploadDocument(token, playerId, documentType, file) {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('document_type', documentType);

      const response = await fetch(
        `${apiService.baseURL}/kyc/player/${playerId}/kyc/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Submit KYC for review
  async submitKYC(token, playerId) {
    try {
      const response = await apiService.post(
        `/kyc/player/${playerId}/kyc/submit`,
        {},
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Get pending KYCs (Admin only)
  async getPendingKYCs(token, page = 1, limit = 50) {
    try {
      const response = await apiService.get(
        `/kyc/kyc/pending?page=${page}&limit=${limit}`,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Get all KYCs with filters (Admin only)
  async getAllKYCs(token, filters = {}, page = 1, limit = 50) {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        page,
        limit
      }).toString();
      
      const response = await apiService.get(
        `/kyc/kyc/all?${queryParams}`,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Review KYC (Admin only)
  async reviewKYC(token, playerId, action, notes) {
    try {
      const response = await apiService.post(
        `/kyc/player/${playerId}/kyc/review`,
        { action, notes },
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Get KYC statistics (Admin only)
  async getKYCStats(token) {
    try {
      const response = await apiService.get(
        '/kyc/kyc/stats',
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Register device for push notifications
  async registerDevice(token, playerId, deviceData) {
    try {
      const response = await apiService.post(
        `/kyc/player/${playerId}/device`,
        deviceData,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Get player notifications
  async getNotifications(token, playerId, page = 1, limit = 20) {
    try {
      const response = await apiService.get(
        `/kyc/player/${playerId}/notifications?page=${page}&limit=${limit}`,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Mark notification as read
  async markNotificationRead(token, notificationId) {
    try {
      const response = await apiService.put(
        `/kyc/notifications/${notificationId}/read`,
        {},
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Send manual reminder (Admin only)
  async sendManualReminder(token, playerId) {
    try {
      const response = await apiService.post(
        `/kyc/player/${playerId}/kyc/remind`,
        {},
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Get KYC status badge
  getKYCStatusBadge(status) {
    const badges = {
      'not_started': { label: 'Not Started', variant: 'secondary', color: 'gray' },
      'pending': { label: 'Pending', variant: 'default', color: 'yellow' },
      'submitted': { label: 'Submitted', variant: 'default', color: 'blue' },
      'under_review': { label: 'Under Review', variant: 'default', color: 'blue' },
      'approved': { label: 'Approved', variant: 'success', color: 'green' },
      'rejected': { label: 'Rejected', variant: 'destructive', color: 'red' }
    };
    return badges[status] || badges['not_started'];
  }

  // Get KYC method label
  getKYCMethodLabel(method) {
    const labels = {
      'digilocker': '✓ DigiLocker',
      'manual': 'Manual Upload'
    };
    return labels[method] || method;
  }

  // Format document type
  formatDocumentType(type) {
    const labels = {
      'id_front': 'ID Front',
      'id_back': 'ID Back',
      'address_proof': 'Address Proof',
      'photo': 'Photograph'
    };
    return labels[type] || type;
  }

  // Check if KYC is complete
  isKYCComplete(kyc) {
    if (!kyc) return false;
    
    if (kyc.kyc_method === 'digilocker') {
      return kyc.digilocker_verified && kyc.kyc_status === 'approved';
    }
    
    if (kyc.kyc_method === 'manual') {
      return kyc.id_document_front && kyc.photo && kyc.kyc_status === 'approved';
    }
    
    return false;
  }

  // Get pending documents
  getPendingDocuments(kyc) {
    if (!kyc) {
      return ['id_front', 'photo'];
    }

    const pending = [];
    if (!kyc.id_document_front) pending.push('id_front');
    if (!kyc.photo) pending.push('photo');
    if (kyc.kyc_method === 'manual' && !kyc.id_document_back) {
      pending.push('id_back');
    }

    return pending;
  }
}

export default new KYCService();