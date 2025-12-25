import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, AlertCircle, Badge, Activity, CreditCard, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge as BadgeComponent } from '@/components/ui/badge';
import playerService from '../../services/player.service';
import { useAuth } from '../../hooks/useAuth';

export const PlayerDetails = ({ player, isOpen, onClose, onEdit, onPlayerUpdated }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [creditLimit, setCreditLimit] = useState('');
  const [savingLimit, setSavingLimit] = useState(false);
  const [limitError, setLimitError] = useState('');
  const [limitSuccess, setLimitSuccess] = useState(false);

  const canSetCreditLimit = user?.role === 'admin' || user?.role === 'cashier';

  useEffect(() => {
    if (isOpen && player?.player_id) {
      fetchPlayerStats();
      setCreditLimit(player.credit_limit_personal || player.credit_limit || '');
      setLimitError('');
      setLimitSuccess(false);
    }
  }, [isOpen, player?.player_id]);

  useEffect(() => {
    if (showLimitDialog) {
      setCreditLimit(player?.credit_limit_personal || player?.credit_limit || '');
      setLimitError('');
      setLimitSuccess(false);
    }
  }, [showLimitDialog]);

  const fetchPlayerStats = async () => {
    try {
      setLoading(true);
      const response = await playerService.getPlayerStats(player.player_id);
      if (response?.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch player stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetCreditLimit = async () => {
    try {
      setSavingLimit(true);
      setLimitError('');
      
      const limitValue = parseFloat(creditLimit) || 0;
      await playerService.setPlayerCreditLimit(player.player_id, limitValue);
      
      setLimitSuccess(true);
      setTimeout(() => {
        setShowLimitDialog(false);
        setLimitSuccess(false);
        if (onPlayerUpdated) {
          onPlayerUpdated({ ...player, credit_limit_personal: limitValue });
        }
      }, 1000);
    } catch (error) {
      setLimitError(error.response?.data?.message || 'Failed to set credit limit');
    } finally {
      setSavingLimit(false);
    }
  };

  if (!player) return null;

  const getStatusColor = (isActive, isBlacklisted) => {
    if (isBlacklisted) return 'destructive';
    if (!isActive) return 'secondary';
    return 'default';
  };

  const getStatusLabel = (isActive, isBlacklisted) => {
    if (isBlacklisted) return '🚫 Blacklisted';
    if (!isActive) return '⭕ Inactive';
    return '✅ Active';
  };

  const formatCurrency = (value) => {
    return `₹${parseFloat(value || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-t-lg border-b">
          <div className="flex items-center gap-4 justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-200 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-blue-700" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {player.player_name}
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  ID: {player.player_code}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status & Type */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-2 flex-wrap">
              <BadgeComponent variant={getStatusColor(player.is_active, player.is_blacklisted)}>
                {getStatusLabel(player.is_active, player.is_blacklisted)}
              </BadgeComponent>
              <BadgeComponent variant="outline">
                {player.player_type?.charAt(0).toUpperCase() + player.player_type?.slice(1)}
              </BadgeComponent>
            </div>
          </div>

          {/* Blacklist Warning */}
          {player.is_blacklisted && (
            <Alert variant="destructive">
              <AlertCircle className="w-5 h-5" />
              <AlertDescription>
                <p className="font-semibold">This player is blacklisted</p>
                {player.blacklist_reason && (
                  <p className="text-sm mt-1">{player.blacklist_reason}</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {player.phone_number && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Phone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-600 font-medium">Phone</p>
                    <p className="text-sm font-semibold text-gray-900 break-all">
                      {player.phone_number}
                    </p>
                  </div>
                </div>
              )}
              {player.email && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-600 font-medium">Email</p>
                    <p className="text-sm font-semibold text-gray-900 break-all">
                      {player.email}
                    </p>
                  </div>
                </div>
              )}
              {player.address && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-600 font-medium">Address</p>
                    <p className="text-sm font-semibold text-gray-900">{player.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Activity
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 font-medium mb-1">Joined</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatDate(player.created_at)}
                </p>
              </div>
              {player.last_visit_date && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium mb-1">Last Visit</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(player.last_visit_date)}
                  </p>
                </div>
              )}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 font-medium mb-1">Total Visits</p>
                <p className="text-lg font-bold text-gray-900">{player.visit_count || 0}</p>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">
              Financial Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs text-green-700 font-medium mb-1">Total Buy-ins</p>
                <p className="text-sm font-bold text-green-900">
                  {formatCurrency(player.total_buy_ins)}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-700 font-medium mb-1">Total Payouts</p>
                <p className="text-sm font-bold text-blue-900">
                  {formatCurrency(player.total_cash_outs)}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-xs text-amber-700 font-medium mb-1">Outstanding</p>
                <p className="text-sm font-bold text-amber-900">
                  {formatCurrency(player.outstanding_credit)}
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-purple-600" />
                    <p className="text-xs text-purple-700 font-medium">Credit Limit</p>
                  </div>
                  {canSetCreditLimit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs text-purple-700 hover:bg-purple-100"
                      onClick={() => setShowLimitDialog(true)}
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Set
                    </Button>
                  )}
                </div>
                <p className="text-lg font-bold text-purple-900">
                  {formatCurrency(player.credit_limit_personal || player.credit_limit)}
                </p>
                {parseFloat(player.credit_limit_personal || player.credit_limit || 0) === 0 && (
                  <p className="text-xs text-purple-600 mt-1">No credit allowed</p>
                )}
              </div>
            </div>
          </div>

          {/* Credit Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">
              Credit Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-xs text-indigo-700 font-medium mb-1">Issued</p>
                <p className="text-sm font-bold text-indigo-900">
                  {formatCurrency(player.total_credits_issued)}
                </p>
              </div>
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <p className="text-xs text-cyan-700 font-medium mb-1">Settled</p>
                <p className="text-sm font-bold text-cyan-900">
                  {formatCurrency(player.total_credits_settled)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {player.notes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">Notes</p>
              <p className="text-sm text-blue-800">{player.notes}</p>
            </div>
          )}

          {/* KYC Status */}
          {player.kyc_status && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">KYC Status</p>
              <BadgeComponent variant={player.kyc_status === 'verified' ? 'default' : 'secondary'}>
                {player.kyc_status?.replace('_', ' ').toUpperCase()}
              </BadgeComponent>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            {onEdit && (
              <Button
                onClick={() => {
                  onEdit(player);
                  onClose();
                }}
                className="flex-1"
              >
                ✎ Edit Player
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Set Credit Limit Dialog */}
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              Set Credit Limit
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="text-sm text-gray-600">
              Setting credit limit for <span className="font-semibold text-gray-900">{player.player_name}</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="creditLimit">Credit Limit (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <Input
                  id="creditLimit"
                  type="number"
                  min="0"
                  step="100"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="pl-8"
                  placeholder="Enter credit limit"
                />
              </div>
              <p className="text-xs text-gray-500">
                Set to 0 to disable credit for this player
              </p>
            </div>

            {limitError && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{limitError}</AlertDescription>
              </Alert>
            )}

            {limitSuccess && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  ✓ Credit limit updated successfully!
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowLimitDialog(false)}
              className="flex-1"
              disabled={savingLimit}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetCreditLimit}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={savingLimit || limitSuccess}
            >
              {savingLimit ? 'Saving...' : 'Set Limit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default PlayerDetails;