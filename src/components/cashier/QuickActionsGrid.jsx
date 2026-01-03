// ============================================
// FILE: components/cashier/QuickActionsGrid.jsx
// Grid of quick action buttons for transactions
// ============================================

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Coins,
  CreditCard,
  Banknote,
  TrendingDown,
  Save,
  Gift,
  HandCoins,
  UtensilsCrossed,
  Building2,
} from 'lucide-react';

const QuickActionsGrid = ({
  hasActiveSession,
  onSelectTransaction,
  onRakeback,
  onDealerTip,
  onPlayerExpense,
  onClubExpense,
}) => {
  const transactionTypes = [
    {
      id: 'issue-credit',
      name: 'Issue Credit',
      icon: CreditCard,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Give chips on credit',
    },
    {
      id: 'buy-in',
      name: 'Buy-in',
      icon: Coins,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Cash to chips',
    },
    {
      id: 'settle-cash',
      name: 'Settle Cash',
      icon: Banknote,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Pay credit with cash',
    },
    {
      id: 'cash-payout',
      name: 'Cash Payout',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Chips to cash',
    },
    {
      id: 'deposit-chips',
      name: 'Deposit Chips',
      icon: Save,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Store for next session',
    },
  ];

  const specialActions = [
    {
      id: 'rake-back',
      name: 'Rake Back',
      icon: Gift,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Give chips as reward',
      onClick: onRakeback,
    },
    {
      id: 'dealer-tips',
      name: 'Dealer Tips',
      icon: HandCoins,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Record dealer tips',
      onClick: onDealerTip,
    },
    {
      id: 'player-expense',
      name: 'Player Expense',
      icon: UtensilsCrossed,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Record player expense',
      onClick: onPlayerExpense,
    },
    {
      id: 'club-expense',
      name: 'Club Expense',
      icon: Building2,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Food, salary, misc',
      onClick: onClubExpense,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
        Quick Actions
      </h2>

      {/* Main Transaction Types */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 ${
          !hasActiveSession ? 'opacity-60 pointer-events-none' : ''
        }`}
      >
        {transactionTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card
              key={type.id}
              className="relative overflow-hidden bg-white hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-[0.98] group"
              onClick={() => onSelectTransaction(type.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-12 h-12 rounded-xl ${type.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`w-6 h-6 ${type.color}`} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 flex-1">{type.name}</h3>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-12 flex-shrink-0"></div>
                  <p className="text-xs text-gray-500 flex-1">{type.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Special Actions */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-4 gap-4 ${
          !hasActiveSession ? 'opacity-60 pointer-events-none' : ''
        }`}
      >
        {specialActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.id}
              className="relative overflow-hidden bg-white hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-[0.98] group"
              onClick={action.onClick}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`w-6 h-6 ${action.color}`} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 flex-1">{action.name}</h3>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-12 flex-shrink-0"></div>
                  <p className="text-xs text-gray-500 flex-1">{action.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActionsGrid;

