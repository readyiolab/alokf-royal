// ============================================
// FILE: components/cashier/TransactionHistoryTabs.jsx
// Tabbed view for transaction history with inline credit limit editing
// ============================================

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  History,
  Users,
  BookOpen,
  Coins,
  Receipt,
  Phone,
  Mail,
  Activity,
  Eye,
  CreditCard,
  Check,
  Loader2,
  Pencil,
  X,
} from 'lucide-react';
import TransactionList from '../transactions/TransactionList';
import TransactionCardList from '../transactions/TransactionCardList';
import playerService from '../../services/player.service';

const TransactionHistoryTabs = ({
  allTransactions,
  cashbookTransactions,
  chipLedgerTransactions,
  creditRegisterTransactions,
  players,
  uniquePlayers,
  onViewPlayer,
  formatCurrency,
  onRefresh,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('cashbook');
  
  // Track which player is being edited
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [savingLimit, setSavingLimit] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (player) => {
    if (!player) return null;
    const status = player.status || 'active';
    const statusConfig = {
      active: { text: 'Active', color: 'bg-green-100 text-green-800' },
      inactive: { text: 'Inactive', color: 'bg-gray-100 text-gray-800' },
      suspended: { text: 'Suspended', color: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status] || statusConfig.active;
    return <Badge className={`text-xs ${config.color}`}>{config.text}</Badge>;
  };

  const getKYCBadge = (kycStatus) => {
    if (!kycStatus) return null;
    const kycConfig = {
      verified: { text: 'KYC Verified', color: 'bg-green-100 text-green-800' },
      pending: { text: 'KYC Pending', color: 'bg-yellow-100 text-yellow-800' },
      rejected: { text: 'KYC Rejected', color: 'bg-red-100 text-red-800' },
      not_submitted: { text: 'KYC Not Submitted', color: 'bg-gray-100 text-gray-800' },
    };
    const config = kycConfig[kycStatus] || kycConfig.not_submitted;
    return (
      <Badge variant="outline" className={`text-xs ${config.color}`}>
        {config.text}
      </Badge>
    );
  };

  const getPlayerTypeBadge = (playerType) => {
    if (!playerType) return null;
    const typeConfig = {
      regular: { text: 'Regular', color: 'bg-blue-100 text-blue-800' },
      vip: { text: 'VIP', color: 'bg-purple-100 text-purple-800' },
      high_roller: { text: 'High Roller', color: 'bg-orange-100 text-orange-800' },
    };
    const config = typeConfig[playerType] || typeConfig.regular;
    return (
      <Badge variant="outline" className={`text-xs ${config.color}`}>
        {config.text}
      </Badge>
    );
  };

  // Format number without decimals
  const formatLimit = (value) => {
    const num = parseInt(value) || 0;
    return num.toLocaleString('en-IN');
  };

  // Get credit limit value
  const getCreditLimit = (player) => {
    return parseInt(player.credit_limit_personal) || parseInt(player.credit_limit) || 0;
  };

  // Start editing
  const handleStartEdit = (player) => {
    setEditingPlayer(player.player_id);
    setEditValue(getCreditLimit(player).toString());
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingPlayer(null);
    setEditValue('');
  };

  // Save credit limit
  const handleSaveCreditLimit = async (player) => {
    const newLimit = parseInt(editValue) || 0;
    
    setSavingLimit(true);
    
    try {
      await playerService.setPlayerCreditLimit(player.player_id, newLimit);
      
      toast({
        title: 'Credit Limit Updated',
        description: `Credit limit for ${player.player_name} set to ₹${formatLimit(newLimit)}`,
      });

      // Update the player object locally
      player.credit_limit_personal = newLimit;
      
      // Close edit mode
      setEditingPlayer(null);
      setEditValue('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update credit limit',
      });
    } finally {
      setSavingLimit(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
          <History className="w-5 h-5 text-blue-600" />
          Recent History
        </h2>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm text-black flex items-center">
            <Users className="w-3 h-3 mr-1" />
            {uniquePlayers} players today
          </Badge>
          <Badge variant="outline" className="text-sm text-black flex items-center">
            {allTransactions.length} transactions
          </Badge>
        </div>
      </div>

      <Card className="border-2 border-gray-200 shadow-xl overflow-hidden text-black">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-200 bg-gray-50">
            <TabsList className="w-full grid grid-cols-4 h-auto p-0 bg-transparent">
              <TabsTrigger value="cashbook" className="rounded-none py-4 font-semibold text-black">
                <BookOpen className="w-4 h-4 mr-2" />
                Daily Cashbook
                <Badge variant="secondary" className="ml-2">
                  {cashbookTransactions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="chip-ledger" className="rounded-none py-4 font-semibold text-black">
                <Coins className="w-4 h-4 mr-2" />
                Chip Ledger
                <Badge variant="secondary" className="ml-2">
                  {chipLedgerTransactions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="credit-register" className="rounded-none py-4 font-semibold">
                <Receipt className="w-4 h-4 mr-2" />
                Credit Register
                <Badge variant="secondary" className="ml-2">
                  {creditRegisterTransactions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="players" className="rounded-none py-4 font-semibold">
                <Users className="w-4 h-4 mr-2" />
                Players
                <Badge variant="secondary" className="ml-2">
                  {uniquePlayers}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-0">
            <TabsContent value="cashbook" className="m-0 p-4">
              <TransactionCardList
                transactions={cashbookTransactions}
                onRefresh={onRefresh || (() => window.location.reload())}
              />
            </TabsContent>

            <TabsContent value="chip-ledger" className="m-0">
              <TransactionList
                transactions={chipLedgerTransactions}
                emptyMessage="No chip movements yet today"
              />
            </TabsContent>

            <TabsContent value="credit-register" className="m-0">
              <TransactionList
                transactions={creditRegisterTransactions}
                emptyMessage="No credit transactions yet today"
              />
            </TabsContent>

            <TabsContent value="players" className="m-0 bg-white">
              <div className="p-6 space-y-3">
                {players.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No players found.</div>
                ) : (
                  players.map((player) => (
                    <div
                      key={player.player_id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors gap-4"
                    >
                      {/* Player Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Avatar className="w-12 h-12 flex-shrink-0">
                          <AvatarFallback className="bg-blue-600 text-white font-semibold">
                            {getInitials(player.player_name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-black">{player.player_name}</h3>
                            <Badge className="text-xs">{player.player_code}</Badge>
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

                      {/* Outstanding Credit */}
                      <div className="text-center flex-shrink-0 hidden md:block">
                        <p className="text-xs text-gray-500 mb-1">Outstanding</p>
                        <p className="text-sm font-bold text-orange-600">
                          ₹{formatLimit(player.outstanding_credit || 0)}
                        </p>
                      </div>

                      {/* Credit Limit - Edit Mode or Display Mode */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {editingPlayer === player.player_id ? (
                          // Edit Mode
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                              <Input
                                type="number"
                                min="0"
                                step="1000"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-28 h-9 pl-6 text-sm font-semibold bg-white text-gray-900 border-gray-300"
                                placeholder="0"
                                autoFocus
                              />
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSaveCreditLimit(player)}
                              disabled={savingLimit}
                              className="h-9 px-2 bg-green-600 hover:bg-green-700 text-white"
                            >
                              {savingLimit ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              disabled={savingLimit}
                              className="h-9 px-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          // Display Mode
                          <div className="flex items-center gap-2">
                            <div className="text-center">
                              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                Credit Limit
                              </p>
                              <p className="text-sm font-bold text-blue-600">
                                ₹{formatLimit(getCreditLimit(player))}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEdit(player)}
                              className="h-8 px-2 text-gray-600 hover:text-blue-600"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* View Button */}
                      <Button
                        onClick={() => onViewPlayer(player)}
                        className="bg-black text-white flex-shrink-0"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default TransactionHistoryTabs;
