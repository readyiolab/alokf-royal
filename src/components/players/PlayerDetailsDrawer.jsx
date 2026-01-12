import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  Ban,
  MessageSquare,
  PhoneCall,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import playerService from '../../services/player.service';
import transactionService from '../../services/transaction.service';
import { useAuth } from '../../hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PlayerDetailsDrawer = ({ player, open, onOpenChange, onPlayerUpdated }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [playerData, setPlayerData] = useState(null); // Store updated player data with DigiLocker info
  const [playerStats, setPlayerStats] = useState(null);
  const [playerBalance, setPlayerBalance] = useState(null);
  const [storedBalance, setStoredBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [rakebackTotal, setRakebackTotal] = useState(0);
  const [outstandingCredit, setOutstandingCredit] = useState(0);
  const [bonusTotal, setBonusTotal] = useState(0);
  
  // Transaction filters
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  
  // Block/Unblock player dialog
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking] = useState(false);
  const [unblocking, setUnblocking] = useState(false);
  const [blockError, setBlockError] = useState(null);

  useEffect(() => {
    if (open && player) {
      fetchPlayerDetails();
    }
  }, [open, player]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, transactionTypeFilter, dateRangeFilter]);

  const fetchPlayerDetails = async () => {
    if (!player?.player_id) return;

    setLoading(true);
    try {
      // Fetch updated player data first to get latest blacklist status
      const updatedPlayer = await playerService.getPlayerById(player.player_id).catch(() => null);
      
      // Get current session ID for credit status
      const sessionId = null; // Will fetch across all sessions
      
      // Fetch all data in parallel
      const [
        statsResponse,
        balanceResponse,
        storedResponse,
        transactionsResponse,
        notesResponse,
        rakebackResponse,
        creditStatusResponse,
        bonusResponse,
      ] = await Promise.all([
        playerService.getPlayerStats(player.player_id).catch(() => null),
        transactionService.getPlayerChipBalance(token, player.player_id).catch(() => null),
        transactionService.getPlayerStoredBalance(token, player.player_id).catch(() => null),
        transactionService.getPlayerTransactionHistory(token, player.player_id).catch(() => []),
        playerService.getPlayerNotes(player.player_id).catch(() => []),
        // Rakeback - we'll calculate from transactions
        Promise.resolve({ total: 0 }),
        // Fetch actual outstanding credit from credit service
        playerService.getPlayerCreditStatus(player.player_id, sessionId).catch(() => null),
        // Fetch player bonus
        playerService.getPlayerBonus(player.player_id).catch(() => ({ total_bonus: 0, total_claims: 0 })),
      ]);
      
      // Update player object with latest data if available (including DigiLocker info)
      if (updatedPlayer && updatedPlayer.data) {
        // Store updated player data with DigiLocker info in state
        // Merge with original player to preserve all fields (including DigiLocker info)
        const mergedPlayerData = { ...player, ...updatedPlayer.data };
        setPlayerData(mergedPlayerData);
      } else {
        // Use current player if no update available (may already have DigiLocker info from initial fetch)
        setPlayerData(player);
      }

      setPlayerStats(statsResponse?.data || statsResponse || null);
      setPlayerBalance(balanceResponse || null);
      setStoredBalance(parseFloat(storedResponse?.stored_chips || storedResponse?.total_value || 0));
      setTransactions(Array.isArray(transactionsResponse) ? transactionsResponse : []);
      
      // Update outstanding credit from credit service
      if (creditStatusResponse?.data || creditStatusResponse) {
        const creditData = creditStatusResponse?.data || creditStatusResponse;
        const totalOutstanding = parseFloat(creditData.total_outstanding || 0);
        setOutstandingCredit(totalOutstanding);
        // Also update player object for backward compatibility
        if (currentPlayer) {
          currentPlayer.outstanding_credit = totalOutstanding;
        }
      } else {
        // Fallback to player's outstanding_credit if credit service fails
        setOutstandingCredit(parseFloat(currentPlayer?.outstanding_credit || 0));
      }

      // Update bonus from bonus service
      if (bonusResponse?.data || bonusResponse) {
        const bonusData = bonusResponse?.data || bonusResponse;
        const totalBonus = parseFloat(bonusData.total_bonus || 0);
        setBonusTotal(totalBonus);
      } else {
        setBonusTotal(0);
      }
      
      // Combine notes from tbl_player_notes and player.notes field
      const playerNotesArray = Array.isArray(notesResponse) ? notesResponse : [];
      
      // Get notes from updatedPlayer.data first, then fallback to currentPlayer.notes, then original player.notes
      const playerNotesText = updatedPlayer?.data?.notes || currentPlayer?.notes || player?.notes || null;
      const playerNotesField = playerNotesText ? [{
        note: playerNotesText,
        note_text: playerNotesText,
        created_at: updatedPlayer?.data?.created_at || currentPlayer?.created_at || player?.created_at || new Date(),
        full_name: 'System',
        note_type: 'general'
      }] : [];
      
      // Combine both, with player.notes first
      setNotes([...playerNotesField, ...playerNotesArray]);

      // Calculate rakeback from transactions
      const rakebackAmount = (transactionsResponse || []).reduce((sum, t) => {
        if (t.activity_type === 'rakeback' || t.transaction_type === 'rakeback') {
          return sum + parseFloat(t.amount || t.chip_amount || 0);
        }
        return sum;
      }, 0);
      setRakebackTotal(rakebackAmount);
    } catch (error) {
      console.error('Error fetching player details:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by type
    if (transactionTypeFilter !== 'all') {
      filtered = filtered.filter(t => t.transaction_type === transactionTypeFilter);
    }

    // Filter by date range
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateRangeFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(t => {
        const tDate = new Date(t.created_at);
        return tDate >= filterDate;
      });
    }

    setFilteredTransactions(filtered);
  };


  const handleBlockPlayer = async () => {
    if (!blockReason.trim() || !player?.player_id) return;

    // Validate reason length (minimum 10 characters)
    if (blockReason.trim().length < 10) {
      setBlockError('Reason must be at least 10 characters');
      return;
    }

    setBlockError(null);
    setBlocking(true);
    try {
      await playerService.blacklistPlayer(player.player_id, blockReason.trim());
      setShowBlockDialog(false);
      setBlockReason('');
      if (onPlayerUpdated) onPlayerUpdated();
      await fetchPlayerDetails();
    } catch (error) {
      console.error('Error blocking player:', error);
      const errorMessage = error.message || 'Failed to block player';
      setBlockError(errorMessage);
      
      // Check for validation errors
      if (errorMessage.includes('at least 10 characters')) {
        setBlockError('Reason must be at least 10 characters');
      }
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblockPlayer = async () => {
    if (!player?.player_id) return;

    setUnblocking(true);
    try {
      await playerService.unblacklistPlayer(player.player_id);
      // Update player object immediately
      if (player) {
        player.is_blacklisted = false;
        player.blacklist_reason = null;
      }
      if (onPlayerUpdated) onPlayerUpdated();
      await fetchPlayerDetails();
    } catch (error) {
      console.error('Error unblocking player:', error);
    } finally {
      setUnblocking(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'P';
  };

  const getKYCStatusBadge = (status, playerData = null, originalPlayer = null) => {
    // Check if DigiLocker verification is complete
    // Check both playerData (fetched with DigiLocker info) and originalPlayer prop
    const kycDetails = playerData?.kyc_details || originalPlayer?.kyc_details;
    const panDetails = playerData?.pan_details || originalPlayer?.pan_details;
    
    // Check for DigiLocker verification flags and documents
    const hasDigiLockerVerification = kycDetails?.digilocker_verified === 1 || panDetails?.verified_via_digilocker === 1;
    const hasDocuments = kycDetails?.photo || panDetails?.pan_number || kycDetails?.id_number;
    
    // If status is "submitted" but DigiLocker verification is complete with documents, treat as verified
    if (status === 'submitted' && hasDigiLockerVerification && hasDocuments) {
      return { label: 'KYC Verified', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    }
    
    const statusConfig = {
      approved: { label: 'KYC Verified', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      verified: { label: 'KYC Verified', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { label: 'KYC Pending', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      rejected: { label: 'KYC Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
      submitted: { label: 'KYC Under Review', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    };
    return statusConfig[status] || statusConfig.pending;
  };

  const getTransactionColor = (type) => {
    // ✅ deposit_chips should be green (positive) - chips are being stored/deposited
    if (['buy_in', 'settle_credit', 'deposit_cash', 'redeem_stored', 'deposit_chips'].includes(type)) {
      return 'text-green-600';
    } else if (['cash_payout', 'return_chips', 'expense'].includes(type)) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  if (!player) return null;

  // Get current player data with DigiLocker info for status determination
  const currentPlayerData = playerData || player;
  // Use status from currentPlayerData if available, otherwise fallback to player prop
  const playerKycStatus = currentPlayerData?.kyc_status || player.kyc_status || 'pending';
  // Pass both currentPlayerData and original player to check for DigiLocker info in either
  const kycStatus = getKYCStatusBadge(playerKycStatus, currentPlayerData, player);
  const totalDeposit = parseFloat(player.total_buy_ins || 0);
  const totalWithdrawal = parseFloat(player.total_cash_outs || 0);
  const netPL = totalWithdrawal - totalDeposit;
  const totalHours = playerStats?.total_hours || 0;
  const bonus = bonusTotal; // ✅ FIX: Use fetched bonus from promotion claims
  const creditOutstanding = outstandingCredit > 0 ? outstandingCredit : parseFloat(player.outstanding_credit || 0);
  const lastVisit = player.last_visit_date || playerStats?.last_visit || null;
  const joinedDate = player.created_at;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                <User className="w-8 h-8 text-orange-700" />
              </div>
              <div className="flex-1">
                <SheetTitle className="text-2xl font-bold">{player.player_name}</SheetTitle>
                <div className="flex items-center gap-2 mt-2">
                  
                  <Badge className={kycStatus.color}>
                    <kycStatus.icon className="w-3 h-3 mr-1" />
                    {kycStatus.label}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">@{player.player_code || player.player_id}</p>
              </div>
            </div>
          </SheetHeader>

          {loading && !playerStats ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              <div className="space-y-6">
                {/* Contact & Activity Details */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-600">Phone</p>
                      </div>
                      <p className="font-medium">{player.phone_number || 'N/A'}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-600">Email</p>
                      </div>
                      <p className="font-medium">{player.email || 'N/A'}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-600">Last Visit</p>
                      </div>
                      <p className="font-medium">{lastVisit ? formatDate(lastVisit) : 'N/A'}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-600">Joined</p>
                      </div>
                      <p className="font-medium">{joinedDate ? formatDate(joinedDate) : 'N/A'}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* DigiLocker Verified Information */}
                {(() => {
                  const currentPlayerData = playerData || player;
                  const kycDetails = currentPlayerData?.kyc_details;
                  const panDetails = currentPlayerData?.pan_details;
                  const hasDigiLockerVerification = kycDetails?.digilocker_verified || panDetails?.verified_via_digilocker;
                  
                  if (!hasDigiLockerVerification) return null;
                  
                  return (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-green-600" />
                          DigiLocker Verified Information
                        </h3>
                        
                        {/* DigiLocker Info Grid - Same format as Contact & Activity (2x2 grid, 4 items) */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* PAN Number */}
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <p className="text-xs text-gray-600">PAN Number</p>
                              </div>
                              <p className="font-medium uppercase">{panDetails?.pan_number || 'N/A'}</p>
                            </CardContent>
                          </Card>
                          
                          {/* Name on PAN */}
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-gray-500" />
                                <p className="text-xs text-gray-600">Name on PAN</p>
                              </div>
                              <p className="font-medium uppercase">{panDetails?.name_on_pan || 'N/A'}</p>
                            </CardContent>
                          </Card>
                          
                          {/* Date of Birth */}
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <p className="text-xs text-gray-600">Date of Birth</p>
                              </div>
                              <p className="font-medium">{panDetails?.dob ? formatDate(panDetails.dob) : 'N/A'}</p>
                            </CardContent>
                          </Card>
                          
                          {/* ID Number */}
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <p className="text-xs text-gray-600">ID Number</p>
                              </div>
                              <p className="font-medium">{kycDetails?.id_number || 'N/A'}</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      <Separator />
                    </>
                  );
                })()}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <PhoneCall className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  {player.is_blacklisted ? (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={handleUnblockPlayer}
                      disabled={unblocking}
                    >
                      {unblocking ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Unblocking...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Unblock
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setBlockReason('');
                        setBlockError(null);
                        setShowBlockDialog(true);
                      }}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Block
                    </Button>
                  )}
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-600 mb-1">Total BuyIn</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(totalDeposit)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-600 mb-1">Total Cashpayout</p>
                      <p className="font-bold text-sm">
                          {formatCurrency(
                            filteredTransactions
                              .filter(t => t.transaction_type === 'cash_payout')
                              .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
                          )}
                        </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-600 mb-1">Net P/L</p>
                      <p className={`text-lg font-bold ${netPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(netPL)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-600 mb-1">Total Hours</p>
                      <p className="text-lg font-bold text-gray-900">{totalHours}h</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-600 mb-1">Bonus</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(bonus)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-600 mb-1">Credit Outstanding</p>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(creditOutstanding)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-600 mb-1">Stored Balance</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(storedBalance)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-600 mb-1">Rakeback</p>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(rakebackTotal)}</p>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Session History */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Transaction History</h3>
                    <div className="flex gap-2">
                      <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">Last Week</SelectItem>
                          <SelectItem value="month">Last Month</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="buy_in">Buy-in</SelectItem>
                          <SelectItem value="cash_payout">Cash Out</SelectItem>
                          <SelectItem value="credit_issued">Credit Issued</SelectItem>
                          <SelectItem value="settle_credit">Settle Credit</SelectItem>
                          <SelectItem value="deposit_chips">Deposit Chips</SelectItem>
                          <SelectItem value="redeem_stored">Redeem Stored</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredTransactions.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No transactions found</p>
                    ) : (
                      filteredTransactions
                        .map((transaction) => {
                          const isProfit = ['buy_in', 'settle_credit', 'deposit_cash', 'redeem_stored', 'deposit_chips'].includes(
                            transaction.transaction_type
                          );
                          
                          // For deposit_chips, always use chips_amount or calculate from chip breakdown
                          let displayAmount = 0;
                          if (transaction.transaction_type === 'deposit_chips') {
                            // Try multiple field names (chips_amount, chip_amount) and parse as float
                            const chipsAmount = parseFloat(
                              transaction.chips_amount || 
                              transaction.chip_amount || 
                              transaction.chips_value ||
                              0
                            );
                            
                            if (chipsAmount > 0 && !isNaN(chipsAmount)) {
                              displayAmount = chipsAmount;
                            } else {
                              // Calculate from chip breakdown if chips_amount is missing or 0
                              const calculatedAmount = 
                                (parseInt(transaction.chips_100 || 0) * 100) +
                                (parseInt(transaction.chips_500 || 0) * 500) +
                                (parseInt(transaction.chips_1000 || 0) * 1000) +
                                (parseInt(transaction.chips_5000 || 0) * 5000) +
                                (parseInt(transaction.chips_10000 || 0) * 10000);
                              
                              if (calculatedAmount > 0) {
                                displayAmount = calculatedAmount;
                              } else {
                                // Last resort: try to extract from notes (e.g., "₹2000 chips")
                                const notesMatch = transaction.notes?.match(/₹[\d,]+/);
                                if (notesMatch) {
                                  const extractedAmount = parseFloat(notesMatch[0].replace(/[₹,]/g, ''));
                                  if (!isNaN(extractedAmount) && extractedAmount > 0) {
                                    displayAmount = extractedAmount;
                                  }
                                }
                              }
                            }
                          } else {
                            // For other transactions, use amount
                            displayAmount = parseFloat(transaction.amount || transaction.chips_amount || 0);
                          }
                          
                          // Don't show transaction if it's deposit_chips/opening_chips with 0 value
                          if ((transaction.transaction_type === 'deposit_chips' || transaction.transaction_type === 'opening_chips') && displayAmount === 0) {
                            return null; // Don't render if no chip value
                          }
                          
                          const colorClass = getTransactionColor(transaction.transaction_type);

                          return (
                            <Card key={transaction.transaction_id} className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge
                                      className={
                                        transaction.transaction_type === 'buy_in'
                                          ? 'bg-orange-100 text-orange-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }
                                    >
                                      {transaction.transaction_type?.replace(/_/g, ' ').toUpperCase()}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {formatDateTime(transaction.created_at)}
                                    </span>
                                  </div>
                                  {transaction.notes && (
                                    <p className="text-xs text-gray-600 mt-1">{transaction.notes}</p>
                                  )}
                                </div>
                                <p className={`font-semibold ${colorClass}`}>
                                  {isProfit ? '+' : '-'}
                                  {formatCurrency(displayAmount)}
                                </p>
                              </div>
                            </Card>
                          );
                        })
                        .filter(Boolean) // Remove null entries
                    )}
                  </div>

                 
                </div>

                <Separator />

                {/* Notes Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Notes</h3>
                  <div className="space-y-2">
                    {notes.length === 0 ? (
                      <p className="text-sm text-gray-500">No notes yet</p>
                    ) : (
                      notes.map((note, index) => (
                        <Card key={note.note_id || note.id || `note-${index}`} className="p-3">
                          <p className="text-sm">{note.note || note.note_text || note}</p>
                          {note.created_at && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDateTime(note.created_at)} by {note.full_name || note.username || 'System'}
                            </p>
                          )}
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Block Player Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block {player.player_name}? This action will prevent them from accessing the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="block-reason">Reason for blocking <span className="text-red-500">*</span></Label>
              <Textarea
                id="block-reason"
                placeholder="Enter reason for blocking this player (minimum 10 characters)..."
                value={blockReason}
                onChange={(e) => {
                  setBlockReason(e.target.value);
                  setBlockError(null);
                }}
                rows={3}
                className={blockError ? 'border-red-500' : ''}
              />
              {blockError && (
                <p className="text-xs text-red-500 mt-1">{blockError}</p>
              )}
              {blockReason && blockReason.trim().length < 10 && (
                <p className="text-xs text-gray-500 mt-1">
                  {blockReason.trim().length}/10 characters (minimum 10 required)
                </p>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockPlayer}
              disabled={!blockReason.trim() || blockReason.trim().length < 10 || blocking}
              className="bg-red-600 hover:bg-red-700"
            >
              {blocking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Block Player
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PlayerDetailsDrawer;

