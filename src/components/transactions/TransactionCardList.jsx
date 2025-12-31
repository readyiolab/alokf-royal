import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import TransactionNotesModal from './TransactionNotesModal';
import ReverseTransactionModal from './ReverseTransactionModal';

const TransactionCardList = ({ transactions = [], onRefresh, disableNotesAndReversal = false }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);

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
    const isInflow = ['buy_in', 'settle_credit', 'add_float', 'deposit_cash'].includes(type);
    
    return {
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      isInflow,
      icon: isInflow ? TrendingUp : TrendingDown,
      iconColor: isInflow ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50',
      amountColor: isInflow ? 'text-green-600' : 'text-red-600',
    };
  };

  const generateTransactionId = (t) => {
    if (t.transaction_id) {
      const prefix = t.transaction_type === 'cash_payout' || t.transaction_type === 'reversal' || t.is_reversed ? 'REV' : 'BUY';
      const date = new Date(t.created_at).toISOString().split('T')[0].replace(/-/g, '');
      const shortId = String(t.transaction_id).slice(-4).toUpperCase();
      return `${prefix}-${date}-${shortId}`;
    }
    return 'N/A';
  };

  const formatReversalReason = (reason) => {
    const reasonMap = {
      'wrong_amount_entered': 'Wrong amount entered',
      'duplicate_entry': 'Duplicate entry',
      'upi_failed': 'UPI failed',
      'wrong_player_selected': 'Wrong player selected',
      'system_error': 'System error',
      'other': 'Other',
    };
    return reasonMap[reason] || reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleAddNote = (transaction) => {
    setSelectedTransaction(transaction);
    setShowNotesModal(true);
  };

  const handleReverse = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReverseModal(true);
  };

  const handleNoteAdded = () => {
    onRefresh?.();
  };

  const handleReversed = () => {
    onRefresh?.();
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
          const isReversed = transaction.is_reversed === 1 || transaction.is_reversed === true || transaction.reversal_transaction_id;
          const hasNotes = (transaction.notes_count || 0) > 0;
          const isResolved = transaction.notes_resolved === 1 || transaction.notes_resolved === true || false;

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
                        {isReversed && (
                          <Badge className="bg-pink-100 text-pink-700 text-xs">Reversed</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        {(() => {
                          // For float additions, show "CEO" if admin, otherwise cashier name
                          if (transaction.transaction_type === 'add_float') {
                            if (transaction.cashier_role === 'admin') {
                              return 'CEO';
                            }
                            return transaction.cashier_name || 'CEO';
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
                      </p>
                      {(transaction.created_by_full_name || transaction.created_by_name) && (
                        <p className="text-xs text-blue-600 font-medium mt-1">
                          Processed by: {transaction.created_by_full_name || transaction.created_by_name}
                        </p>
                      )}
                      
                      {/* Chip Breakdown - Show if chips are involved */}
                      {(transaction.chips_100 > 0 || transaction.chips_500 > 0 || transaction.chips_5000 > 0 || transaction.chips_10000 > 0) && (
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
                      
                      {/* Bonus Indicator - Show if chips_amount > amount (bonus was applied) */}
                      {transaction.chips_amount && transaction.amount && parseFloat(transaction.chips_amount) > parseFloat(transaction.amount) && (
                        <div className="mt-2">
                          <Badge className="bg-amber-100 text-amber-700 text-xs border border-amber-200">
                            Bonus: {formatCurrency(parseFloat(transaction.chips_amount) - parseFloat(transaction.amount))}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Status Badges - Resolved above Reversal Entry - hidden if disabled */}
                      {!disableNotesAndReversal && (
                        <div className="mt-2 space-y-2">
                          {/* Resolved Status - shows above Reversal Entry */}
                          {isResolved && (
                            <div className="p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-700 font-medium">Resolved</span>
                            </div>
                          )}
                          
                          {/* Reversal Entry Indicator with Reason */}
                          {isReversed && (
                            <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <RotateCcw className="w-4 h-4 text-orange-600" />
                                <span className="text-sm text-orange-700 font-medium">Reversal Entry</span>
                              </div>
                              {transaction.reversal_reason && (
                                <p className="text-xs text-orange-600 ml-6">
                                  {formatReversalReason(transaction.reversal_reason)}
                                </p>
                              )}
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
                    
                    {/* Reverse Button - only if not already reversed and not disabled */}
                    {!disableNotesAndReversal && !isReversed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReverse(transaction)}
                        className="text-gray-600 hover:text-red-600"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {/* Amount */}
                    <div className="text-right min-w-[100px]">
                      <p className={`text-lg font-bold ${amountColor}`}>
                        {isInflow ? '+' : ''}{formatCurrency(transaction.amount || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modals - only show if notes/reversal are enabled */}
      {!disableNotesAndReversal && selectedTransaction && (
        <>
          <TransactionNotesModal
            open={showNotesModal}
            onOpenChange={setShowNotesModal}
            transaction={selectedTransaction}
            onNoteAdded={handleNoteAdded}
          />
          
          <ReverseTransactionModal
            open={showReverseModal}
            onOpenChange={setShowReverseModal}
            transaction={selectedTransaction}
            onReversed={handleReversed}
          />
        </>
      )}
    </>
  );
};

export default TransactionCardList;

