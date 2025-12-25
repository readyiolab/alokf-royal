// ============================================
// FILE: components/floor-manager/TableCard.jsx
// Individual table card with players and dealer info
// ============================================

import React from 'react';
import {
  Plus,
  UserPlus,
  Coffee,
  Timer,
  UsersRound,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PokerTable from '../PokerTable';

const TableCard = ({
  table,
  timers,
  formatDuration,
  onPlayerAction,
  onAddPlayer,
  onAssignDealer,
  onRemoveDealer,
}) => {
  // Get dealer timer if assigned
  const dealerTimer = table.dealer
    ? timers[`dealer_${table.dealer.dealer_id}_shift`] ||
      timers[`dealer_${table.dealer.dealer_id}_break`]
    : null;

  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-cyan-500 transition-all h-auto overflow-hidden">
      {/* HEADER */}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white px-3 py-1 rounded-lg font-normal text-sm">
              #{table.table_number}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-black flex justify-center items-center gap-2 px-3 py-1 rounded-lg font-normal text-sm bg-white">
              <UsersRound className="h-4 w-4" />
              {table.players?.length || 0}/{table.max_seats}
            </p>
          </div>
        </div>
      </CardHeader>

      {/* CONTENT */}
      <CardContent className="space-y-3 pt-0">
        {/* DEALER SECTION */}
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-2.5">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">
                Dealer
              </p>
              <p className="text-sm font-bold text-white">
                {table.dealer?.dealer_name || 'Unassigned'}
              </p>
              {table.dealer && (
                <>
                  <p className="text-xs text-slate-400">
                    {table.dealer.dealer_code}
                  </p>
                  {/* DEALER TIMER */}
                  {dealerTimer && dealerTimer.seconds > 0 && (
                    <div className="mt-1 flex items-center gap-1 text-cyan-400">
                      <Timer className="w-3 h-3" />
                      <span className="text-xs font-mono">
                        {formatDuration(dealerTimer.seconds)} left
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-1">
              {!table.dealer && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignDealer(table);
                  }}
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700 h-7 px-2 text-xs"
                  title="Assign dealer"
                >
                  <UserPlus className="w-3 h-3" />
                </Button>
              )}
              {table.dealer && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveDealer(table.table_id);
                  }}
                  size="sm"
                  variant="outline"
                  className="border-orange-600 text-orange-400 hover:bg-orange-600/20 h-7 px-2 text-xs"
                  title="Send on break"
                >
                  <Coffee className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* POKER TABLE VISUALIZATION */}
        <PokerTable
          table={table}
          liveTimers={timers}
          formatDuration={formatDuration}
          onPlayerAction={onPlayerAction}
          onAddPlayer={() => onAddPlayer(table)}
        />

        {/* Add Player Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onAddPlayer(table);
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 h-8 text-sm font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Player
        </Button>
      </CardContent>
    </Card>
  );
};

export default TableCard;
