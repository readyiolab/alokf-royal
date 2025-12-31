// src/pages/cashier/AuditLogReversals.jsx
// Audit Log - Reversals Page

import React, { useState, useEffect } from 'react';
import CashierLayout from '../../components/layouts/CashierLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  RotateCw,
  BookOpen,
  Coins,
  CreditCard,
  Home,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import cashierService from '../../services/cashier.service';
import { toast } from 'sonner';
import ReversalDetailsModal from '../../components/cashier/ReversalDetailsModal';

const AuditLogReversals = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reversals, setReversals] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    cashbook: 0,
    chip_ledger: 0,
    credit_register: 0,
    house_player: 0,
    credit_limit: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedReversal, setSelectedReversal] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const formatDate = (dateStr) => {
    return format(new Date(dateStr), 'dd MMM yyyy');
  };

  const formatTime = (dateStr) => {
    return format(new Date(dateStr), 'HH:mm');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(Math.abs(amount || 0));
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'cashbook':
        return BookOpen;
      case 'chip_ledger':
        return Coins;
      case 'credit_register':
        return CreditCard;
      case 'house_player':
        return Home;
      case 'credit_limit':
        return Sliders;
      default:
        return BookOpen;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'cashbook':
        return 'Cashbook';
      case 'chip_ledger':
        return 'Chip Ledger';
      case 'credit_register':
        return 'Credit Register';
      case 'house_player':
        return 'House Player';
      case 'credit_limit':
        return 'Credit Limit';
      default:
        return 'Other';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'cashbook':
        return 'bg-orange-500';
      case 'chip_ledger':
        return 'bg-orange-500';
      case 'credit_register':
        return 'bg-green-500';
      case 'house_player':
        return 'bg-purple-500';
      case 'credit_limit':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const fetchReversals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/cashier/reversals?date=${selectedDate}&category=${categoryFilter}&search=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      
      if (data.success) {
        setReversals(data.data.reversals || []);
        setSummary(data.data.summary || summary);
      } else {
        throw new Error(data.message || 'Failed to fetch reversals');
      }
    } catch (error) {
      console.error('Error fetching reversals:', error);
      toast.error('Failed to load reversals');
      setReversals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReversals();
  }, [selectedDate, categoryFilter]);

  const handleSearch = () => {
    fetchReversals();
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const handleReversalClick = async (reversal) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/cashier/reversals/${reversal.transaction_id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setSelectedReversal(data.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching reversal details:', error);
      toast.error('Failed to load reversal details');
    }
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    toast.info('Export functionality coming soon');
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <CashierLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log - Reversals</h1>
          </div>
          
          {/* Date Navigation */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => changeDate(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900 min-w-[120px] text-center">
                {formatDate(selectedDate)}
              </span>
            </div>
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
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="cashbook">Cashbook</SelectItem>
              <SelectItem value="chip_ledger">Chip Ledger</SelectItem>
              <SelectItem value="credit_register">Credit Register</SelectItem>
              <SelectItem value="house_player">House Player</SelectItem>
              <SelectItem value="credit_limit">Credit Limit</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-1">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-1">Cashbook</p>
              <p className="text-2xl font-bold text-orange-600">{summary.cashbook}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-1">Chip Ledger</p>
              <p className="text-2xl font-bold text-orange-600">{summary.chip_ledger}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-1">Credit Register</p>
              <p className="text-2xl font-bold text-green-600">{summary.credit_register}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-1">House Player</p>
              <p className="text-2xl font-bold text-purple-600">{summary.house_player}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-1">Credit Limit</p>
              <p className="text-2xl font-bold text-orange-600">{summary.credit_limit}</p>
            </CardContent>
          </Card>
        </div>

        {/* Reversals List */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">Loading reversals...</p>
            </CardContent>
          </Card>
        ) : reversals.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <RotateCw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-900">No reversals found for {formatDate(selectedDate)}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reversals.map((reversal) => {
              const CategoryIcon = getCategoryIcon(reversal.category);
              const categoryLabel = getCategoryLabel(reversal.category);
              const categoryColor = getCategoryColor(reversal.category);
              const reversalReason = reversal.reversal_reason 
                ? `REVERSAL: ${(reversal.original_transaction_type || '').toUpperCase().replace('_', ' ')} - ${reversal.reversal_reason}`
                : 'No reason provided';

              return (
                <Card 
                  key={reversal.transaction_id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleReversalClick(reversal)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Reversal Icon */}
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <RotateCw className="w-5 h-5 text-red-600" />
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <CategoryIcon className="w-3 h-3" />
                              {categoryLabel}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(reversal.amount || reversal.chips_amount || 0)}
                            </span>
                            {reversal.player_name && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-700">{reversal.player_name}</span>
                              </>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {reversalReason}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{formatTime(reversal.created_at)}</span>
                            <span>•</span>
                            <span>By {reversal.reversed_by_name || reversal.reversed_by_username || `Cashier #${reversal.created_by || 0}`}</span>
                            {reversal.original_transaction_id && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Original #{reversal.original_transaction_id}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <Badge className="bg-orange-500 text-white flex-shrink-0">
                        Reversed
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Reversal Details Modal */}
      {showDetailsModal && selectedReversal && (
        <ReversalDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedReversal(null);
          }}
          reversal={selectedReversal.reversal}
          originalTransaction={selectedReversal.originalTransaction}
        />
      )}
    </CashierLayout>
  );
};

export default AuditLogReversals;

