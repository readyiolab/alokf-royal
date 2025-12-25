import React from 'react';
import { Clock, Coffee, Timer, MoreVertical, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PokerTable = ({
  table,
  liveTimers,
  onPlayerAction,
  onAddPlayer,
  formatDuration,
}) => {
  // ✅ Helper to get timer seconds from our new timer format
  const getTimerSeconds = (timerKey) => {
    const timer = liveTimers[timerKey];
    if (!timer) return 0;
    // Support both old format (number) and new format (object with seconds)
    return typeof timer === 'object' ? timer.seconds : timer;
  };
  // Poker table positions for 9 players (clockwise from top)
  const getSeatPosition = (seatNumber, maxSeats) => {
    const positions = {
      9: [
        // Top row (3 seats)
        { top: '5%', left: '15%', rotation: 0 },
        { top: '5%', left: '50%', rotation: 0, transform: 'translateX(-50%)' },
        { top: '5%', right: '15%', rotation: 0 },
        // Right side (2 seats)
        { top: '25%', right: '2%', rotation: 90 },
        { top: '65%', right: '2%', rotation: 90 },
        // Bottom row (2 seats)
        { bottom: '5%', right: '15%', rotation: 180 },
        { bottom: '5%', left: '50%', rotation: 180, transform: 'translateX(-50%)' },
        // Left side (2 seats)
        { bottom: '25%', left: '2%', rotation: 90 },
        { top: '25%', left: '2%', rotation: 90 },
      ],
      6: [
        { top: '10%', left: '20%', rotation: 0 },
        { top: '10%', right: '20%', rotation: 0 },
        { top: '50%', right: '2%', rotation: 90, transform: 'translateY(-50%)' },
        { bottom: '10%', right: '20%', rotation: 180 },
        { bottom: '10%', left: '20%', rotation: 180 },
        { top: '50%', left: '2%', rotation: 90, transform: 'translateY(-50%)' },
      ],
    };

    return positions[maxSeats]?.[seatNumber - 1] || { top: '50%', left: '50%' };
  };

  const getPlayerStatusStyles = (status) => {
    const styles = {
      playing: 'border-emerald-500 bg-emerald-500/10',
      on_break: 'border-orange-500 bg-orange-500/10',
      call_time_active: 'border-red-500 bg-red-500/10',
    };
    return styles[status] || 'border-slate-600 bg-slate-800/50';
  };

  const getStatusColor = (status) => {
    const colors = {
      playing: 'bg-emerald-600',
      on_break: 'bg-orange-600',
      call_time_active: 'bg-red-600',
    };
    return colors[status] || 'bg-slate-600';
  };

  return (
    <div className="w-full">
      {/* Table Felt Container */}
      <div className="relative w-full bg-gradient-to-br from-green-700 via-green-600 to-green-800 rounded-full aspect-video shadow-2xl border-8 border-amber-900 overflow-hidden">
        {/* Felt texture effect */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent 50%)',
            }}
          ></div>
        </div>

        {/* Center dealer/info area */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 text-center">
          <div className="bg-black/40 backdrop-blur-md border-2 border-amber-600 rounded-lg px-6 py-4 min-w-max">
            <p className="text-sm font-bold text-amber-300">{table.game_type}</p>
            <p className="text-xs text-amber-200 mt-1">{table.stakes}</p>
          </div>

          {/* Dealer button in center */}
          {table.dealer && (
            <div className="mt-4 text-center">
              <div className="inline-block bg-white/90 text-black rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm shadow-lg border-2 border-amber-600">
                D
              </div>
              <p className="text-xs text-white mt-1 font-semibold">
                {table.dealer.dealer_name.split(' ')[0]}
              </p>
            </div>
          )}
        </div>

        {/* Player Seats */}
        {Array.from({ length: table.max_seats }).map((_, seatIndex) => {
          const seatNumber = seatIndex + 1;
          const player = table.players?.find((p) => p.seat_number === seatNumber);
          const position = getSeatPosition(seatNumber, table.max_seats);

          return (
            <div
              key={seatNumber}
              className="absolute"
              style={{
                top: position.top,
                bottom: position.bottom,
                left: position.left,
                right: position.right,
                transform: position.transform || 'none',
              }}
            >
              {player ? (
                // Player Seat Card
                <div
                  className={`w-24 rounded-xl p-2 shadow-xl border-2 flex flex-col ${getPlayerStatusStyles(
                    player.player_status
                  )} backdrop-blur-sm`}
                >
                  {/* Seat Number & Menu */}
                  <div className="flex items-center justify-between mb-1">
                    <Badge className={`text-xs px-1.5 py-0 h-5 ${getStatusColor(player.player_status)}`}>
                      {seatNumber}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 hover:bg-white/20 text-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-slate-800 border-slate-700 text-sm">
                        {onPlayerAction && (
                          <>
                            {player.player_status === 'playing' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => onPlayerAction('break', player)}
                                  className="hover:bg-slate-700 text-xs cursor-pointer"
                                >
                                  <Coffee className="w-3 h-3 mr-2" />
                                  Break
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onPlayerAction('calltime', player)}
                                  className="hover:bg-slate-700 text-xs cursor-pointer"
                                >
                                  <Timer className="w-3 h-3 mr-2" />
                                  Call Time
                                </DropdownMenuItem>
                              </>
                            )}
                            {player.player_status === 'on_break' && (
                              <DropdownMenuItem
                                onClick={() => onPlayerAction('resume', player)}
                                className="hover:bg-slate-700 text-xs cursor-pointer"
                              >
                                ▶ Resume
                              </DropdownMenuItem>
                            )}
                            {player.player_status === 'call_time_active' && (
                              <DropdownMenuItem
                                onClick={() => onPlayerAction('extend', player)}
                                className="hover:bg-slate-700 text-xs cursor-pointer"
                              >
                                <Timer className="w-3 h-3 mr-2" />
                                Extend Call Time
                              </DropdownMenuItem>
                            )}
                            {player.buy_in_status === 'AWAITING_CONFIRMATION' && (
                              <DropdownMenuItem
                                onClick={() => onPlayerAction('confirm', player)}
                                className="text-emerald-400 hover:bg-emerald-600/20 text-xs cursor-pointer"
                              >
                                <CheckCircle className="w-3 h-3 mr-2" />
                                Mark Buy-in Complete
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem
                              onClick={() => onPlayerAction('remove', player)}
                              className="text-red-400 hover:bg-red-600/20 text-xs cursor-pointer"
                            >
                              ✕ Remove
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Player Info */}
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {player.player_name.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-amber-200 truncate">
                    ₹{(player.buy_in_amount / 1000).toFixed(1)}k
                  </p>

                  {/* Timer Display */}
                  <div className="mt-1 pt-1 border-t border-white/20">
                    {player.player_status === 'playing' && (
                      <div className="flex items-center gap-1 text-emerald-300 text-[9px]">
                        <Clock className="w-2.5 h-2.5" />
                        <span className="font-mono">
                          {formatDuration(
                            getTimerSeconds(`player_${player.table_player_id}_playing`)
                          )}
                        </span>
                      </div>
                    )}
                    {player.player_status === 'on_break' && (
                      <div className="flex items-center gap-1 text-orange-300 text-[9px]">
                        <Coffee className="w-2.5 h-2.5" />
                        <span className="font-mono">
                          {formatDuration(
                            getTimerSeconds(`player_${player.table_player_id}_break`)
                          )}
                        </span>
                      </div>
                    )}
                    {player.player_status === 'call_time_active' && (
                      <div className="flex items-center gap-1 text-red-300 text-[9px]">
                        <Timer className="w-2.5 h-2.5" />
                        <span className="font-mono">
                          {formatDuration(
                            getTimerSeconds(`player_${player.table_player_id}_calltime`)
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Empty Seat
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-white/30 flex flex-col items-center justify-center backdrop-blur-sm hover:border-white/60 transition cursor-pointer bg-white/5">
                  <p className="text-xs text-white/60 font-semibold">Seat {seatNumber}</p>
                  {onAddPlayer && (
                    <Button
                      onClick={() => onAddPlayer()}
                      size="sm"
                      className="mt-1 h-5 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                    >
                      +
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Table Stats Footer */}
      <div className="mt-4 grid grid-cols-3 gap-4 bg-slate-900/50 border border-slate-700 rounded-lg p-3">
        <div className="text-center">
          <p className="text-xs text-slate-400">Players</p>
          <p className="text-lg font-bold text-white">
            {table.players?.length || 0}/{table.max_seats}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Game</p>
          <p className="text-sm font-bold text-amber-300">{table.game_type}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Stakes</p>
          <p className="text-sm font-bold text-cyan-300">{table.stakes}</p>
        </div>
      </div>
    </div>
  );
};

export default PokerTable;
