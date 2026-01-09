// src/components/cashier/ReversalDetailsModal.jsx
// Reversal Details Modal Component

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, RotateCw } from 'lucide-react';
import { format } from 'date-fns';

const ReversalDetailsModal = ({ isOpen, onClose, reversal, originalTransaction }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(Math.abs(amount || 0));
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'cashbook':
        return 'Cashbook';
      case 'chip_ledger':
        return 'Chip Ledger';
      case 'credit_register':
        return 'Credit Register';
      case 'house_player':
        return 'House Player';
      case 'credit_limit':
        return 'Credit Limit';
      default:
        return 'Other';
    }
  };

  if (!reversal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Reversal Details</DialogTitle>
              <DialogDescription>Full audit trail for this reversal</DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Reversal Entry */}
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <h3 className="font-semibold text-red-900 mb-3">Reversal Entry</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium text-gray-900">
                  {getCategoryLabel(reversal.category)}
                </span>
              </div>
              {reversal.player_name && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Player:</span>
                  <span className="font-medium text-gray-900">{reversal.player_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Reversed By:</span>
                <span className="font-bold text-gray-900">
                  {reversal.reversed_by_name || reversal.reversed_by_username || `Cashier #${reversal.created_by || 0}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date/Time:</span>
                <span className="font-medium text-gray-900">
                  {formatDateTime(reversal.created_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-gray-900 text-lg">
                  {formatCurrency(reversal.amount || reversal.chips_amount || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Reversal Reason */}
          <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
            <h3 className="font-semibold text-orange-900 mb-3">Reversal Reason</h3>
            <p className="text-sm text-gray-700">
              {reversal.reversal_reason || 'No reason provided'}
            </p>
          </div>

          {/* Original Transaction */}
          {originalTransaction && (
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">
                Original Transaction #{originalTransaction.transaction_id}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900">
                    {(originalTransaction.transaction_type || '').toUpperCase().replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(originalTransaction.created_at)}
                  </span>
                </div>
                {originalTransaction.amount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(originalTransaction.amount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReversalDetailsModal;

