import React from 'react';
import { Clock, AlertCircle, Coffee } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * ✅ DEALER TIMER DISPLAY COMPONENT
 * Shows shift time and break time countdowns
 */
export const DealerTimerDisplay = ({ dealer, timer, formatTime }) => {
  if (!dealer) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'on_table':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'on_break':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'available':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
      {/* Dealer Info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <p className="font-semibold text-sm text-slate-900">{dealer.dealer_name}</p>
          <p className="text-xs text-slate-500">ID: {dealer.dealer_id}</p>
        </div>
        <Badge className={getStatusColor(dealer.shift_status || dealer.dealer_status)}>
          {(dealer.shift_status || dealer.dealer_status).replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Timer Display */}
      <div className="space-y-2">
        {/* Shift Time */}
        {dealer.shift_status === 'on_table' && (
          <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-xs text-slate-600">Shift Time Left</span>
            </div>
            <span className="text-sm font-bold text-green-600">
              {formatTime(timer?.remainingSeconds || 0)}
            </span>
          </div>
        )}

        {/* Break Time */}
        {dealer.shift_status === 'on_break' && (
          <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-slate-600">Break Ends In</span>
            </div>
            <span className="text-sm font-bold text-yellow-600">
              {formatTime(timer?.remainingSeconds || 0)}
            </span>
          </div>
        )}

        {/* Table Assignment */}
        {dealer.assigned_table && (
          <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
            <span className="text-xs text-slate-600">Assigned Table</span>
            <span className="text-sm font-bold text-slate-900">
              #{dealer.assigned_table.table_number} - {dealer.assigned_table.table_name}
            </span>
          </div>
        )}

        {/* Warning: Shift ending soon */}
        {dealer.shift_status === 'on_table' && timer?.remainingSeconds && timer.remainingSeconds <= 300 && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-xs text-red-700">
              Shift ending soon! {formatTime(timer.remainingSeconds)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
