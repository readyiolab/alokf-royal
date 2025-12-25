import React, { useState } from "react";
import { Users, DollarSign, UserPlus, Coffee, Clock, Timer, MoreVertical, X, Play, UserMinus, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const CasinoTableView = ({ 
  table, 
  onAddPlayer,
  onAssignDealer,
  onRemoveDealer,
  onPlayerBreak,
  onPlayerResume,
  onCallTime,
  onExtendCallTime,
  onRemovePlayer,
  onMarkCompleted
}) => {
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [showDealerActions, setShowDealerActions] = useState(false);
  const maxSeats = table.max_seats || 9;
  const players = table.players || [];
  
  // Create seat positions in a rounded rectangle layout
  const getSeatPosition = (seatNumber, totalSeats) => {
    // Distribute seats around a rounded rectangle
    const topSeats = Math.ceil(totalSeats / 3);
    const sideSeats = Math.floor(totalSeats / 3);
    const bottomSeats = totalSeats - topSeats - sideSeats * 2;
    
    if (seatNumber <= topSeats) {
      // Top seats
      const index = seatNumber - 1;
      const spacing = 100 / (topSeats + 1);
      return {
        top: '5%',
        left: `${spacing * (index + 1)}%`,
        transform: 'translate(-50%, -50%)'
      };
    } else if (seatNumber <= topSeats + sideSeats) {
      // Right side seats
      const index = seatNumber - topSeats - 1;
      const spacing = 80 / (sideSeats + 1);
      return {
        top: `${20 + spacing * (index + 1)}%`,
        right: '2%',
        transform: 'translate(50%, -50%)'
      };
    } else if (seatNumber <= topSeats + sideSeats + bottomSeats) {
      // Bottom seats
      const index = seatNumber - topSeats - sideSeats - 1;
      const spacing = 100 / (bottomSeats + 1);
      return {
        bottom: '5%',
        left: `${100 - spacing * (index + 1)}%`,
        transform: 'translate(-50%, 50%)'
      };
    } else {
      // Left side seats
      const index = seatNumber - topSeats - sideSeats - bottomSeats - 1;
      const spacing = 80 / (sideSeats + 1);
      return {
        top: `${20 + spacing * (index + 1)}%`,
        left: '2%',
        transform: 'translate(-50%, -50%)'
      };
    }
  };

  const getPlayerAtSeat = (seatNum) => {
    return players.find(p => p.seat_number === seatNum);
  };

  const getStatusColor = (status) => {
    const colors = {
      playing: "bg-green-500",
      on_break: "bg-orange-500",
      call_time_active: "bg-red-500",
      AWAITING_CONFIRMATION: "bg-yellow-500",
    };
    return colors[status] || "bg-gray-400";
  };

  return (
    <div className="relative w-full h-[500px] bg-gradient-to-br from-green-800 via-green-700 to-green-900 rounded-3xl shadow-2xl border-8 border-amber-900 overflow-hidden">
      {/* Felt texture overlay */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.3) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }}></div>
      
      {/* Table info in center */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-0">
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border-2 border-amber-700/50">
          <div className="flex items-center gap-2 justify-center mb-2">
            <span className="text-3xl font-bold text-amber-400">#{table.table_number}</span>
            <Badge className="bg-amber-600 text-white text-xs">{table.game_type}</Badge>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{table.table_name}</h3>
          <p className="text-amber-300 flex items-center gap-1 justify-center text-sm">
            <DollarSign className="w-4 h-4" /> {table.stakes}
          </p>
          
          {/* Dealer info with actions */}
          <div 
            className="mt-4 bg-purple-900/40 rounded-lg p-3 border border-purple-400/30 relative group"
            onMouseEnter={() => setShowDealerActions(true)}
            onMouseLeave={() => setShowDealerActions(false)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-purple-200 mb-1">DEALER</p>
                <p className="text-sm font-bold text-white">
                  {table.dealer?.dealer_name || "No Dealer"}
                </p>
              </div>
              
              {/* Dealer action buttons */}
              {showDealerActions && (
                <div className="flex gap-1">
                  {!table.dealer && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssignDealer?.(table);
                      }}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 h-6 w-6 p-0"
                    >
                      <UserPlus className="w-3 h-3" />
                    </Button>
                  )}
                  {table.dealer && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveDealer?.(table.table_id);
                      }}
                      size="sm"
                      variant="outline"
                      className="border-red-400 text-red-700 hover:bg-red-50 h-6 w-6 p-0 bg-white"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Player count */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <Users className="w-5 h-5 text-green-400" />
            <span className="text-2xl font-bold text-white">
              {table.players?.length || 0}/{maxSeats}
            </span>
          </div>
        </div>
      </div>

      {/* Seats around the table */}
      {Array.from({ length: maxSeats }, (_, i) => i + 1).map((seatNum) => {
        const player = getPlayerAtSeat(seatNum);
        const position = getSeatPosition(seatNum, maxSeats);
        
        return (
          <div
            key={seatNum}
            className="absolute z-10"
            style={position}
          >
            {player ? (
              // Occupied seat with player
              <div 
                className="relative"
                onMouseEnter={() => setHoveredSeat(seatNum)}
                onMouseLeave={() => setHoveredSeat(null)}
              >
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-2xl border-4 border-blue-400 p-3 min-w-[140px] transform hover:scale-105 transition-transform">
                  {/* Player actions menu */}
                  {hoveredSeat === seatNum && (
                    <div className="absolute -top-2 right-2 z-20">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" className="h-6 w-6 p-0 bg-white hover:bg-gray-100 rounded-full shadow-lg">
                            <MoreVertical className="w-4 h-4 text-gray-700" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {player.status === 'playing' && (
                            <>
                              <DropdownMenuItem onClick={() => onPlayerBreak?.(player.table_player_id)}>
                                <Coffee className="w-4 h-4 mr-2" />
                                Put on Break
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onCallTime?.(player.table_player_id)}>
                                <Timer className="w-4 h-4 mr-2" />
                                Call Time (60m)
                              </DropdownMenuItem>
                            </>
                          )}
                          {player.status === 'on_break' && (
                            <DropdownMenuItem onClick={() => onPlayerResume?.(player.table_player_id)}>
                              <Play className="w-4 h-4 mr-2" />
                              Resume Playing
                            </DropdownMenuItem>
                          )}
                          {player.status === 'call_time_active' && (
                            <DropdownMenuItem onClick={() => onExtendCallTime?.(player)}>
                              <Clock className="w-4 h-4 mr-2" />
                              Extend Time
                            </DropdownMenuItem>
                          )}
                          {player.status === 'AWAITING_CONFIRMATION' && (
                            <DropdownMenuItem onClick={() => onMarkCompleted?.(player.table_player_id)}>
                              <DollarSign className="w-4 h-4 mr-2" />
                              Mark Buy-in Complete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onRemovePlayer?.(player.table_player_id, player.player_name)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <UserMinus className="w-4 h-4 mr-2" />
                            Remove Player
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                  
                  {/* Status indicator */}
                  <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full ${getStatusColor(player.status)} border-2 border-white animate-pulse`}></div>
                  
                  {/* Seat number badge */}
                  <div className="absolute -top-3 -left-3 bg-amber-500 text-white font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs border-2 border-white">
                    {seatNum}
                  </div>

                  <div className="text-center">
                    <p className="font-bold text-white text-sm truncate">{player.player_name}</p>
                    <p className="text-xs text-blue-200">{player.player_code}</p>
                    
                    {/* Buy-in amount */}
                    <div className="mt-2 bg-green-600 rounded-lg py-1 px-2">
                      <p className="text-xs text-white font-bold">₹{player.buy_in_amount?.toLocaleString()}</p>
                    </div>

                    {/* Status badges */}
                    {player.status === 'on_break' && (
                      <div className="mt-1 flex items-center justify-center gap-1 text-orange-300">
                        <Coffee className="w-3 h-3" />
                        <span className="text-xs">Break {player.break_duration_minutes}m</span>
                      </div>
                    )}
                    
                    {player.status === 'call_time_active' && (
                      <div className="mt-1 flex items-center justify-center gap-1 text-red-300">
                        <Timer className="w-3 h-3" />
                        <span className="text-xs">{player.call_time_remaining_minutes}m left</span>
                      </div>
                    )}

                    {/* Session time */}
                    <div className="mt-1 flex items-center justify-center gap-1 text-blue-200">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{Math.floor(player.session_duration_minutes / 60)}h {player.session_duration_minutes % 60}m</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Empty seat
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddPlayer?.(table, seatNum);
                }}
                className="group relative"
                onMouseEnter={() => setHoveredSeat(seatNum)}
                onMouseLeave={() => setHoveredSeat(null)}
              >
                <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl shadow-lg border-4 border-gray-600 border-dashed p-3 min-w-[140px] hover:border-green-400 hover:bg-gradient-to-br hover:from-green-800 hover:to-green-900 transition-all transform hover:scale-105">
                  {/* Seat number badge */}
                  <div className="absolute -top-3 -left-3 bg-gray-500 text-white font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs border-2 border-white group-hover:bg-green-500">
                    {seatNum}
                  </div>

                  <div className="flex flex-col items-center justify-center py-4">
                    <UserPlus className="w-8 h-8 text-gray-400 group-hover:text-green-400 mb-1" />
                    <p className="text-xs text-gray-400 group-hover:text-green-300 font-semibold">Empty Seat</p>
                  </div>
                </div>
              </button>
            )}
          </div>
        );
      })}

      {/* Table edge highlights */}
      <div className="absolute inset-0 rounded-3xl border-4 border-amber-600/20 pointer-events-none"></div>
      <div className="absolute inset-2 rounded-3xl border-2 border-amber-400/10 pointer-events-none"></div>
    </div>
  );
};

export default CasinoTableView;