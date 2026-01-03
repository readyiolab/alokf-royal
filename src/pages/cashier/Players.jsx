// src/pages/cashier/Players.jsx
// Redesigned Players Page with Credit, Stored Balance, and Transactions

import React, { useState, useEffect } from "react";
import CashierLayout from "../../components/layouts/CashierLayout";
import { useAuth } from "../../hooks/useAuth";
import playerService from "../../services/player.service";
import transactionService from "../../services/transaction.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Search,
  UserPlus,
  CreditCard,
  Wallet,
  PiggyBank,
  Edit2,
  Check,
  X,
  Loader2,
  Receipt,
  TrendingUp,
  TrendingDown,
  User,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import AddPlayerDialog from "../../components/players/AddPlayerDialog";

const Players = () => {
  const { token } = useAuth();
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerDialog, setShowPlayerDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [playerTransactions, setPlayerTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  // Editing states
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editingField, setEditingField] = useState(null); // 'credit' or 'limit'
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  
  // House player modal state
  const [showHousePlayerModal, setShowHousePlayerModal] = useState(false);
  const [selectedPlayerForHouse, setSelectedPlayerForHouse] = useState(null);
  const [togglingHouse, setTogglingHouse] = useState(false);

  // Fetch all players with their credit and stored balance
  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await playerService.getAllPlayers();
      // Handle both paginated and non-paginated responses
      let playersList = [];
      if (Array.isArray(response)) {
        playersList = response;
      } else if (response?.data?.players) {
        playersList = response.data.players;
      } else if (response?.players) {
        playersList = response.players;
      } else if (response?.data && Array.isArray(response.data)) {
        playersList = response.data;
      }
      
      // Ensure outstanding_credit is a positive number (backend calculates from tbl_credits)
      playersList = playersList.map(p => ({
        ...p,
        outstanding_credit: Math.max(0, parseFloat(p.outstanding_credit || 0)),
        is_house_player: p.is_house_player === 1 || p.is_house_player === true
      }));

      // Fetch stored balance for each player
      const playersWithData = await Promise.all(
        playersList.map(async (player) => {
          try {
            const storedBalance = await transactionService.getPlayerStoredBalance(
              token,
              player.player_id
            );
            return {
              ...player,
              stored_chips: parseFloat(storedBalance?.stored_chips || 0),
              stored_balance_value: parseFloat(storedBalance?.total_value || storedBalance?.stored_chips || 0),
            };
          } catch (err) {
            console.error(`Error fetching stored balance for player ${player.player_id}:`, err);
            return {
              ...player,
              stored_chips: 0,
              stored_balance_value: 0,
            };
          }
        })
      );

      setPlayers(playersWithData);
      setFilteredPlayers(playersWithData);
    } catch (err) {
      setError(err.message || "Failed to load players");
      console.error("Error fetching players:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPlayers();
    }
  }, [token]);

  // Filter players based on search and tab
  useEffect(() => {
    let filtered = players;

    // Apply tab filter
    if (activeTab === "with-credit") {
      filtered = filtered.filter(
        (p) => parseFloat(p.outstanding_credit || 0) > 0
      );
    } else if (activeTab === "with-balance") {
      filtered = filtered.filter(
        (p) => parseFloat(p.stored_balance_value || p.stored_chips || 0) > 0
      );
    } else if (activeTab === "house") {
      filtered = filtered.filter((p) => p.is_house_player === true || p.is_house_player === 1);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (player) =>
          player.player_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          player.player_code
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          player.phone_number?.includes(searchQuery)
      );
    }

    setFilteredPlayers(filtered);
  }, [searchQuery, activeTab, players]);

  // Calculate stats
  const stats = {
    totalPlayers: players.length,
    totalCredit: players.reduce(
      (sum, p) => {
        const credit = Math.max(0, parseFloat(p.outstanding_credit || 0)); // Ensure non-negative
        return sum + credit;
      },
      0
    ),
    playersWithCredit: players.filter(
      (p) => parseFloat(p.outstanding_credit || 0) > 0
    ).length,
    totalStored: players.reduce(
      (sum, p) => sum + parseFloat(p.stored_balance_value || p.stored_chips || 0),
      0
    ),
    playersWithBalance: players.filter(
      (p) => parseFloat(p.stored_balance_value || p.stored_chips || 0) > 0
    ).length,
  };

  // Fetch player transactions
  const fetchPlayerTransactions = async (playerId) => {
    if (!playerId) {
      setPlayerTransactions([]);
      return;
    }

    try {
      setLoadingTransactions(true);
      const transactions = await transactionService.getPlayerTransactionHistory(
        token,
        playerId
      );
      setPlayerTransactions(Array.isArray(transactions) ? transactions : []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setPlayerTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const [playerBalance, setPlayerBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const fetchPlayerBalance = async (playerId) => {
    if (!playerId) return;
    setLoadingBalance(true);
    try {
      const balance = await transactionService.getPlayerChipBalance(token, playerId);
      setPlayerBalance(balance);
    } catch (err) {
      console.error("Error fetching player balance:", err);
      setPlayerBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleViewPlayer = async (player) => {
    setSelectedPlayer(player);
    setShowPlayerDialog(true);
    await Promise.all([
      fetchPlayerTransactions(player.player_id),
      fetchPlayerBalance(player.player_id)
    ]);
  };

  // Start editing credit or limit
  const startEditing = (playerId, field, currentValue) => {
    setEditingPlayerId(playerId);
    setEditingField(field);
    setEditValue(currentValue.toString());
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingPlayerId(null);
    setEditingField(null);
    setEditValue("");
  };

  // Save credit or limit
  const saveEdit = async (playerId) => {
    if (!editValue || parseFloat(editValue) < 0) {
      return;
    }

    setSaving(true);
    try {
      if (editingField === "limit") {
        await playerService.setPlayerCreditLimit(playerId, parseFloat(editValue));
      } else if (editingField === "credit") {
        // Note: Updating outstanding credit directly might not be available
        // This would typically be done through credit transactions
        // For now, we'll just update the local state
        setPlayers((prev) =>
          prev.map((p) =>
            p.player_id === playerId
              ? { ...p, outstanding_credit: parseFloat(editValue) }
              : p
          )
        );
      }

      // Refresh player data
      await fetchPlayers();
      cancelEditing();
    } catch (err) {
      console.error("Error saving:", err);
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Handle house player toggle
  const handleHousePlayerClick = (e, player) => {
    e.stopPropagation();
    setSelectedPlayerForHouse(player);
    setShowHousePlayerModal(true);
  };

  const handleToggleHousePlayer = async () => {
    if (!selectedPlayerForHouse) return;

    setTogglingHouse(true);
    try {
      await playerService.toggleHousePlayer(selectedPlayerForHouse.player_id);
      await fetchPlayers();
      setShowHousePlayerModal(false);
      setSelectedPlayerForHouse(null);
    } catch (err) {
      console.error("Error toggling house player:", err);
      setError(err.message || "Failed to toggle house player status");
    } finally {
      setTogglingHouse(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "P"
    );
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "buy_in":
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "cash_payout":
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case "issue_credit":
      case "credit_issued":
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case "settle_credit":
        return <Check className="w-5 h-5 text-green-600" />;
      default:
        return <Receipt className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    // Green for profit (money/chips coming in)
    if (["buy_in", "settle_credit", "deposit_cash", "redeem_stored"].includes(type)) {
      return "text-green-600";
    } 
    // Red for loss (money/chips going out)
    else if (["cash_payout", "return_chips", "deposit_chips", "expense"].includes(type)) {
      return "text-red-600";
    }
    // Blue for credit-related
    else if (["issue_credit", "credit_issued"].includes(type)) {
      return "text-blue-600";
    }
    return "text-gray-600";
  };

  if (loading) {
    return (
      <CashierLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </CashierLayout>
    );
  }

  return (
    <CashierLayout>
      <div className="space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-red-600" />
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Credit</p>
                  </div>
                  <p className="text-3xl font-bold text-red-600 mb-1">
                    {formatCurrency(stats.totalCredit)}
                  </p>
                  <p className="text-xs text-gray-600 uppercase">
                    {stats.playersWithCredit} players with credit
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <PiggyBank className="w-4 h-4 text-green-600" />
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Stored</p>
                  </div>
                  <p className="text-3xl font-bold text-green-600 mb-1">
                    {formatCurrency(stats.totalStored)}
                  </p>
                  <p className="text-xs text-gray-600 uppercase">
                    {stats.playersWithBalance} players with balance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Players</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {stats.totalPlayers}
                  </p>
                  <p className="text-xs text-gray-600 uppercase">
                    Registered in system
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Search */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Players Directory</h2>
                  <p className="text-sm text-gray-600">Manage all players</p>
                </div>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="bg-orange-600 hover:bg-blue-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  New Player
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeTab === "all" ? "default" : "outline"}
                  onClick={() => setActiveTab("all")}
                  className={activeTab === "all" ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-700 border-gray-300 hover:bg-gray-100"}
                >
                  All
                </Button>
                <Button
                  variant={activeTab === "with-credit" ? "default" : "outline"}
                  onClick={() => setActiveTab("with-credit")}
                  className={`flex items-center gap-1 ${activeTab === "with-credit" ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  With Credit
                </Button>
                <Button
                  variant={activeTab === "with-balance" ? "default" : "outline"}
                  onClick={() => setActiveTab("with-balance")}
                  className={`flex items-center gap-1 ${activeTab === "with-balance" ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                >
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  With Balance
                </Button>
                <Button
                  variant={activeTab === "house" ? "default" : "outline"}
                  onClick={() => setActiveTab("house")}
                  className={`flex items-center gap-1 ${activeTab === "house" ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                >
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  House
                </Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players Grid */}
        <div>
          <p className="text-sm text-gray-900 mb-4">
            Showing {filteredPlayers.length} of {stats.totalPlayers} players
          </p>
          
          {filteredPlayers.length === 0 ? (
            <Card className="bg-white border-gray-200">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-900">No players found</p>
                {searchQuery && (
                  <Button
                    variant="link"
                    onClick={() => setSearchQuery("")}
                    className="text-blue-600 mt-2"
                  >
                    Clear search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlayers.map((player) => {
                // Determine avatar color (green for some players, orange for others)
                const avatarColor = player.is_house_player ? "bg-green-100" : "bg-orange-100";
                const avatarIconColor = player.is_house_player ? "text-green-700" : "text-orange-700";
                const hasLeftBorder = player.is_house_player;
                
                return (
                  <Card
                    key={player.player_id}
                    className={`bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${
                      hasLeftBorder ? "border-l-4 border-l-green-500" : ""
                    }`}
                    onClick={() => handleViewPlayer(player)}
                  >
                    <CardContent className="p-4">
                      {/* Player Profile Section */}
                      <div className="flex items-start gap-3 mb-4">
                        <div 
                          className="relative cursor-pointer"
                          onClick={(e) => handleHousePlayerClick(e, player)}
                        >
                          {/* Square avatar with rounded corners */}
                          <div className={`w-12 h-12 ${avatarColor} rounded-lg flex items-center justify-center`}>
                            <User className={`w-6 h-6 ${avatarIconColor}`} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1">
                            {player.player_name.toLowerCase()}
                          </h3>
                          <div className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-900 font-medium">
                            {player.player_code}
                          </div>
                        </div>
                      </div>

                      {/* Financial Details Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        {/* Credit */}
                        <div>
                          <p className="text-xs text-gray-600 mb-1">CREDIT</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(player.outstanding_credit || 0)}
                          </p>
                        </div>

                        {/* Credit Limit */}
                        <div>
                          <p className="text-xs text-gray-600 mb-1">CREDIT LIMIT</p>
                          {editingPlayerId === player.player_id && editingField === "limit" ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-7 w-16 text-xs p-1"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(player.player_id);
                                  if (e.key === "Escape") cancelEditing();
                                }}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveEdit(player.player_id);
                                }}
                                disabled={saving}
                              >
                                <Check className="w-3 h-3 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelEditing();
                                }}
                              >
                                <X className="w-3 h-3 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <p className="text-sm font-semibold text-orange-600">
                                {formatCurrency(
                                  player.credit_limit_personal || player.credit_limit || 0
                                )}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(
                                    player.player_id,
                                    "limit",
                                    player.credit_limit_personal || player.credit_limit || 0
                                  );
                                }}
                              >
                                <Edit2 className="w-3 h-3 text-gray-500" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Stored Balance */}
                        <div>
                          <p className="text-xs text-gray-600 mb-1">STORED BALANCE</p>
                          <p className="text-sm font-semibold text-green-600">
                            {formatCurrency(player.stored_balance_value || player.stored_chips || 0)}
                          </p>
                          {player.updated_at && parseFloat(player.stored_balance_value || player.stored_chips || 0) > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(player.updated_at).toLocaleDateString('en-IN', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric' 
                              })}, {new Date(player.updated_at).toLocaleTimeString('en-IN', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Player Transactions Modal */}
        <Dialog open={showPlayerDialog} onOpenChange={setShowPlayerDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {selectedPlayer?.player_name} - Transaction History
              </DialogTitle>
            </DialogHeader>

            {/* Net Balance and Stored Balance Display */}
            {selectedPlayer && (
              <div className="space-y-4 mt-4 mb-6">
                {/* Net Balance - Excluding Stored Balance */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Net Balance</p>
                        <p className="text-3xl font-bold text-blue-700">
                          ₹{formatCurrency(playerBalance?.current_chip_balance || 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Playable / Active balance</p>
                      </div>
                      <Wallet className="w-12 h-12 text-blue-600 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                {/* Stored Balance - With Date & Time */}
                {playerBalance && parseFloat(playerBalance.stored_chips || 0) > 0 && (
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">STORED BALANCE</p>
                          <p className="text-3xl font-bold text-green-700">
                            ₹{formatCurrency(playerBalance.stored_chips || 0)}
                          </p>
                          {selectedPlayer.updated_at && (
                            <p className="text-xs text-gray-500 mt-1">
                              Last updated: {new Date(selectedPlayer.updated_at).toLocaleDateString('en-IN', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric' 
                              })}, {new Date(selectedPlayer.updated_at).toLocaleTimeString('en-IN', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </p>
                          )}
                        </div>
                        <PiggyBank className="w-12 h-12 text-green-600 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {loadingTransactions || loadingBalance ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : playerTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {playerTransactions.map((transaction) => (
                  <div
                    key={transaction.transaction_id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {getTransactionIcon(transaction.transaction_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 capitalize">
                          {transaction.transaction_type?.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDateTime(transaction.created_at)}
                        </p>
                        {transaction.notes && (
                          <p className="text-xs text-gray-500 mt-1">
                            {transaction.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {(() => {
                        const isProfit = ["buy_in", "settle_credit", "deposit_cash", "redeem_stored"].includes(
                          transaction.transaction_type
                        );
                        const isLoss = ["cash_payout", "return_chips", "deposit_chips", "expense"].includes(
                          transaction.transaction_type
                        );
                        // Use chips_amount if amount is 0 (for deposit_chips, redeem_stored, etc.)
                        const displayAmount = (transaction.amount || 0) > 0 
                          ? transaction.amount 
                          : (transaction.chips_amount || 0);
                        const colorClass = isProfit ? "text-green-600" : isLoss ? "text-red-600" : "text-gray-600";
                        
                        return (
                          <>
                            <p className={`text-lg font-semibold ${colorClass}`}>
                              {isProfit ? "+" : isLoss ? "-" : ""}
                              {formatCurrency(displayAmount)}
                            </p>
                            {transaction.chips_amount > 0 && transaction.amount > 0 && (
                              <p className="text-sm text-gray-600">
                                Chips: {parseFloat(transaction.chips_amount).toLocaleString("en-IN")}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Player Dialog */}
        <AddPlayerDialog
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onPlayerAdded={() => {
            fetchPlayers();
          }}
        />

        {/* House Player Toggle Modal */}
        <Dialog open={showHousePlayerModal} onOpenChange={setShowHousePlayerModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">
                House Player
              </DialogTitle>
            </DialogHeader>
            {selectedPlayerForHouse && (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex-1">
                    <p className="text-sm text-purple-700 font-medium mb-1">
                      {selectedPlayerForHouse.player_name}
                    </p>
                    <p className="text-xs text-purple-600">
                      Requires CEO permission for cashout
                    </p>
                  </div>
                  <Switch
                    checked={selectedPlayerForHouse.is_house_player || false}
                    onCheckedChange={handleToggleHousePlayer}
                    disabled={togglingHouse}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    <strong>House Players</strong> are employees who require CEO approval before cash payout.
                  </p>
                  <p>
                    When a house player requests cash payout, the system will require explicit CEO permission confirmation before processing.
                  </p>
                </div>
                <Button
                  onClick={() => setShowHousePlayerModal(false)}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </CashierLayout>
  );
};

export default Players;
