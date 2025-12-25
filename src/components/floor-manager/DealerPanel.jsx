// ============================================
// FILE: components/floor-manager/DealerPanel.jsx
// Sidebar panel showing all dealers with status
// ============================================

import React from 'react';
import { Coffee, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DealerTimerBadge from './DealerTimerBadge';

const DealerPanel = ({
  dealers,
  tables,
  getDealerTimer,
  formatDuration,
  onRemoveDealer,
  onMarkAvailable,
  availableDealersCount,
  assignedDealersCount,
}) => {
  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-black text-lg">
          DEALERS
        </CardTitle>
        <p className="text-xs text-slate-400 mt-1">
          {availableDealersCount} available • {assignedDealersCount} assigned
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {dealers.length === 0 ? (
          <p className="text-center text-slate-500 py-6">No dealers found</p>
        ) : (
          dealers.map((dealer) => {
            const isAssigned = tables.some(
              (t) => t.dealer?.dealer_id === dealer.dealer_id
            );
            const assignedTable = tables.find(
              (t) => t.dealer?.dealer_id === dealer.dealer_id
            );
            const isOnBreak = dealer.dealer_status === 'on_break';
            const timerData = getDealerTimer(dealer.dealer_id, dealer.dealer_status);

            return (
              <div
                key={dealer.dealer_id}
                className={`relative p-3 rounded-lg transition-all ${
                  isOnBreak
                    ? 'bg-slate-800/60 border-l-4 border-orange-500'
                    : isAssigned
                    ? 'bg-slate-800/60 border-l-4 border-cyan-500'
                    : 'bg-emerald-950/40 border-l-4 border-emerald-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-white text-sm">
                        {dealer.dealer_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {isOnBreak
                          ? 'On Break'
                          : isAssigned && assignedTable
                          ? assignedTable.table_name
                          : 'Ready'}
                      </p>
                      {/* Timer Display */}
                      <div className="mt-1">
                        <DealerTimerBadge
                          dealer={dealer}
                          timerData={timerData}
                          formatDuration={formatDuration}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAssigned && (
                      <Button
                        onClick={() => onRemoveDealer(assignedTable.table_id)}
                        size="sm"
                        className="bg-slate-700 hover:bg-slate-600 text-white h-8 w-8 p-0 rounded-lg"
                        title="Send on break"
                      >
                        <Coffee className="w-4 h-4" />
                      </Button>
                    )}
                    {isOnBreak && (
                      <Button
                        onClick={() => onMarkAvailable(dealer.dealer_id)}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 w-8 p-0 rounded-lg"
                        title="Mark as available"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default DealerPanel;

