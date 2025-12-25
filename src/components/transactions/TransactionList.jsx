import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  Gift,
  Heart,
  UtensilsCrossed
} from 'lucide-react';

const ChipLedgerList = ({ transactions = [] }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(Math.abs(amount) || 0);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return { time: '-', date: '-' };
    const date = new Date(dateStr);
    return {
      time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    };
  };

  const getActionIconAndColor = (t) => {
    const isOut =
      ["buy_in", "credit_issued", "issue_credit", "rakeback"].includes(t.transaction_type) ||
      (t.activity_type === "dealer_tip" && t.chip_amount > 0) ||
      (t.activity_type === "player_expense" && t.chip_amount > 0);

    if (t.transaction_type === "buy_in") return { icon: TrendingUp, color: "text-green-700 bg-green-50", label: "Buy In" };
    if (["credit_issued", "issue_credit"].includes(t.transaction_type)) return { icon: CreditCard, color: "text-amber-700 bg-amber-50", label: "Credit Issued" };
    if (t.transaction_type === "cash_payout") return { icon: TrendingDown, color: "text-blue-700 bg-blue-50", label: "Cash Payout" };
    if (t.transaction_type === "return_chips" || t.transaction_type === "deposit_chips") 
      return { icon: TrendingDown, color: "text-indigo-700 bg-indigo-50", label: "Chips Returned" };
    if (t.activity_type === "dealer_tip") return { icon: Heart, color: "text-pink-700 bg-pink-50", label: "Dealer Tip" };
    if (t.activity_type === "player_expense") return { icon: UtensilsCrossed, color: "text-orange-700 bg-orange-50", label: "Player Expense" };
    if (t.activity_type === "rakeback") return { icon: Gift, color: "text-purple-700 bg-purple-50", label: "Rakeback" };

    return { icon: TrendingUp, color: "text-zinc-700 bg-zinc-50", label: "Chip Movement" };
  };

  const calculateChipValue = (t) => {
    return (
      (parseInt(t.chips_100 || 0) * 100) +
      (parseInt(t.chips_500 || 0) * 500) +
      (parseInt(t.chips_5000 || 0) * 5000) +
      (parseInt(t.chips_10000 || 0) * 10000)
    );
  };

  // Sort transactions chronologically (oldest first for running balance)
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.created_at || a.issued_at) - new Date(b.created_at || b.issued_at)
  );

  // Calculate running balance
  let runningBalance = 0;
  const transactionsWithBalance = sortedTransactions.map(t => {
    const value = calculateChipValue(t);
    const isOut = [
      "buy_in", "credit_issued", "issue_credit", "rakeback",
      "dealer_tip", "player_expense"
    ].includes(t.activity_type || t.transaction_type);

    if (isOut) {
      runningBalance += value;
    } else {
      runningBalance = Math.max(0, runningBalance - value); // prevent negative
    }

    return { ...t, chipValue: value, isOut, runningBalance };
  });

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed border-zinc-300">
        <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-zinc-400" />
        </div>
        <p className="text-zinc-600 font-medium text-lg">No chip movements yet</p>
        <p className="text-zinc-500 text-sm mt-2">Chip ledger will appear here when transactions begin</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white sticky top-0">
            <tr>
              <th className="text-left py-4 px-6 font-semibold">Time</th>
              <th className="text-left py-4 px-6 font-semibold">Player</th>
              <th className="text-left py-4 px-6 font-semibold">Action</th>
              <th className="text-center py-4 px-6 font-semibold">Chip Breakdown</th>
              <th className="text-right py-4 px-6 font-semibold">Value</th>
              <th className="text-right py-4 px-6 font-semibold">Balance (In Circulation)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {transactionsWithBalance.map((t, idx) => {
              const { icon: Icon, color, label } = getActionIconAndColor(t);
              const { time, date } = formatTime(t.created_at || t.issued_at);
              const playerName = t.player_name || t.dealer_name || "System";

              return (
                <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-zinc-900">{time}</div>
                      <div className="text-xs text-zinc-500">{date}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-semibold text-zinc-900">{playerName}</div>
                    {t.notes && <div className="text-xs text-zinc-500 mt-1">{t.notes}</div>}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-current" />
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-900">{label}</div>
                        <Badge variant="outline" className="text-xs mt-1 border-zinc-300 bg-black ">
                          {t.isOut ? "CHIPS OUT" : "CHIPS IN"}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex flex-wrap justify-center gap-2">
                      {t.chips_100 > 0 && (
                        <Badge variant="secondary" className="text-xs">₹100 × {t.chips_100}</Badge>
                      )}
                      {t.chips_500 > 0 && (
                        <Badge className="text-xs bg-blue-100 text-blue-800">₹500 × {t.chips_500}</Badge>
                      )}
                      {t.chips_5000 > 0 && (
                        <Badge className="text-xs bg-green-100 text-green-800">₹5K × {t.chips_5000}</Badge>
                      )}
                      {t.chips_10000 > 0 && (
                        <Badge className="text-xs bg-purple-100 text-purple-800">₹10K × {t.chips_10000}</Badge>
                      )}
                      {t.chipValue === 0 && <span className="text-zinc-400 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className={`font-bold text-lg ${t.isOut ? 'text-red-700' : 'text-green-700'}`}>
                      {t.isOut ? '+' : '−'}{formatCurrency(t.chipValue)}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-purple-800 text-lg">
                    {formatCurrency(t.runningBalance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot >
            <tr className="bg-zinc-100">
              <td colSpan={5} className="py-5 px-6 text-right font-bold text-black text-md">
                TOTAL CHIPS IN CIRCULATION
              </td>
              <td className="py-5 px-6 text-right font-bold text-black text-md">
                {formatCurrency(runningBalance)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ChipLedgerList;