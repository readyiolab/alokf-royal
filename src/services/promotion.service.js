// ============================================
// FILE: src/services/promotion.service.js
// Promotion Management Service
// ============================================

import apiService from './api.service';

class PromotionService {
  /**
   * Get all promotions
   */
  async getAllPromotions(token) {
    try {
      const response = await apiService.get('/promotions', token);
      return response;
    } catch (error) {
      console.error('Error fetching promotions:', error);
      throw error;
    }
  }

  /**
   * Get promotion by ID
   */
  async getPromotionById(token, promotionId) {
    try {
      const response = await apiService.get(`/promotions/${promotionId}`, token);
      return response;
    } catch (error) {
      console.error('Error fetching promotion:', error);
      throw error;
    }
  }

  /**
   * Get active promotions for a deposit amount
   */
  async getActivePromotionsForDeposit(token, depositAmount, playerId = null) {
    try {
      let url = `/promotions/active?deposit_amount=${depositAmount}`;
      if (playerId) {
        url += `&player_id=${playerId}`;
      }
      const response = await apiService.get(url, token);
      return response;
    } catch (error) {
      console.error('Error fetching active promotions:', error);
      throw error;
    }
  }

  /**
   * Create new promotion
   */
  async createPromotion(token, promotionData) {
    try {
      const response = await apiService.post('/promotions', promotionData, token);
      return response;
    } catch (error) {
      console.error('Error creating promotion:', error);
      throw error;
    }
  }

  /**
   * Update promotion
   */
  async updatePromotion(token, promotionId, promotionData) {
    try {
      const response = await apiService.put(`/promotions/${promotionId}`, promotionData, token);
      return response;
    } catch (error) {
      console.error('Error updating promotion:', error);
      throw error;
    }
  }

  /**
   * Delete promotion
   */
  async deletePromotion(token, promotionId) {
    try {
      const response = await apiService.delete(`/promotions/${promotionId}`, token);
      return response;
    } catch (error) {
      console.error('Error deleting promotion:', error);
      throw error;
    }
  }
}

export default new PromotionService();

