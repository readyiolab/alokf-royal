// src/pages/cashier/Players.jsx
import React, { useState, useEffect } from "react";
import CashierLayout from "../../components/layouts/CashierLayout";
import { useAuth } from "../../hooks/useAuth";
import playerService from "../../services/player.service";
import transactionService from "../../services/transaction.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Filter,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  History,
  MapPin,
  Hash,
  Wallet,
  Activity,
} from "lucide-react";
import AddPlayerDialog from "../../components/players/AddPlayerDialog";

const Players = () => {
  const { token } = useAuth();
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerDialog, setShowPlayerDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [playerTransactions, setPlayerTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Fetch all players
  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await playerService.getAllPlayers(token);
      console.log("API Response:", response);

      // Handle response structure - extract players array from data.players
      const playersList =
        response?.data?.players || response?.players || response || [];
      console.log("Extracted Players:", playersList);

      setPlayers(playersList);
      setFilteredPlayers(playersList);
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

  // Filter players based on search and status
  useEffect(() => {
    let filtered = players;

    if (searchQuery) {
      filtered = filtered.filter(
        (player) =>
          player.player_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          player.player_code
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          player.phone_number?.includes(searchQuery) ||
          player.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((player) => {
        if (statusFilter === "active")
          return player.is_active && !player.is_blacklisted;
        if (statusFilter === "inactive") return !player.is_active;
        if (statusFilter === "blacklisted") return player.is_blacklisted;
        return true;
      });
    }

    setFilteredPlayers(filtered);
  }, [searchQuery, statusFilter, players]);

  // Fetch player transactions
  const fetchPlayerTransactions = async (playerId) => {
    if (!playerId) {
      console.error("fetchPlayerTransactions: playerId is undefined");
      setPlayerTransactions([]);
      setLoadingTransactions(false);
      return;
    }

    try {
      setLoadingTransactions(true);
      console.log("Fetching transactions for playerId:", playerId);
      const transactions = await transactionService.getPlayerTransactionHistory(
        token,
        playerId
      );
      console.log("Transactions received:", transactions);
      setPlayerTransactions(transactions);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setPlayerTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleViewPlayer = async (player) => {
    console.log("Selected player:", player);
    setSelectedPlayer(player);
    setShowPlayerDialog(true);
    await fetchPlayerTransactions(player.player_id);
  };

  const getStatusBadge = (player) => {
    if (player.is_blacklisted) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Blacklisted
        </Badge>
      );
    }
    if (!player.is_active) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Inactive
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="bg-green-600 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Active
      </Badge>
    );
  };

  const getKYCBadge = (status) => {
    const variants = {
      completed: {
        variant: "default",
        className: "bg-green-600",
        label: "Verified",
      },
      pending: {
        variant: "default",
        className: "bg-yellow-600",
        label: "Pending",
      },
      rejected: { variant: "destructive", label: "Rejected" },
      not_started: { variant: "secondary", label: "Not Started" },
    };
    const config = variants[status] || variants.not_started;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPlayerTypeBadge = (type) => {
    const variants = {
      regular: { className: "bg-blue-100 text-blue-700", label: "Regular" },
      vip: { className: "bg-purple-100 text-purple-700", label: "VIP" },
      occasional: {
        className: "bg-gray-100 text-gray-700",
        label: "Occasional",
      },
    };
    const config = variants[type] || variants.occasional;
    return <Badge className={config.className}>{config.label}</Badge>;
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
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case "settle_credit":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "expense":
        return <Receipt className="w-5 h-5 text-orange-600" />;
      default:
        return <Receipt className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case "buy_in":
        return "text-green-600";
      case "cash_payout":
        return "text-red-600";
      case "issue_credit":
        return "text-blue-600";
      case "settle_credit":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const stats = {
    total: players.length,
    active: players.filter((p) => p.is_active && !p.is_blacklisted).length,
    inactive: players.filter((p) => !p.is_active).length,
    blacklisted: players.filter((p) => p.is_blacklisted).length,
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-black">
              Players Management
            </h1>
            <p className="text-sm text-gray-600">
              Manage and monitor all players
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchPlayers} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Players</p>
                  <p className="text-2xl font-bold text-black">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Players</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.active}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inactive Players</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.inactive}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Blacklisted</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.blacklisted}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative bg-white">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, code, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Players</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                  <SelectItem value="blacklisted">Blacklisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Players List */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-black">
              All Players ({filteredPlayers.length})
            </CardTitle>
            <CardDescription className="text-black">
              Complete list of registered players
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No players found</p>
                {searchQuery && (
                  <Button
                    variant="link"
                    onClick={() => setSearchQuery("")}
                    className="text-blue-600"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPlayers.map((player) => (
                  <div
                    key={player.player_id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-blue-600 text-white font-semibold">
                          {getInitials(player.player_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-black">
                            {player.player_name}
                          </h3>
                          <Badge className="text-xs">
                            {player.player_code}
                          </Badge>
                          {getStatusBadge(player)}
                          {getKYCBadge(player.kyc_status)}
                          {getPlayerTypeBadge(player.player_type)}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {player.phone_number}
                          </span>
                          {player.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {player.email}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {player.visit_count} visits
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden lg:block">
                        <p className="text-xs text-gray-600">
                          Outstanding Credit
                        </p>
                        <p className="text-sm font-semibold text-orange-600">
                          {formatCurrency(player.outstanding_credit)}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleViewPlayer(player)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Player Details Dialog with Tabs */}
        <Dialog open={showPlayerDialog} onOpenChange={setShowPlayerDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle className="text-black">Player Details</DialogTitle>
              <DialogDescription className="text-black">
                Complete information and transaction history
              </DialogDescription>
            </DialogHeader>

            {selectedPlayer && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="transactions">
                    <History className="w-4 h-4 mr-2" />
                    Transactions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6 mt-6">
                  {/* Profile Section */}
                  <div className="flex items-start gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarFallback className="bg-blue-600 text-white text-2xl font-semibold uppercase">
                        {getInitials(selectedPlayer.player_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-black mb-2 uppercase">
                        {selectedPlayer.player_name}
                      </h3>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {getStatusBadge(selectedPlayer)}
                        {getKYCBadge(selectedPlayer.kyc_status)}
                        {getPlayerTypeBadge(selectedPlayer.player_type)}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Player ID</p>
                          <p className="font-medium text-black">
                            {selectedPlayer.player_id}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Player Code</p>
                          <p className="font-medium text-black">
                            {selectedPlayer.player_code}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="pt-4">
                          <p className="text-xs text-gray-600 mb-1">
                            Phone Number
                          </p>
                          <p className="font-medium text-black">
                            {selectedPlayer.phone_number}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="pt-4">
                          <p className="text-xs text-gray-600 mb-1">Email</p>
                          <p className="font-medium text-black">
                            {selectedPlayer.email || "Not provided"}
                          </p>
                        </CardContent>
                      </Card>
                      {selectedPlayer.address && (
                        <Card className="bg-gray-50 border-gray-200 sm:col-span-2">
                          <CardContent className="pt-4">
                            <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Address
                            </p>
                            <p className="font-medium text-black">
                              {selectedPlayer.address}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div>
                    <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Financial Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="pt-4">
                          <p className="text-xs text-gray-600 mb-1">
                            Total Buy-Ins
                          </p>
                          <p className="text-lg font-bold text-green-700">
                            {formatCurrency(selectedPlayer.total_buy_ins)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-red-50 border-red-200">
                        <CardContent className="pt-4">
                          <p className="text-xs text-gray-600 mb-1">
                            Total Cash Outs
                          </p>
                          <p className="text-lg font-bold text-red-700">
                            {formatCurrency(selectedPlayer.total_cash_outs)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-4">
                          <p className="text-xs text-gray-600 mb-1">
                            Credits Issued
                          </p>
                          <p className="text-lg font-bold text-blue-700">
                            {formatCurrency(
                              selectedPlayer.total_credits_issued
                            )}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="pt-4">
                          <p className="text-xs text-gray-600 mb-1">
                            Credits Settled
                          </p>
                          <p className="text-lg font-bold text-purple-700">
                            {formatCurrency(
                              selectedPlayer.total_credits_settled
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Credit Information */}
                  <div>
                    <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Credit Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="bg-orange-50 border-orange-200">
                        <CardContent className="pt-4">
                          <p className="text-xs text-gray-600 mb-1">
                            Outstanding Credit
                          </p>
                          <p className="text-xl font-bold text-orange-700">
                            {formatCurrency(selectedPlayer.outstanding_credit)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="pt-4">
                          <p className="text-xs text-gray-600 mb-1">
                            Credit Limit
                          </p>
                          <p className="text-xl font-bold text-black">
                            {formatCurrency(selectedPlayer.credit_limit)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Activity Information */}
                  <div>
                    <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Activity Information
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Total Visits</span>
                        <span className="font-semibold text-black">
                          {selectedPlayer.visit_count}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Last Visit</span>
                        <span className="font-medium text-black">
                          {selectedPlayer.last_visit_date
                            ? formatDate(selectedPlayer.last_visit_date)
                            : "Never"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Member Since</span>
                        <span className="font-medium text-black">
                          {formatDate(selectedPlayer.created_at)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Last Updated</span>
                        <span className="font-medium text-black">
                          {formatDateTime(selectedPlayer.updated_at)}
                        </span>
                      </div>
                      {selectedPlayer.kyc_completed_at && (
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">KYC Completed</span>
                          <span className="font-medium text-black">
                            {formatDateTime(selectedPlayer.kyc_completed_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes and Blacklist */}
                  {(selectedPlayer.notes ||
                    selectedPlayer.blacklist_reason) && (
                    <div>
                      <h4 className="font-semibold text-black mb-3">
                        Additional Information
                      </h4>
                      <div className="space-y-3">
                        {selectedPlayer.notes && (
                          <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="pt-4">
                              <p className="text-xs text-gray-600 mb-2 font-medium">
                                Notes
                              </p>
                              <p className="text-sm text-black">
                                {selectedPlayer.notes}
                              </p>
                            </CardContent>
                          </Card>
                        )}
                        {selectedPlayer.blacklist_reason && (
                          <Card className="bg-red-50 border-red-200">
                            <CardContent className="pt-4">
                              <p className="text-xs text-red-600 mb-2 font-medium">
                                Blacklist Reason
                              </p>
                              <p className="text-sm text-red-700">
                                {selectedPlayer.blacklist_reason}
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="transactions" className="mt-6">
                  {loadingTransactions ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : playerTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        No transactions found for this player
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
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
                              <p className="font-medium text-black capitalize">
                                {transaction.transaction_type.replace(
                                  /_/g,
                                  " "
                                )}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatDateTime(transaction.created_at)}
                              </p>
                              {transaction.payment_mode && (
                                <Badge
                                  variant="outline"
                                  className="mt-1 capitalize text-xs text-black"
                                >
                                  {transaction.payment_mode.replace(/_/g, " ")}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p
                              className={`text-lg font-semibold ${getTransactionColor(
                                transaction.transaction_type
                              )}`}
                            >
                              {["buy_in", "settle_credit"].includes(
                                transaction.transaction_type
                              )
                                ? "+"
                                : "-"}
                              {formatCurrency(transaction.amount)}
                            </p>
                            {transaction.chips_amount > 0 && (
                              <p className="text-sm text-gray-600">
                                Chips: {transaction.chips_amount}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Player Dialog */}
        <AddPlayerDialog
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onPlayerAdded={(newPlayer) => {
            // Add the new player to the list
            setPlayers((prev) => [...prev, newPlayer]);
            setFilteredPlayers((prev) => [...prev, newPlayer]);

            // Show success message or reload
            console.log("New player added:", newPlayer);
          }}
        />
      </div>
    </CashierLayout>
  );
};

export default Players;
