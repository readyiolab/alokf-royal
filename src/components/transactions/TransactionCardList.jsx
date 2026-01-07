import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  CheckCircle,
  Image as ImageIcon,
  Pencil,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import TransactionNotesModal from './TransactionNotesModal';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerSearch } from '../../hooks/usePlayerSearch';
import transactionService from '../../services/transaction.service';
import { useToast } from '@/hooks/use-toast';

const TransactionCardList = ({ transactions = [], onRefresh, disableNotesAndReversal = false }) => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [attachmentTransaction, setAttachmentTransaction] = useState(null);
  const [showEditPlayerModal, setShowEditPlayerModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  
  const {
    allPlayers,
    loadAllPlayers,
    searchQuery,
    setSearchQuery,
    filteredPlayers,
  } = usePlayerSearch();

  useEffect(() => {
    if (token && showEditPlayerModal) {
      loadAllPlayers(token, { reuseExisting: true });
    }
  }, [token, showEditPlayerModal]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(Math.abs(amount || 0));
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const getTransactionTypeInfo = (t) => {
    const type = t.transaction_type || '';
    const activityType = t.activity_type || '';
    
    // ✅ Determine inflow/outflow
    // Inflow = money/chips coming IN to cashier
    // Outflow = money/chips going OUT from cashier
    const inflowTypes = [
      'buy_in',           // Cash coming in
      'settle_credit',     // Cash coming in (credit repayment)
      'add_float',         // Cash coming in (float addition)
      'deposit_cash',      // Cash coming in (deposit)
      'deposit_chips',     // Chips coming in (stored)
      'opening_chips',     // Chips coming in (opening inventory)
      'redeem_stored',     // Chips coming in (from stored)
    ];
    
    const outflowTypes = [
      'cash_payout',       // Cash going out
      'credit_issued',     // Chips going out (credit)
      'issue_credit',      // Chips going out (credit)
      'return_chips',      // Chips going out (returned to player)
    ];
    
    // Special case: dealer tips and player expenses - chips come IN to cashier
    // (even though cash goes OUT, the chips come back)
    const isChipInflow = activityType === 'dealer_tip' || activityType === 'player_expense';
    
    // Special case: rakeback - chips go OUT to players
    const isRakeback = activityType === 'rakeback' || type === 'rakeback';
    
    // Determine if this is an inflow
    let isInflow = inflowTypes.includes(type);
    
    // Override for outflow types
    if (outflowTypes.includes(type) || isRakeback) {
      isInflow = false;
    }
    
    // ✅ Proper naming convention - ALL transaction types
    const typeLabels = {
      'buy_in': 'Buy-in',
      'cash_payout': 'Cash Payout',
      'deposit_chips': 'Deposit Chips',
      'deposit_cash': 'Deposit Cash',
      'return_chips': 'Return Chips',
      'opening_chips': 'Opening Chips',
      'settle_credit': 'Settle Credit',
      'credit_issued': 'Issue Credit',
      'issue_credit': 'Issue Credit',
      'add_float': 'Add Float',
      'expense': activityType === 'club_expense' ? 'Club Expense' : 
                 activityType === 'dealer_tip' ? 'Dealer Tip' :
                 activityType === 'player_expense' ? 'Player Expense' : 'Expense',
      'redeem_stored': 'Redeem Stored',
      'rakeback': 'Rakeback',
    };
    
    let label = typeLabels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // For club expenses, add category label if available
    if (activityType === 'club_expense' && t.notes) {
      const categoryMatch = t.notes.match(/Category:\s*([^|]+)/);
      if (categoryMatch) {
        label = `Club Expense - ${categoryMatch[1].trim()}`;
      }
    }
    
    // For dealer tips, show as "Dealer Tip"
    if (activityType === 'dealer_tip') {
      label = 'Dealer Tip';
    }
    
    // For player expenses, show as "Player Expense"
    if (activityType === 'player_expense') {
      label = 'Player Expense';
    }
    
    // ✅ For rakeback, show as "Rakeback"
    if (activityType === 'rakeback' || type === 'rakeback') {
      label = 'Rakeback';
    }
    
    // ✅ For credit issued, show as "Issue Credit" (chips going OUT)
    if (type === 'credit_issued' || type === 'issue_credit') {
      label = 'Issue Credit';
    }
    
    // For chip ledger display: dealer tips and player expenses show as chips IN (green)
    // because chips are being returned to cashier even though cash goes out
    const displayAsInflow = isInflow || isChipInflow;
    
    return {
      label,
      isInflow: displayAsInflow,
      isChipInflow,  // Extra flag to indicate chips coming in
      icon: displayAsInflow ? TrendingUp : TrendingDown,
      iconColor: displayAsInflow ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50',
      amountColor: displayAsInflow ? 'text-green-600' : 'text-red-600',
    };
  };

  const generateTransactionId = (t) => {
    if (t.transaction_id) {
      // Determine prefix based on transaction type
      let prefix = 'TXN';
      const type = t.transaction_type || '';
      if (type === 'credit_issued' || type === 'issue_credit') prefix = 'CRD';
      else if (type === 'settle_credit') prefix = 'STL';
      else if (type === 'return_chips' || type === 'redeem_stored') prefix = 'RET';
      else if (type === 'buy_in') prefix = 'BUY';
      else if (type === 'cash_payout') prefix = 'PAY';
      
      const date = new Date(t.created_at || Date.now()).toISOString().split('T')[0].replace(/-/g, '');
      const shortId = String(t.transaction_id).slice(-4).toUpperCase();
      return `${prefix}-${date}-${shortId}`;
    }
    // Fallback: use credit_id or other identifier
    if (t.credit_id) {
      return `CRD-${String(t.credit_id).slice(-4).toUpperCase()}`;
    }
    // Last resort: use timestamp
    const timestamp = new Date(t.created_at || Date.now()).getTime().toString().slice(-6);
    return `TXN-${timestamp}`;
  };

  const handleAddNote = (transaction) => {
    setSelectedTransaction(transaction);
    setShowNotesModal(true);
  };

  const handleNoteAdded = () => {
    onRefresh?.();
  };

  const handleViewScreenshot = (transaction) => {
    if (transaction.screenshot_url) {
      setScreenshotUrl(transaction.screenshot_url);
      setAttachmentTransaction(null);
      setShowScreenshotModal(true);
    }
  };

  const handleViewAttachment = (transaction) => {
    if (transaction.attachment_url) {
      setScreenshotUrl(transaction.attachment_url);
      setAttachmentTransaction(transaction);
      setShowScreenshotModal(true);
    }
  };

  const handleEditPlayerName = (transaction) => {
    setEditingTransaction(transaction);
    setSelectedPlayerId(transaction.player_id || null);
    setSearchQuery('');
    setShowEditPlayerModal(true);
  };

  const handleSavePlayerName = async () => {
    if (!editingTransaction || !selectedPlayerId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a player',
      });
      return;
    }

    setSavingEdit(true);
    try {
      const selectedPlayer = allPlayers.find(p => p.player_id === selectedPlayerId);
      if (!selectedPlayer) {
        throw new Error('Selected player not found');
      }

      await transactionService.updateTransactionPlayerName(
        token,
        editingTransaction.transaction_id,
        selectedPlayer.player_id,
        selectedPlayer.player_name
      );

      toast({
        title: 'Success',
        description: 'Player name updated successfully',
      });

      setShowEditPlayerModal(false);
      setEditingTransaction(null);
      setSelectedPlayerId(null);
      onRefresh?.();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update player name',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium text-lg">No transactions yet</p>
        <p className="text-gray-500 text-sm mt-2">Transactions will appear here when they are created</p>
      </div>
    );
  }

  // Sort by created_at DESC (newest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  return (
    <>
      <div className="space-y-3">
        {sortedTransactions.map((transaction) => {
          const { label, isInflow, icon: Icon, iconColor, amountColor } = getTransactionTypeInfo(transaction);
          const transactionId = generateTransactionId(transaction);
          const hasNotes = (transaction.notes_count || 0) > 0;
          const isResolved = transaction.notes_resolved === 1 || transaction.notes_resolved === true || false;
          const isEdited = transaction.is_edited === 1 || transaction.is_edited === true;

          return (
            <Card key={transaction.transaction_id || transaction.id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  {/* Left: Transaction Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-full ${iconColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 capitalize">{label}</h3>
                        <Badge variant="outline" className="text-xs">
                          {transactionId}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span>
                          {(() => {
                            // For float additions, show "CEO" if admin, otherwise cashier name
                            if (transaction.transaction_type === 'add_float') {
                              if (transaction.cashier_role === 'admin') {
                                return 'CEO';
                              }
                              return transaction.cashier_name || 'CEO';
                            }
                            // For opening_chips, show "System"
                            if (transaction.transaction_type === 'opening_chips') {
                              return 'System';
                            }
                            // For deposit_chips (storing chips), show player name with "Stored"
                            if (transaction.transaction_type === 'deposit_chips') {
                              return transaction.player_name ? `${transaction.player_name} (Stored)` : 'Stored';
                            }
                            // For redeem_stored (redeeming stored chips), show player name
                            if (transaction.transaction_type === 'redeem_stored') {
                              return transaction.player_name || 'System';
                            }
                            // For other transactions, show player name or System
                            return transaction.player_name || 'System';
                          })()} • {formatTime(transaction.created_at)}
                          {/* Show payment mode for buy-in transactions */}
                          {transaction.transaction_type === 'buy_in' && transaction.payment_mode && (
                            <span className="ml-2">
                              • <span className="font-medium">
                                {transaction.payment_mode === 'cash' ? 'Cash' : 
                                 transaction.payment_mode.startsWith('online_') ? 'Online' : 
                                 transaction.payment_mode.replace('online_', '').toUpperCase()}
                              </span>
                            </span>
                          )}
                          {/* Show payment mode for settle_credit transactions */}
                          {transaction.transaction_type === 'settle_credit' && transaction.payment_mode && (
                            <span className="ml-2">
                              • <span className="font-medium">
                                {transaction.payment_mode === 'cash' ? 'Cash' : 
                                 transaction.payment_mode.startsWith('online_') ? 'Online' : 
                                 transaction.payment_mode.replace('online_', '').toUpperCase()}
                              </span>
                            </span>
                          )}
                        </span>
                        {/* Small screenshot icon for online buy-ins */}
                        {transaction.transaction_type === 'buy_in' && 
                         transaction.payment_mode && 
                         transaction.payment_mode !== 'cash' && 
                         transaction.screenshot_url && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="text-blue-600 hover:text-blue-700 transition-colors ml-2"
                                title="View Payment Screenshot"
                              >
                                <ImageIcon className="w-4 h-4" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2" align="start">
                              <img
                                src={transaction.screenshot_url}
                                alt="Payment Screenshot"
                                className="w-64 h-auto rounded border border-gray-200"
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                        {/* Small screenshot icon for online settle_credit transactions */}
                        {transaction.transaction_type === 'settle_credit' && 
                         transaction.payment_mode && 
                         transaction.payment_mode !== 'cash' && 
                         transaction.screenshot_url && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="text-blue-600 hover:text-blue-700 transition-colors ml-2"
                                title="View Payment Screenshot"
                              >
                                <ImageIcon className="w-4 h-4" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2" align="start">
                              <img
                                src={transaction.screenshot_url}
                                alt="Payment Screenshot"
                                className="w-64 h-auto rounded border border-gray-200"
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                        {/* Small attachment icon for club expenses */}
                        {transaction.attachment_url && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="text-blue-600 hover:text-blue-700 transition-colors"
                                title="View Attachment"
                              >
                                <ImageIcon className="w-4 h-4" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2" align="start">
                              <img
                                src={transaction.attachment_url}
                                alt="Expense Attachment"
                                className="w-64 h-auto rounded border border-gray-200"
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      </p>
                      {(transaction.created_by_full_name || transaction.created_by_name) && (
                        <p className="text-xs text-blue-600 font-medium mt-1">
                          Processed by: {transaction.created_by_full_name || transaction.created_by_name}
                        </p>
                      )}
                      
                      {/* Chip Breakdown - Show if chips are involved (includes bonus chips) */}
                      {(transaction.chips_100 > 0 || transaction.chips_500 > 0 || transaction.chips_1000 > 0 || transaction.chips_5000 > 0 || transaction.chips_10000 > 0) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {transaction.chips_100 > 0 && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                              ₹100 × {transaction.chips_100}
                            </Badge>
                          )}
                          {transaction.chips_500 > 0 && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              ₹500 × {transaction.chips_500}
                            </Badge>
                          )}
                          {transaction.chips_1000 > 0 && (
                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                              ₹1K × {transaction.chips_1000}
                            </Badge>
                          )}
                          {transaction.chips_5000 > 0 && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              ₹5K × {transaction.chips_5000}
                            </Badge>
                          )}
                          {transaction.chips_10000 > 0 && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              ₹10K × {transaction.chips_10000}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* Chip Value Display - For opening_chips, deposit_chips, redeem_stored */}
                      {(() => {
                        const isChipTransaction = transaction.transaction_type === 'opening_chips' || 
                                                   transaction.transaction_type === 'deposit_chips' ||
                                                   transaction.transaction_type === 'redeem_stored';
                        
                        if (isChipTransaction) {
                          let chipValue = 0;
                          if (transaction.chips_amount && parseFloat(transaction.chips_amount) > 0) {
                            chipValue = parseFloat(transaction.chips_amount);
                          } else {
                            // Calculate from chip breakdown
                            chipValue = 
                              (parseInt(transaction.chips_100 || 0) * 100) +
                              (parseInt(transaction.chips_500 || 0) * 500) +
                              (parseInt(transaction.chips_1000 || 0) * 1000) +
                              (parseInt(transaction.chips_5000 || 0) * 5000) +
                              (parseInt(transaction.chips_10000 || 0) * 10000);
                          }
                          
                          if (chipValue > 0) {
                            const label = transaction.transaction_type === 'opening_chips' ? 'Opening Chips Value' :
                                         transaction.transaction_type === 'deposit_chips' ? 'Chips Deposited' :
                                         'Chips Redeemed';
                            
                            return (
                              <div className="mt-2">
                                <Badge className="bg-blue-100 text-blue-700 text-xs border border-blue-200 font-semibold">
                                  {label}: {formatCurrency(chipValue)}
                                </Badge>
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}

                      {/* Bonus Indicator - Show if chips_amount > amount (bonus was applied) */}
                      {transaction.chips_amount && transaction.amount && parseFloat(transaction.chips_amount) > parseFloat(transaction.amount) && (
                        <div className="mt-2">
                          <Badge className="bg-amber-100 text-amber-700 text-xs border border-amber-200">
                            Deposit: {formatCurrency(transaction.amount)} + Bonus: {formatCurrency(parseFloat(transaction.chips_amount) - parseFloat(transaction.amount))} = Total: {formatCurrency(transaction.chips_amount)}
                          </Badge>
                        </div>
                      )}

                      
                      {/* Status Badges - Resolved and Edited - hidden if disabled */}
                      {!disableNotesAndReversal && (
                        <div className="mt-2 space-y-2">
                          {/* Resolved Status */}
                          {isResolved && (
                            <div className="p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-700 font-medium">Resolved</span>
                            </div>
                          )}
                          
                          {/* Edited Indicator */}
                          {isEdited && (
                            <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
                              <Pencil className="w-4 h-4 text-orange-600" />
                              <span className="text-sm text-orange-700 font-medium">Edited</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions and Amount */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Add Note Button - hidden if disabled */}
                    {!disableNotesAndReversal && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddNote(transaction)}
                        className="flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {hasNotes && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 border-gray-300 text-gray-700 bg-gray-50">
                            {transaction.notes_count}
                          </Badge>
                        )}
                      </Button>
                    )}

                    {/* Edit Player Name Button - only for transactions with player */}
                    {transaction.player_id && transaction.transaction_type === 'buy_in' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPlayerName(transaction)}
                        className="flex items-center gap-1.5"
                        title="Edit Player Name"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    
                    
                    {/* Amount */}
                    <div className="text-right min-w-[100px]">
                      {(() => {
                        // For opening_chips and deposit_chips, show chips_amount instead of amount
                        const isChipTransaction = transaction.transaction_type === 'opening_chips' || 
                                                   transaction.transaction_type === 'deposit_chips' ||
                                                   transaction.transaction_type === 'redeem_stored';
                        
                        // For chip transactions, use chips_amount if available, otherwise calculate from chip breakdown
                        let displayAmount = transaction.amount || 0;
                        if (isChipTransaction) {
                          if (transaction.chips_amount && parseFloat(transaction.chips_amount) > 0) {
                            displayAmount = parseFloat(transaction.chips_amount);
                          } else {
                            // Calculate from chip breakdown
                            const chipValue = 
                              (parseInt(transaction.chips_100 || 0) * 100) +
                              (parseInt(transaction.chips_500 || 0) * 500) +
                              (parseInt(transaction.chips_1000 || 0) * 1000) +
                              (parseInt(transaction.chips_5000 || 0) * 5000) +
                              (parseInt(transaction.chips_10000 || 0) * 10000);
                            if (chipValue > 0) {
                              displayAmount = chipValue;
                            }
                          }
                        }
                        
                        // Don't show ₹0 for chip transactions
                        if (isChipTransaction && displayAmount === 0) {
                          return null;
                        }
                        
                        return (
                          <p className={`text-lg font-bold ${amountColor}`}>
                            {isInflow ? '+' : ''}{formatCurrency(displayAmount)}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modals - only show if notes are enabled */}
      {!disableNotesAndReversal && selectedTransaction && (
        <TransactionNotesModal
          open={showNotesModal}
          onOpenChange={setShowNotesModal}
          transaction={selectedTransaction}
          onNoteAdded={handleNoteAdded}
        />
      )}

      {/* Screenshot/Attachment Modal */}
      <Dialog open={showScreenshotModal} onOpenChange={setShowScreenshotModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {attachmentTransaction ? 'Expense Attachment' : 'Payment Screenshot'}
            </DialogTitle>
          </DialogHeader>
          {screenshotUrl && (
            <div className="relative w-full">
              <img
                src={screenshotUrl}
                alt={attachmentTransaction ? 'Expense Attachment' : 'Payment Screenshot'}
                className="w-full h-auto rounded-lg border border-gray-200"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Player Name Modal */}
      <Dialog open={showEditPlayerModal} onOpenChange={setShowEditPlayerModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Player Name</DialogTitle>
            <DialogDescription>
              Select the correct player name for this transaction
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Current Name</label>
              <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                {editingTransaction?.player_name || 'N/A'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Select Correct Player</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedPlayerId
                      ? allPlayers.find(p => p.player_id === selectedPlayerId)?.player_name || 'Select player...'
                      : 'Select player...'}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search players..." value={searchQuery} onValueChange={setSearchQuery} />
                    <CommandList>
                      <CommandEmpty>No players found.</CommandEmpty>
                      <CommandGroup>
                        {filteredPlayers.map((player) => (
                          <CommandItem
                            key={player.player_id}
                            value={player.player_id.toString()}
                            onSelect={() => {
                              setSelectedPlayerId(player.player_id);
                            }}
                          >
                            <CheckCircle
                              className={`mr-2 h-4 w-4 ${
                                selectedPlayerId === player.player_id ? 'opacity-100' : 'opacity-0'
                              }`}
                            />
                            {player.player_name} {player.phone_number && `(${player.phone_number})`}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditPlayerModal(false);
                setEditingTransaction(null);
                setSelectedPlayerId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePlayerName}
              disabled={savingEdit || !selectedPlayerId}
            >
              {savingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransactionCardList;

