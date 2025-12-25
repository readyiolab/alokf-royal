// components/cashier/PlayerStoredChipsCard.jsx
// Shows player's stored chips balance for use during buy-in

import React, { useState, useEffect } from 'react';
import { Coins, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import api from '../../services/api.service';

const PlayerStoredChipsCard = ({ playerId, playerName, onUseStoredChips }) => {
  const [storedChips, setStoredChips] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useAmount, setUseAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (playerId) {
      fetchStoredChips();
    }
  }, [playerId]);

  const fetchStoredChips = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/players/${playerId}/stored-chips`);
      setStoredChips(response.data?.data || null);
    } catch (err) {
      console.error('Error fetching stored chips:', err);
      setStoredChips(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUseChips = () => {
    const amount = parseFloat(useAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amount > (storedChips?.total_value || 0)) {
      setError('Amount exceeds stored balance');
      return;
    }
    
    setError('');
    onUseStoredChips && onUseStoredChips({
      amount,
      storedBalance: storedChips
    });
  };

  const handleUseAll = () => {
    if (storedChips?.total_value > 0) {
      setUseAmount(storedChips.total_value.toString());
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  if (!storedChips || storedChips.total_value <= 0) {
    return null; // Don't show card if no stored chips
  }

  return (
    <Card className="border-2 border-yellow-400 bg-yellow-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-yellow-700 text-base">
          <Coins className="w-5 h-5" />
          Stored Chips Available
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="bg-white p-4 rounded-lg border border-yellow-200">
          <p className="text-sm text-gray-500">
            {playerName || 'Player'}'s Stored Balance
          </p>
          <p className="text-2xl font-bold text-yellow-600">
            {formatCurrency(storedChips.total_value)}
          </p>
          
          {/* Chip Breakdown */}
          <div className="flex flex-wrap gap-2 mt-2">
            {storedChips.chips_100 > 0 && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {storedChips.chips_100}×₹100
              </span>
            )}
            {storedChips.chips_500 > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {storedChips.chips_500}×₹500
              </span>
            )}
            {storedChips.chips_5000 > 0 && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                {storedChips.chips_5000}×₹5K
              </span>
            )}
            {storedChips.chips_10000 > 0 && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                {storedChips.chips_10000}×₹10K
              </span>
            )}
          </div>
        </div>

        {/* Use Stored Chips */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Use Stored Chips for Buy-in
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="number"
                value={useAmount}
                onChange={(e) => setUseAmount(e.target.value)}
                max={storedChips.total_value}
                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                placeholder="Amount"
              />
            </div>
            <button
              onClick={handleUseAll}
              className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm font-medium"
            >
              Use All
            </button>
            <button
              onClick={handleUseChips}
              disabled={!useAmount || parseFloat(useAmount) <= 0}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Use
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          Player deposited these chips previously for future use
        </p>
      </CardContent>
    </Card>
  );
};

export default PlayerStoredChipsCard;
