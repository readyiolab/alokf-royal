// components/cashier/ViewFloatModal.jsx
// View all float additions for current session

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import cashierService from '../../services/cashier.service';
import { useSession } from '../../contexts/Sessioncontext'; // ✅ FIXED: Using context version

const ViewFloatModal = ({ open, onOpenChange }) => {
  const { session } = useSession();
  const [floatHistory, setFloatHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ FIXED: Check for null/undefined explicitly since session_id can be 0
    if (open && session?.session_id !== null && session?.session_id !== undefined) {
      fetchFloatHistory();
    }
  }, [open, session?.session_id]);

  const fetchFloatHistory = async () => {
    try {
      setLoading(true);
      const response = await cashierService.getFloatHistoryBySession(session.session_id);
      // Handle response structure: {success: true, data: []} or direct array
      if (response?.success && Array.isArray(response.data)) {
        setFloatHistory(response.data);
      } else if (Array.isArray(response?.data)) {
        setFloatHistory(response.data);
      } else if (Array.isArray(response)) {
        setFloatHistory(response);
      } else {
        setFloatHistory([]);
      }
    } catch (error) {
      console.error('Error fetching float history:', error);
      setFloatHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  const formatChipBreakdown = (entry) => {
    const chips = [];
    if (entry.chips_100 > 0) chips.push(`${entry.chips_100}×₹100`);
    if (entry.chips_500 > 0) chips.push(`${entry.chips_500}×₹500`);
    if (entry.chips_5000 > 0) chips.push(`${entry.chips_5000}×₹5K`);
    if (entry.chips_10000 > 0) chips.push(`${entry.chips_10000}×₹10K`);
    return chips.length > 0 ? chips.join(', ') : 'No chips';
  };

  const totalFloat = floatHistory.reduce((sum, entry) => sum + parseFloat(entry.amount || entry.float_amount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">View Float History</div>
              <div className="text-sm font-normal text-gray-500">
                All float additions for today's session
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="ml-auto p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Float Added</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(totalFloat)}</span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {floatHistory.length} addition{floatHistory.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* List */}
          <ScrollArea className="h-[400px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading...</div>
              </div>
            ) : floatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mb-2 opacity-50" />
                <div className="text-sm">No float additions found</div>
              </div>
            ) : (
              <div className="space-y-3">
                {floatHistory.map((entry, index) => (
                  <div
                    key={entry.addition_id || entry.float_addition_id || index}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(entry.amount || entry.float_amount)}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(entry.created_at)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.added_by_name || entry.added_by_username || 'N/A'}
                      </div>
                    </div>
                    
                    {formatChipBreakdown(entry) !== 'No chips' && (
                      <div className="text-xs text-gray-600 mt-2">
                        Chips: {formatChipBreakdown(entry)}
                      </div>
                    )}
                    
                    {(entry.notes || entry.reason) && (
                      <div className="text-xs text-gray-600 mt-2 italic">
                        Note: {entry.notes || entry.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewFloatModal;