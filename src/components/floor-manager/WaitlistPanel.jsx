// ============================================
// FILE: components/floor-manager/WaitlistPanel.jsx
// Sidebar panel showing waitlist
// ============================================

import React from 'react';
import { Clock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const WaitlistPanel = ({
  waitlist,
  formatDuration,
  onAddToWaitlist,
  onSeatPlayer,
}) => {
  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-emerald-400 text-lg">
            <Clock className="w-5 h-5" />
            WAITLIST
          </CardTitle>
          <Button
            onClick={onAddToWaitlist}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 rounded-lg"
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {waitlist.length} waiting
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {waitlist.map((entry, idx) => (
          <div
            key={entry.waitlist_id}
            className="bg-slate-800/60 border-l-4 border-amber-500 p-3 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center font-bold text-white">
                  {idx + 1}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">
                    {entry.player_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {entry.player_phone || 'No phone'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(entry.wait_time_minutes * 60)}
                  </p>
                </div>
                <Button
                  onClick={() => onSeatPlayer(entry)}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-4 rounded-lg text-xs font-semibold"
                >
                  Seat
                </Button>
              </div>
            </div>
          </div>
        ))}
        {waitlist.length === 0 && (
          <p className="text-center text-slate-500 py-6">No one waiting</p>
        )}
      </CardContent>
    </Card>
  );
};

export default WaitlistPanel;

