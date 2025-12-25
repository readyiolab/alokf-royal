// components/cashier/PlayerCreditStatus.jsx
// Shows player's credit limit, usage, and outstanding balance

import React, { useState, useEffect } from 'react';
import { CreditCard, AlertTriangle, CheckCircle, Ban, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import api from '../../services/api.service';

const PlayerCreditStatus = ({ playerId, playerName, onCreditStatusChange }) => {
  const [creditStatus, setCreditStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (playerId) {
      fetchCreditStatus();
    }
  }, [playerId]);

  const fetchCreditStatus = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/credit/player/${playerId}/status`);
      const status = response.data?.data || null;
      setCreditStatus(status);
      onCreditStatusChange && onCreditStatusChange(status);
    } catch (err) {
      console.error('Error fetching credit status:', err);
      setCreditStatus(null);
    } finally {
      setLoading(false);
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

  if (!creditStatus) {
    return null;
  }

  const { credit_limit, credit_used, credit_available, outstanding_credit, can_issue_credit } = creditStatus;
  const usagePercentage = credit_limit > 0 ? (credit_used / credit_limit) * 100 : 0;

  // Determine status color
  let statusColor = 'green';
  let StatusIcon = CheckCircle;
  let statusText = 'Credit Available';

  if (outstanding_credit > 0) {
    statusColor = 'red';
    StatusIcon = Ban;
    statusText = 'Outstanding Credit - Must Clear First';
  } else if (usagePercentage >= 100) {
    statusColor = 'red';
    StatusIcon = AlertTriangle;
    statusText = 'Credit Limit Reached';
  } else if (usagePercentage >= 80) {
    statusColor = 'yellow';
    StatusIcon = AlertTriangle;
    statusText = 'Approaching Limit';
  }

  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: 'text-green-600',
      bar: 'bg-green-500'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: 'text-yellow-600',
      bar: 'bg-yellow-500'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: 'text-red-600',
      bar: 'bg-red-500'
    }
  };

  const colors = colorClasses[statusColor];

  return (
    <Card className={`border-2 ${colors.border} ${colors.bg}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`flex items-center gap-2 ${colors.text} text-base`}>
          <CreditCard className="w-5 h-5" />
          Credit Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className={`flex items-center gap-2 ${colors.text}`}>
          <StatusIcon className={`w-5 h-5 ${colors.icon}`} />
          <span className="font-medium">{statusText}</span>
        </div>

        {/* Credit Limit */}
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Personal Credit Limit</span>
            <span className="font-bold text-gray-900">{formatCurrency(credit_limit)}</span>
          </div>
          
          {/* Usage Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div 
              className={`h-2.5 rounded-full ${colors.bar}`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>Used: {formatCurrency(credit_used)}</span>
            <span>Available: {formatCurrency(credit_available)}</span>
          </div>
        </div>

        {/* Outstanding Balance - Critical Alert */}
        {outstanding_credit > 0 && (
          <div className="bg-red-100 border-2 border-red-300 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-bold">Outstanding Credit</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(outstanding_credit)}
            </p>
            <p className="text-sm text-red-600 mt-2">
              Player must clear this amount before receiving new credit
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500">Total Limit</p>
            <p className="font-bold text-gray-900">{formatCurrency(credit_limit)}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500">Available Now</p>
            <p className={`font-bold ${credit_available > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(credit_available)}
            </p>
          </div>
        </div>

        {/* Action Hint */}
        {can_issue_credit ? (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Credit can be issued to this player
          </p>
        ) : (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <Ban className="w-3 h-3" />
            {outstanding_credit > 0 
              ? 'Clear outstanding credit first' 
              : 'Credit limit exhausted'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerCreditStatus;
