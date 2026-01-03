// ============================================
// FILE: pages/admin/PromotionManagement.jsx
// Promotion Management Page - Deposit Bonus System
// ============================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/layouts/AdminLayout';
import promotionService from '../../services/promotion.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Plus,
  Edit,
  Trash2,
  Gift,
  Users,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'sonner';

const PromotionManagement = () => {
  const { token } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [formData, setFormData] = useState({
    promotion_name: '',
    status: 'enabled',
    start_date: null,
    end_date: null,
    user_type: 'all_players',
    player_limit_24h: 0,
    claims_per_user_per_day: 1,
    bonus_tiers: []
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const response = await promotionService.getAllPromotions(token);
      if (response.success) {
        setPromotions(response.data || []);
      } else {
        toast.error(response.message || 'Failed to fetch promotions');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTier = () => {
    setFormData(prev => ({
      ...prev,
      bonus_tiers: [...prev.bonus_tiers, { min_deposit: '', max_deposit: '', flat_bonus_amount: '' }]
    }));
  };

  const handleRemoveTier = (index) => {
    setFormData(prev => ({
      ...prev,
      bonus_tiers: prev.bonus_tiers.filter((_, i) => i !== index)
    }));
  };

  const handleTierChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      bonus_tiers: prev.bonus_tiers.map((tier, i) =>
        i === index ? { ...tier, [field]: value } : tier
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.promotion_name || !formData.start_date || !formData.end_date) {
      toast.error('Please fill all required fields');
      return;
    }

    // Convert dates to ISO string format for backend
    const startDateISO = formData.start_date instanceof Date 
      ? formData.start_date.toISOString() 
      : formData.start_date;
    const endDateISO = formData.end_date instanceof Date 
      ? formData.end_date.toISOString() 
      : formData.end_date;

    if (formData.bonus_tiers.length === 0) {
      toast.error('Please add at least one bonus tier');
      return;
    }

    try {
      const promotionData = {
        ...formData,
        start_date: startDateISO,
        end_date: endDateISO,
        bonus_tiers: formData.bonus_tiers.map(tier => ({
          min_deposit: parseFloat(tier.min_deposit),
          max_deposit: parseFloat(tier.max_deposit),
          flat_bonus_amount: parseFloat(tier.flat_bonus_amount)
        }))
      };

      let response;
      if (editingPromotion) {
        response = await promotionService.updatePromotion(token, editingPromotion.promotion_id, promotionData);
      } else {
        response = await promotionService.createPromotion(token, promotionData);
      }

      if (response.success) {
        toast.success(editingPromotion ? 'Promotion updated' : 'Promotion created');
        setShowCreateDialog(false);
        setEditingPromotion(null);
        resetForm();
        fetchPromotions();
      } else {
        toast.error(response.message || 'Failed to save promotion');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save promotion');
    }
  };

  const handleDelete = async (promotionId) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;

    try {
      const response = await promotionService.deletePromotion(token, promotionId);
      if (response.success) {
        toast.success('Promotion deleted');
        fetchPromotions();
      } else {
        toast.error(response.message || 'Failed to delete promotion');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete promotion');
    }
  };

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      promotion_name: promotion.promotion_name,
      status: promotion.status,
      start_date: new Date(promotion.start_date),
      end_date: new Date(promotion.end_date),
      user_type: promotion.user_type,
      player_limit_24h: promotion.player_limit_24h,
      claims_per_user_per_day: promotion.claims_per_user_per_day,
      bonus_tiers: promotion.bonus_tiers || []
    });
    setShowCreateDialog(true);
  };

  const resetForm = () => {
    setFormData({
      promotion_name: '',
      status: 'enabled',
      start_date: null,
      end_date: null,
      user_type: 'all_players',
      player_limit_24h: 0,
      claims_per_user_per_day: 1,
      bonus_tiers: []
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promotion Management</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage deposit bonus promotions</p>
          </div>
          <Button onClick={() => { resetForm(); setEditingPromotion(null); setShowCreateDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Promotion
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : promotions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No promotions created yet</p>
              <Button className="mt-4" onClick={() => { resetForm(); setShowCreateDialog(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Promotion
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {promotions.map((promotion) => (
              <Card key={promotion.promotion_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle>{promotion.promotion_name}</CardTitle>
                      <Badge variant={promotion.status === 'enabled' ? 'default' : 'secondary'}>
                        {promotion.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(promotion)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(promotion.promotion_id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Period:</span>
                      <span className="ml-2">
                        {new Date(promotion.start_date).toLocaleDateString()} - {new Date(promotion.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Player Limit (24h):</span>
                      <span className="ml-2">{promotion.player_limit_24h || 'Unlimited'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Claims per User/Day:</span>
                      <span className="ml-2">{promotion.claims_per_user_per_day}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Bonus Tiers:</span>
                      <span className="ml-2">{promotion.bonus_tiers?.length || 0}</span>
                    </div>
                  </div>
                  {promotion.bonus_tiers && promotion.bonus_tiers.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Bonus Tiers:</p>
                      <div className="space-y-1">
                        {promotion.bonus_tiers.map((tier, idx) => (
                          <div key={idx} className="text-sm text-gray-600">
                            {formatCurrency(tier.min_deposit)} - {formatCurrency(tier.max_deposit)} → {formatCurrency(tier.flat_bonus_amount)} bonus
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}</DialogTitle>
              <DialogDescription>
                Configure deposit bonus promotion settings and tiers
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Promotion Name *</Label>
                  <Input
                    value={formData.promotion_name}
                    onChange={(e) => setFormData({ ...formData, promotion_name: e.target.value })}
                    placeholder="e.g., New Year Bonus"
                    required
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date *</Label>
                  <DatePicker
                    date={formData.start_date}
                    onDateChange={(date) => setFormData({ ...formData, start_date: date })}
                    placeholder="Select start date"
                  />
                </div>
                <div>
                  <Label>End Date *</Label>
                  <DatePicker
                    date={formData.end_date}
                    onDateChange={(date) => setFormData({ ...formData, end_date: date })}
                    placeholder="Select end date"
                  />
                </div>
              </div>

              <div>
                <Label>User Type</Label>
                <Select
                  value={formData.user_type}
                  onValueChange={(value) => setFormData({ ...formData, user_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_players">All Players</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Player Limit (24 hrs) *</Label>
                  <Input
                    type="number"
                    value={formData.player_limit_24h}
                    onChange={(e) => setFormData({ ...formData, player_limit_24h: parseInt(e.target.value) || 0 })}
                    placeholder="0 = Unlimited"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <Label>Claims per User per Day *</Label>
                  <Input
                    type="number"
                    value={formData.claims_per_user_per_day}
                    onChange={(e) => setFormData({ ...formData, claims_per_user_per_day: parseInt(e.target.value) || 1 })}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Flat Bonus Tiers *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddTier}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Tier
                  </Button>
                </div>
                {formData.bonus_tiers.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center border rounded">
                    No tiers added. Click 'Add Tier' to create deposit range bonuses.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formData.bonus_tiers.map((tier, index) => (
                      <div key={index} className="grid grid-cols-4 gap-2 items-end p-3 border rounded">
                        <div>
                          <Label className="text-xs">Min Deposit</Label>
                          <Input
                            type="number"
                            value={tier.min_deposit}
                            onChange={(e) => handleTierChange(index, 'min_deposit', e.target.value)}
                            placeholder="10000"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max Deposit</Label>
                          <Input
                            type="number"
                            value={tier.max_deposit}
                            onChange={(e) => handleTierChange(index, 'max_deposit', e.target.value)}
                            placeholder="25000"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Flat Bonus</Label>
                          <Input
                            type="number"
                            value={tier.flat_bonus_amount}
                            onChange={(e) => handleTierChange(index, 'flat_bonus_amount', e.target.value)}
                            placeholder="3000"
                            required
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveTier(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPromotion ? 'Update' : 'Create'} Promotion
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default PromotionManagement;

