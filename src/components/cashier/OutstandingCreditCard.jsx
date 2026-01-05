// ============================================
// FILE: components/cashier/OutstandingCreditCard.jsx
// Card showing outstanding credit status
// ============================================

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const OutstandingCreditCard = ({ dashboard, formatCurrency }) => {
  const outstandingCredit = dashboard?.outstanding_credit || 0;
  const totalCreditIssued = dashboard?.total_credit_issued || 0;
  const outstandingCredits = dashboard?.outstanding_credits || [];
  const creditCount = Array.isArray(outstandingCredits) ? outstandingCredits.length : 0;

  return (
    <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-sm font-semibold text-gray-600">Outstanding Credit</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Total Credit Issued</span>
            <span className="text-lg font-bold text-orange-700">
              {formatCurrency(totalCreditIssued)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Outstanding</span>
            <span className={`text-sm font-semibold ${outstandingCredit > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(outstandingCredit)}
            </span>
          </div>
          <div className="pt-2 border-t border-orange-200">
            {outstandingCredit > 0 ? (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-xs text-orange-700 font-medium">
                  {creditCount} player{creditCount !== 1 ? 's' : ''} with credit
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs text-green-700 font-medium">All settled</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OutstandingCreditCard;

