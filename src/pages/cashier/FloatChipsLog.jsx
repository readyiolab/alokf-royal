// src/pages/cashier/FloatChipsLog.jsx
// Float & Chips Log Page

import React, { useState, useEffect } from "react";
import CashierLayout from "../../components/layouts/CashierLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Wallet, Coins, RefreshCw, ChevronLeft, ChevronRight, Download } from "lucide-react";
import ExportFloatChipsLogModal from "../../components/cashier/ExportFloatChipsLogModal";
import { useSession } from "../../hooks/useSession";
import cashierService from "../../services/cashier.service";
import { toast } from "sonner";

const FloatChipsLog = () => {
  // Helper to get today's date in IST timezone (YYYY-MM-DD format)
  const getTodayIST = () => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split('T')[0];
  };

  const { session, refreshSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayIST());
  const [floatHistory, setFloatHistory] = useState([]);
  const [sessionData, setSessionData] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatChipBreakdown = (chips) => {
    if (!chips) return '';
    const parts = [];
    if (chips.chips_100 > 0) parts.push(`${chips.chips_100}×₹100`);
    if (chips.chips_500 > 0) parts.push(`${chips.chips_500}×₹500`);
    if (chips.chips_5000 > 0) parts.push(`${chips.chips_5000}×₹5,000`);
    if (chips.chips_10000 > 0) parts.push(`${chips.chips_10000}×₹10,000`);
    return parts.join(' ');
  };

  const getChipCount = (chips) => {
    if (!chips) return 0;
    return (chips.chips_100 || 0) + (chips.chips_500 || 0) + 
           (chips.chips_5000 || 0) + (chips.chips_10000 || 0);
  };

  const getChipValue = (chips) => {
    if (!chips) return 0;
    return (chips.chips_100 || 0) * 100 + 
           (chips.chips_500 || 0) * 500 + 
           (chips.chips_5000 || 0) * 5000 + 
           (chips.chips_10000 || 0) * 10000;
  };

  // Fetch session data for the selected date
  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const data = await cashierService.getSessionByDate(selectedDate);
      
      if (data?.success && data?.data) {
        setSessionData(data.data);
        
        // Fetch float addition history if session exists
        if (data.data.session_id) {
          try {
            // Get float history for this specific session
            const historyResponse = await cashierService.getFloatHistoryBySession(data.data.session_id);
            if (historyResponse?.success && historyResponse?.data) {
              const historyData = Array.isArray(historyResponse.data) 
                ? historyResponse.data 
                : (historyResponse.data.additions || []);
              setFloatHistory(historyData);
            } else {
              setFloatHistory([]);
            }
          } catch (err) {
            console.error('Error fetching float history:', err);
            setFloatHistory([]);
          }
        } else {
          setFloatHistory([]);
        }
      } else {
        setSessionData(null);
        setFloatHistory([]);
      }
    } catch (err) {
      console.error('Error fetching session data:', err);
      // Don't show error toast if it's just "no session found"
      if (err.message && !err.message.includes('not found')) {
        toast.error('Failed to load session data');
      }
      setSessionData(null);
      setFloatHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [selectedDate]);

  const changeDate = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  // Check if selected date is today (using IST timezone)
  const isToday = selectedDate === getTodayIST();

  // Handle CSV Export
  const handleExportCSV = async (startDate, endDate) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // For now, we'll create a simple CSV from available data
      // In the future, this can call a backend endpoint
      const csvRows = [];
      
      // Header
      csvRows.push(['Date', 'Type', 'Description', 'Amount', 'Chips', 'User', 'Notes'].join(','));

      // Fetch data for each date in range
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        try {
          const data = await cashierService.getSessionByDate(dateStr);
          if (data?.success && data?.data) {
            const session = data.data;
            
            // Opening Float
            if (session.opening_float > 0) {
              csvRows.push([
                formatDateFns(new Date(dateStr + 'T00:00:00'), 'dd MMM yyyy'),
                'Opening Float',
                'Session Opening',
                session.opening_float,
                '',
                session.opened_by_name || session.opened_by_username || 'System',
                ''
              ].join(','));
            }

            // Opening Chips
            const chipsValue = getChipValue({
              chips_100: session.chips_100_opening || 0,
              chips_500: session.chips_500_opening || 0,
              chips_5000: session.chips_5000_opening || 0,
              chips_10000: session.chips_10000_opening || 0,
            });
            const chipsCount = getChipCount({
              chips_100: session.chips_100_opening || 0,
              chips_500: session.chips_500_opening || 0,
              chips_5000: session.chips_5000_opening || 0,
              chips_10000: session.chips_10000_opening || 0,
            });
            
            if (chipsValue > 0) {
              csvRows.push([
                formatDateFns(new Date(dateStr + 'T00:00:00'), 'dd MMM yyyy'),
                'Opening Chips',
                'Session Opening',
                chipsValue,
                chipsCount,
                session.opened_by_name || session.opened_by_username || 'System',
                ''
              ].join(','));
            }

            // Float additions for this session
            try {
              const historyResponse = await cashierService.getFloatHistoryBySession(session.session_id);
              if (historyResponse?.success && historyResponse?.data) {
                const historyData = Array.isArray(historyResponse.data) 
                  ? historyResponse.data 
                  : (historyResponse.data.additions || []);
                
                historyData.forEach((entry) => {
                  const entryChips = {
                    chips_100: entry.chips_100 || 0,
                    chips_500: entry.chips_500 || 0,
                    chips_5000: entry.chips_5000 || 0,
                    chips_10000: entry.chips_10000 || 0,
                  };
                  const chipCount = getChipCount(entryChips);
                  const chipValue = getChipValue(entryChips);
                  const chipBreakdown = formatChipBreakdown(entryChips);
                  
                  csvRows.push([
                    formatDateFns(new Date(dateStr + 'T00:00:00'), 'dd MMM yyyy'),
                    'Float Top-up',
                    entry.notes || entry.reason || 'Float Addition',
                    entry.float_amount || entry.amount || 0,
                    chipCount > 0 ? `${chipCount} chips (${chipBreakdown})` : '',
                    entry.added_by_name || entry.added_by_username || 'System',
                    (entry.notes || entry.reason || '').replace(/,/g, ';') // Replace commas in notes
                  ].join(','));
                });
              }
            } catch (err) {
              // Skip if history not available
            }
          }
        } catch (err) {
          // Skip dates with no session
        }
      }

      // Create and download CSV
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `float_chips_log_${startDate}_to_${endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export CSV');
    }
  };

  // Calculate totals
  const totalFloat = sessionData?.opening_float || 0;
  const totalChips = sessionData ? getChipValue({
    chips_100: sessionData.chips_100_opening || 0,
    chips_500: sessionData.chips_500_opening || 0,
    chips_5000: sessionData.chips_5000_opening || 0,
    chips_10000: sessionData.chips_10000_opening || 0,
  }) : 0;
  const chipCount = sessionData ? getChipCount({
    chips_100: sessionData.chips_100_opening || 0,
    chips_500: sessionData.chips_500_opening || 0,
    chips_5000: sessionData.chips_5000_opening || 0,
    chips_10000: sessionData.chips_10000_opening || 0,
  }) : 0;

  // Opening chips breakdown
  const openingChips = sessionData ? {
    chips_100: sessionData.chips_100_opening || 0,
    chips_500: sessionData.chips_500_opening || 0,
    chips_5000: sessionData.chips_5000_opening || 0,
    chips_10000: sessionData.chips_10000_opening || 0,
  } : null;

  if (loading) {
    return (
      <CashierLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </CashierLayout>
    );
  }

  return (
    <CashierLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Float & Chips Log</h1>
              <p className="text-sm text-gray-600 mt-1">
                {isToday ? "Today's Session" : formatDate(selectedDate)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {session?.is_open && isToday && (
              <Button
                variant="outline"
                className="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
              >
                <Clock className="w-4 h-4 mr-2" />
                Open
              </Button>
            )}
            
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => changeDate(-1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-gray-900 min-w-[120px] text-center">
                {formatDate(selectedDate)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => changeDate(1)}
                disabled={isToday}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportModal(true)}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm">Export Range</span>
            </Button>
          </div>
        </div>

        {!sessionData ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-900">No session data found for {formatDate(selectedDate)}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total Float Card */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-5 h-5 text-green-600" />
                        <p className="text-sm font-semibold text-gray-700">Total Float</p>
                      </div>
                      <p className="text-3xl font-bold text-green-600 mb-1">
                        {formatCurrency(totalFloat)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Opening: {formatCurrency(sessionData.opening_float || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Chips Card */}
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Coins className="w-5 h-5 text-orange-600" />
                        <p className="text-sm font-semibold text-gray-700">Total Chips</p>
                      </div>
                      <p className="text-3xl font-bold text-orange-600 mb-1">
                        {formatCurrency(totalChips)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {chipCount} chips
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction Log */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">TRANSACTION LOG</h2>
                
                <div className="space-y-4">
                  {/* Opening Float Entry */}
                  {sessionData.opening_float > 0 && (
                    <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Wallet className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">Opening Float</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{formatDateTime(sessionData.opened_at || sessionData.created_at)}</span>
                          <span>•</span>
                          <User className="w-4 h-4" />
                          <span>{sessionData.opened_by_name || sessionData.opened_by_username || sessionData.opened_by || 'System'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(sessionData.opening_float)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Opening Chips Entry */}
                  {totalChips > 0 && (
                    <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Coins className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">Opening Chips</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDateTime(sessionData.opened_at || sessionData.created_at)}</span>
                          <span>•</span>
                          <User className="w-4 h-4" />
                          <span>{sessionData.opened_by_name || sessionData.opened_by_username || sessionData.opened_by || 'System'}</span>
                        </div>
                        {openingChips && (
                          <p className="text-xs text-gray-500">
                            {formatChipBreakdown(openingChips)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">
                          {chipCount} chips
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(totalChips)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Float Addition History (Top-ups) */}
                  {floatHistory.length > 0 && floatHistory.map((entry, index) => {
                    const entryChips = {
                      chips_100: entry.chips_100 || 0,
                      chips_500: entry.chips_500 || 0,
                      chips_5000: entry.chips_5000 || 0,
                      chips_10000: entry.chips_10000 || 0,
                    };
                    const entryChipCount = getChipCount(entryChips);
                    const entryChipValue = getChipValue(entryChips);
                    const hasChips = entryChipCount > 0;
                    
                    return (
                      <div key={entry.addition_id || index} className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Wallet className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">Float Top-up</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDateTime(entry.created_at || entry.added_at)}</span>
                            {entry.added_by_name && (
                              <>
                                <span>•</span>
                                <User className="w-4 h-4" />
                                <span>{entry.added_by_name || entry.added_by_username}</span>
                              </>
                            )}
                          </div>
                          {entry.notes && (
                            <p className="text-xs text-gray-500 mb-1">{entry.notes}</p>
                          )}
                          {hasChips && (
                            <p className="text-xs text-blue-600 font-medium">
                              Chips: {formatChipBreakdown(entryChips)} ({entryChipCount} chips, Value: {formatCurrency(entryChipValue)})
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">
                            +{formatCurrency(entry.float_amount || entry.amount)}
                          </p>
                          {hasChips && (
                            <p className="text-xs text-gray-500 mt-1">
                              +{formatCurrency(entryChipValue)} chips
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* No Top-ups Message */}
                  {floatHistory.length === 0 && sessionData && (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">No top-ups recorded for this session</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Export Modal */}
        <ExportFloatChipsLogModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExportCSV}
        />
      </div>
    </CashierLayout>
  );
};

export default FloatChipsLog;

