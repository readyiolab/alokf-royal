// ============================================
// FILE: components/floor-manager/modals/RakebackModal.jsx
// Rakeback Management Modal for Floor Manager
// FIXED: Player loading and display issues
// ============================================

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Gift,
  X,
  Loader2,
  Trash2,
  Plus,
  Clock,
  Search,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import rakebackService from "../../../services/rakeback.service";
import floorManagerService from "../../../services/floorManager.service";

const RakebackModal = ({ open, onOpenChange, sessionId }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("process"); // "process" or "configure"
  
  // Process Rakeback Tab States
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedRakebackType, setSelectedRakebackType] = useState("");
  const [rakebackTypes, setRakebackTypes] = useState([]);
  const [playerPlayTime, setPlayerPlayTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showPlayerList, setShowPlayerList] = useState(false);

  // Configure Rules Tab States
  const [newRuleHours, setNewRuleHours] = useState("");
  const [newRuleReward, setNewRuleReward] = useState("");

  // ✅ Get token from localStorage
  const token = localStorage.getItem('auth_token');

  // Fetch rakeback types
  const fetchRakebackTypes = useCallback(async () => {
    try {
      const typesRes = await rakebackService.getRakebackTypes();
      const typesData = Array.isArray(typesRes) ? typesRes : (typesRes?.data || []);
      setRakebackTypes(typesData);
    } catch (error) {
      console.error("Error fetching rakeback types:", error);
      // Set default types if fetch fails
      setRakebackTypes([
        { type_code: 'RB_4HR', required_hours: 4, default_amount: 500 },
        { type_code: 'RB_6HR', required_hours: 6, default_amount: 1000 },
        { type_code: 'RB_8HR', required_hours: 8, default_amount: 2000 },
      ]);
    }
  }, []);

  // ✅ FIXED: Fetch active seated players from tables
  const fetchActivePlayers = useCallback(async () => {
    if (!sessionId && sessionId !== 0) return;
    
    try {
      setLoading(true);
      
      // ✅ Try multiple methods to get active players
      let playersData = [];
      
      // Method 1: Try rakeback service endpoint
      try {
        const response = await rakebackService.getActiveSeatedPlayers(sessionId);
        playersData = Array.isArray(response) ? response : (response?.data || []);
      } catch (e) {
        console.log("Rakeback service failed, trying floor manager...");
      }
      
      // Method 2: If no players, try getting from tables
      if (playersData.length === 0) {
        try {
          const tablesRes = await floorManagerService.getAllTables(sessionId, token);
          const tables = Array.isArray(tablesRes) ? tablesRes : 
                        (tablesRes?.data || tablesRes?.tables || tablesRes?.message || []);
          
          // Extract all seated players from tables
          tables.forEach(table => {
            if (table.players && Array.isArray(table.players)) {
              table.players.forEach(player => {
                if (!player.is_removed) {
                  // Calculate play time from seated_at
                  let elapsedSeconds = 0;
                  if (player.seated_at) {
                    const seatedAt = new Date(player.seated_at);
                    elapsedSeconds = Math.floor((Date.now() - seatedAt.getTime()) / 1000);
                  }
                  // Use total_played_seconds if available
                  if (player.total_played_seconds) {
                    elapsedSeconds = player.total_played_seconds;
                  }
                  
                  playersData.push({
                    ...player,
                    table_name: table.table_name || `Table ${table.table_number}`,
                    current_elapsed_seconds: elapsedSeconds,
                  });
                }
              });
            }
          });
        } catch (e) {
          console.error("Floor manager tables fetch failed:", e);
        }
      }
      
      console.log("Active players loaded:", playersData);
      setPlayers(playersData);
      
      // If a player is selected, update their play time
      if (selectedPlayerId) {
        const player = playersData.find(p => 
          p.player_id === parseInt(selectedPlayerId) || 
          p.table_player_id === parseInt(selectedPlayerId)
        );
        if (player) {
          const totalSeconds = player.current_elapsed_seconds || player.total_played_seconds || 0;
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          setPlayerPlayTime({
            hours,
            minutes,
            totalSeconds,
          });
          setSelectedPlayer(player);
        }
      }
    } catch (error) {
      console.error("Error fetching active players:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load players",
      });
    } finally {
      setLoading(false);
    }
  }, [sessionId, selectedPlayerId, toast, token]);

  // Handle player selection
  const handlePlayerSelect = (player) => {
    const playerId = player.player_id || player.table_player_id;
    setSelectedPlayerId(playerId.toString());
    
    const totalSeconds = player.current_elapsed_seconds || player.total_played_seconds || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    setPlayerPlayTime({
      hours,
      minutes,
      totalSeconds,
    });
    setSelectedPlayer(player);
    setSelectedRakebackType(""); // Reset selected type
    setSearchQuery(player.player_name || "");
    setShowPlayerList(false);
  };

  useEffect(() => {
    if (open && (sessionId || sessionId === 0)) {
      fetchRakebackTypes();
      fetchActivePlayers();
      // Refresh player data every 30 seconds
      const interval = setInterval(() => {
        fetchActivePlayers();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [open, sessionId, fetchRakebackTypes, fetchActivePlayers]);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedPlayerId("");
      setSelectedPlayer(null);
      setSelectedRakebackType("");
      setSearchQuery("");
      setPlayerPlayTime(null);
      setActiveTab("process");
      setShowPlayerList(false);
    }
  }, [open]);

  // ✅ FIXED: Filter players - show all if no search, or filter by search
  const filteredPlayers = players.filter(p => {
    if (!searchQuery) return true; // Show ALL players when no search
    const query = searchQuery.toLowerCase();
    return p.player_name?.toLowerCase().includes(query) ||
           p.player_code?.toLowerCase().includes(query);
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format time
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  // Handle process rakeback
  const handleProcessRakeback = async () => {
    if (!selectedPlayerId || !selectedRakebackType || !selectedPlayer) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a player and rakeback type",
      });
      return;
    }

    try {
      setProcessing(true);
      
      // Find the selected type to get the amount
      const type = rakebackTypes.find(t => t.type_code === selectedRakebackType);
      if (!type) {
        throw new Error("Invalid rakeback type selected");
      }

      // Auto-calculate chip breakdown
      const amount = type.default_amount || 0;
      let remaining = amount;
      const chipBreakdown = {
        chips_10000: Math.floor(remaining / 10000),
        chips_5000: 0,
        chips_500: 0,
        chips_100: 0,
      };
      remaining = remaining % 10000;
      chipBreakdown.chips_5000 = Math.floor(remaining / 5000);
      remaining = remaining % 5000;
      chipBreakdown.chips_500 = Math.floor(remaining / 500);
      remaining = remaining % 500;
      chipBreakdown.chips_100 = Math.floor(remaining / 100);

      // ✅ Try to process rakeback
      const tablePlayerId = selectedPlayer.table_player_id || selectedPlayerId;
      
      await rakebackService.processRakeback({
        table_player_id: tablePlayerId,
        player_id: selectedPlayer.player_id,
        rakeback_type_code: selectedRakebackType,
        amount: amount,
        chip_breakdown: chipBreakdown,
        session_id: sessionId,
      });

      toast({
        title: "Success",
        description: `${formatCurrency(amount)} rakeback processed for ${selectedPlayer.player_name}`,
      });

      // Reset form
      setSelectedPlayerId("");
      setSelectedPlayer(null);
      setSelectedRakebackType("");
      setSearchQuery("");
      setPlayerPlayTime(null);
      
      // Refresh data
      fetchRakebackTypes();
      fetchActivePlayers();
      
      if (onOpenChange) onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process rakeback",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Handle add new rule
  const handleAddRule = async () => {
    if (!newRuleHours || !newRuleReward) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in both hours and reward",
      });
      return;
    }

    try {
      setProcessing(true);
      await rakebackService.createRakebackType({
        required_hours: parseFloat(newRuleHours),
        default_amount: parseFloat(newRuleReward),
      });

      toast({
        title: "Success",
        description: "New rakeback rule added",
      });

      setNewRuleHours("");
      setNewRuleReward("");
      fetchRakebackTypes();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add rule",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Handle delete rule
  const handleDeleteRule = async (typeCode) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) return;

    try {
      setProcessing(true);
      await rakebackService.deleteRakebackType(typeCode);
      
      toast({
        title: "Success",
        description: "Rule deleted successfully",
      });
      
      fetchRakebackTypes();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete rule",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Calculate progress percentage
  const maxRequiredHours = rakebackTypes.length > 0 
    ? Math.max(...rakebackTypes.map(t => t.required_hours || 0))
    : 8;
  const targetHours = maxRequiredHours || 8;
  const currentHours = playerPlayTime ? playerPlayTime.hours + (playerPlayTime.minutes / 60) : 0;
  const progressPercent = Math.min(100, (currentHours / targetHours) * 100);
  const remainingHours = Math.max(0, targetHours - currentHours);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a2e] border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-400" />
              RAKE BACK
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-gray-400 text-sm mt-1">Give chips to player as rakeback reward</p>
        </DialogHeader>

        {/* Tab Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => setActiveTab("process")}
            variant={activeTab === "process" ? "default" : "outline"}
            className={`flex-1 ${
              activeTab === "process"
                ? "bg-gray-800 text-white hover:bg-gray-700"
                : "bg-gray-900/50 text-gray-400 hover:bg-gray-800"
            }`}
          >
            Process Rakeback
          </Button>
          <Button
            onClick={() => setActiveTab("configure")}
            variant={activeTab === "configure" ? "default" : "outline"}
            className={`flex-1 ${
              activeTab === "configure"
                ? "bg-gray-800 text-white hover:bg-gray-700"
                : "bg-gray-900/50 text-gray-400 hover:bg-gray-800"
            }`}
          >
            Configure Rules
          </Button>
        </div>

        {/* Recorded By */}
        <div className="mt-4">
          <p className="text-gray-400 text-sm">
            Recorded by: <span className="text-white font-medium">{user?.full_name || user?.username || 'Floor Manager'}</span>
          </p>
        </div>

        {/* Process Rakeback Tab Content */}
        {activeTab === "process" && (
          <div className="space-y-6 mt-6">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                <span className="text-gray-400">Loading players...</span>
              </div>
            )}

            {/* No Players Message */}
            {!loading && players.length === 0 && (
              <div className="text-center py-8 bg-gray-900/50 rounded-lg border border-gray-700">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No active players seated at tables</p>
                <p className="text-gray-500 text-sm mt-1">Players need to be seated at a table first</p>
              </div>
            )}

            {/* Select Player */}
            {!loading && players.length > 0 && (
              <div>
                <label className="text-gray-300 text-sm mb-2 block">
                  Select Player ({players.length} active)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search player name or click to see all..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowPlayerList(true);
                    }}
                    onFocus={() => setShowPlayerList(true)}
                    className="pl-10 bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                
                {/* ✅ FIXED: Player Dropdown - Shows all players */}
                {showPlayerList && (
                  <div className="mt-2 bg-gray-900 border border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                    {filteredPlayers.length === 0 ? (
                      <div className="p-3 text-gray-500 text-center">
                        No players found
                      </div>
                    ) : (
                      filteredPlayers.map((player) => (
                        <div
                          key={player.table_player_id || player.player_id}
                          onClick={() => handlePlayerSelect(player)}
                          className={`p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-700 last:border-0 ${
                            selectedPlayerId === (player.player_id || player.table_player_id)?.toString()
                              ? "bg-green-900/30"
                              : ""
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-white text-sm font-medium">{player.player_name}</p>
                              <p className="text-gray-500 text-xs">
                                {player.player_code} • {player.table_name || `Seat ${player.seat_number}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-green-400 text-xs font-medium">
                                {formatTime(player.current_elapsed_seconds || player.total_played_seconds || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                {/* Selected Player Display */}
                {selectedPlayerId && selectedPlayer && !showPlayerList && (
                  <div 
                    className="mt-2 p-3 bg-green-900/20 rounded-lg border border-green-700 cursor-pointer"
                    onClick={() => setShowPlayerList(true)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">{selectedPlayer.player_name}</p>
                        <p className="text-gray-400 text-xs">
                          {selectedPlayer.table_name || `Seat ${selectedPlayer.seat_number}`}
                        </p>
                      </div>
                      <span className="text-gray-400 text-xs">Click to change</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Today's Play Time */}
            {selectedPlayerId && playerPlayTime !== null && (
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-green-400" />
                  <h3 className="text-green-300 font-semibold">Today's Play Time</h3>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-bold text-lg">
                    {playerPlayTime.hours} hrs {playerPlayTime.minutes} mins
                  </span>
                  <span className="text-gray-400">/ {targetHours} hrs target</span>
                </div>
                <Progress value={progressPercent} className="h-3 mb-2 bg-gray-700" />
                <div className="flex justify-between text-xs">
                  <span className="text-green-400">
                    {playerPlayTime.hours}h {playerPlayTime.minutes}m played
                  </span>
                  <span className="text-yellow-400">
                    {Math.floor(remainingHours)}h {Math.floor((remainingHours % 1) * 60)}m remaining
                  </span>
                </div>
              </div>
            )}

            {/* Select Rakeback Type */}
            {selectedPlayerId && (
              <div>
                <label className="text-gray-300 text-sm mb-3 block">Select Rakeback Type</label>
                <div className="space-y-3">
                  {rakebackTypes.map((type) => {
                    const requiredHours = type.required_hours || 0;
                    const playerHours = playerPlayTime ? playerPlayTime.hours + (playerPlayTime.minutes / 60) : 0;
                    const isEligible = playerHours >= requiredHours;
                    
                    return (
                      <div
                        key={type.type_code}
                        onClick={() => isEligible && setSelectedRakebackType(type.type_code)}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                          !isEligible
                            ? "border-gray-800 bg-gray-900/30 opacity-50 cursor-not-allowed"
                            : selectedRakebackType === type.type_code
                            ? "border-green-500 bg-green-900/20 cursor-pointer"
                            : "border-gray-700 bg-gray-900/50 hover:border-gray-600 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedRakebackType === type.type_code
                              ? "border-green-500 bg-green-500"
                              : "border-gray-600"
                          }`}>
                            {selectedRakebackType === type.type_code && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div>
                            <span className="text-white">
                              {requiredHours} hrs play time
                            </span>
                            {!isEligible && (
                              <p className="text-red-400 text-xs">
                                Need {Math.ceil(requiredHours - playerHours * 10) / 10}h more
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`font-semibold ${isEligible ? 'text-green-400' : 'text-gray-500'}`}>
                          {formatCurrency(type.default_amount)}
                        </span>
                      </div>
                    );
                  })}
                  
                  {rakebackTypes.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No rakeback rules configured. Go to Configure Rules tab.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Configure Rules Tab Content */}
        {activeTab === "configure" && (
          <div className="space-y-6 mt-6">
            {/* Current Rules */}
            <div>
              <h3 className="text-gray-300 text-sm font-medium mb-3">Current Rules</h3>
              <div className="space-y-2">
                {rakebackTypes.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No rules configured</p>
                ) : (
                  rakebackTypes.map((type) => (
                    <div
                      key={type.type_code}
                      className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700"
                    >
                      <span className="text-green-400 font-medium">
                        {type.required_hours} hrs play time → {formatCurrency(type.default_amount)}
                      </span>
                      <Button
                        onClick={() => handleDeleteRule(type.type_code)}
                        disabled={processing}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add New Rule */}
            <div>
              <h3 className="text-gray-300 text-sm font-medium mb-3">Add New Rule</h3>
              <div className="flex gap-3">
                <Input
                  type="number"
                  placeholder="Hours"
                  value={newRuleHours}
                  onChange={(e) => setNewRuleHours(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <Input
                  type="number"
                  placeholder="Reward ₹"
                  value={newRuleReward}
                  onChange={(e) => setNewRuleReward(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <Button
                  onClick={handleAddRule}
                  disabled={!newRuleHours || !newRuleReward || processing}
                  className="bg-green-600 hover:bg-green-700 w-12 h-10 p-0"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8 pt-4 border-t border-gray-700">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            {activeTab === "process" ? "Cancel" : "Close"}
          </Button>
          {activeTab === "process" ? (
            <Button
              onClick={handleProcessRakeback}
              disabled={!selectedPlayerId || !selectedRakebackType || processing}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Gift className="w-4 h-4 mr-2" />
              )}
              Process Rakeback
            </Button>
          ) : (
            <Button
              onClick={() => setActiveTab("process")}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Process Rakeback
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RakebackModal;