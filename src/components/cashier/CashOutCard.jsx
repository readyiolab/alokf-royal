// ============================================
// FILE: components/cashier/CashOutCard.jsx
// Card showing cash taken out details
// ============================================

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const CashOutCard = ({ dashboard, formatCurrency }) => {
  const payoutTotal = dashboard?.transactions?.stats?.payouts?.total || 0;
  const dealerTipsCash =
    dashboard?.transactions?.stats?.dealer_tips?.total_cash_paid || 0;
  const playerExpensesCash =
    dashboard?.transactions?.stats?.player_expenses?.total_cash_paid || 0;
  const clubExpensesTotal =
    dashboard?.transactions?.stats?.club_expenses?.total || 0;
  const totalWithdrawn =
    (dashboard?.totals?.withdrawals || 0) + (dashboard?.totals?.expenses || 0);

  return (
    <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-sm font-semibold text-gray-600">Cash Taken Out</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">PayOuts</span>
            <span className="text-lg font-bold text-red-700">
              {formatCurrency(payoutTotal)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Dealer Tips (Cash)</span>
            <span className="text-sm font-semibold text-gray-700">
              {formatCurrency(dealerTipsCash)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Player Expenses (Vendors)</span>
            <span className="text-sm font-semibold text-gray-700">
              {formatCurrency(playerExpensesCash)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Club Expenses</span>
            <span className="text-sm font-semibold text-gray-700">
              {formatCurrency(clubExpensesTotal)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-300">
            <span className="text-xs text-gray-500 font-semibold">Total Out</span>
            <span className="text-base font-bold text-red-800">
              {formatCurrency(totalWithdrawn)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashOutCard;

