// components/cashier/ViewFloatModal.jsx
// View all float additions for current session

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import cashierService from '../../services/cashier.service';
import cashierShiftService from '../../services/cashier-shift.service';
import { useSession } from '../../contexts/Sessioncontext'; // ✅ FIXED: Using context version

const ViewFloatModal = ({ open, onOpenChange }) => {
  const { session } = useSession();
  const [floatHistory, setFloatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  useEffect(() => {
    // ✅ FIXED: Only fetch if session is active (not closed)
    if (open && session?.session_id !== null && session?.session_id !== undefined && session?.is_closed === 0) {
      fetchFloatHistory();
    } else if (open && (session?.is_closed === 1 || !session)) {
      // Clear history if session is closed or doesn't exist
      setFloatHistory([]);
      setLoading(false);
    }
  }, [open, session?.session_id, session?.is_closed]);

  const fetchFloatHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch float history
      const response = await cashierService.getFloatHistoryBySession(session.session_id);
      // Handle response structure: {success: true, data: []} or direct array
      let additions = [];
      if (response?.success && Array.isArray(response.data)) {
        additions = response.data;
      } else if (Array.isArray(response?.data)) {
        additions = response.data;
      } else if (Array.isArray(response)) {
        additions = response;
      }
      setFloatHistory(additions);
      
      // Fetch first cashier shift to get actual session start time
      try {
        const shiftsResponse = await cashierShiftService.getAllShifts();
        const shifts = shiftsResponse?.data || shiftsResponse || [];
        if (Array.isArray(shifts) && shifts.length > 0) {
          // Find the earliest started_at time
          const sortedShifts = shifts
            .filter(s => s.started_at)
            .sort((a, b) => new Date(a.started_at) - new Date(b.started_at));
          if (sortedShifts.length > 0) {
            setSessionStartTime(sortedShifts[0].started_at);
          }
        }
      } catch (shiftError) {
        console.error('Error fetching shifts for start time:', shiftError);
        // Fallback to session created_at if available
        if (session?.created_at) {
          setSessionStartTime(session.created_at);
        }
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

  // Calculate total including opening float
  const openingFloat = parseFloat(session?.opening_float || 0);
  const additionsTotal = floatHistory.reduce((sum, entry) => sum + parseFloat(entry.amount || entry.float_amount || 0), 0);
  const totalFloat = openingFloat + additionsTotal;

  // Get the actual session start time
  // Priority: fetched sessionStartTime (first cashier shift) > created_at > first float addition time > session_date (fallback)
  const getSessionStartTime = () => {
    // First try the fetched sessionStartTime (from first cashier shift - most accurate)
    if (sessionStartTime) {
      return sessionStartTime;
    }
    // Second try created_at (has actual timestamp)
    if (session?.created_at) {
      return session.created_at;
    }
    // If float history exists, use the earliest addition time (closest to actual start)
    if (floatHistory.length > 0) {
      const sortedByTime = [...floatHistory].sort((a, b) => 
        new Date(a.created_at || 0) - new Date(b.created_at || 0)
      );
      return sortedByTime[0]?.created_at;
    }
    // Fallback to session_date (date only, will show as start of day)
    return session?.session_date;
  };

  // Create opening float entry if it exists
  const openingFloatEntry = openingFloat > 0 ? {
    addition_id: 'opening',
    float_amount: openingFloat,
    amount: openingFloat,
    created_at: getSessionStartTime(),
    added_by_name: 'System',
    notes: 'Opening Float - Day Start',
    is_opening: true
  } : null;

  // Combine opening float with additions (opening first, then additions)
  const allFloatEntries = openingFloatEntry 
    ? [openingFloatEntry, ...floatHistory]
    : floatHistory;

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
           
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Total Float {openingFloatEntry ? '(Opening + Additions)' : 'Added'}
              </span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(totalFloat)}</span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {openingFloatEntry && (
                <span className="block mb-1">
                  Opening: {formatCurrency(openingFloat)} + Additions: {formatCurrency(additionsTotal)}
                </span>
              )}
              {allFloatEntries.length} {openingFloatEntry ? 'entry' : 'addition'}{allFloatEntries.length !== 1 ? 's' : ''}
              {openingFloatEntry && ` (${floatHistory.length} addition${floatHistory.length !== 1 ? 's' : ''})`}
            </div>
          </div>

          {/* List */}
          <ScrollArea className="h-[400px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading...</div>
              </div>
            ) : allFloatEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mb-2 opacity-50" />
                <div className="text-sm">No float entries found</div>
              </div>
            ) : (
              <div className="space-y-3">
                {allFloatEntries.map((entry, index) => {
                  const isOpening = entry.is_opening || entry.addition_id === 'opening';
                  return (
                    <div
                      key={entry.addition_id || entry.float_addition_id || index}
                      className={`p-4 border rounded-lg hover:bg-gray-50 ${
                        isOpening 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-gray-900">
                              {formatCurrency(entry.amount || entry.float_amount)}
                            </div>
                            {isOpening && (
                              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-medium">
                                Opening Float
                              </span>
                            )}
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
                          {isOpening ? entry.notes : `Note: ${entry.notes || entry.reason}`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewFloatModal;