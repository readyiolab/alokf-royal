// ============================================
// FILE: components/floor-manager/ConfirmationsPanel.jsx
// Sidebar panel showing pending buy-in confirmations
// ============================================

import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ConfirmationsPanel = ({
  confirmations,
  onAccept,
  onReject,
}) => {
  return (
    <Card className="bg-slate-800 border-red-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" /> Buy-in Confirmations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {confirmations.map((conf) => (
          <div
            key={conf.request_id}
            className="bg-slate-700 border-2 border-red-600/50 p-3 rounded-lg"
          >
            <div className="flex justify-between mb-3">
              <div>
                <p className="font-bold text-white">{conf.player_name}</p>
                <p className="text-xs text-slate-400">
                  {conf.table_name || `Table #${conf.table_number}`}
                </p>
              </div>
              <Badge className="bg-red-600 text-white">
                ₹{conf.buy_in_amount}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onAccept(conf.request_id)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Accept
              </Button>
              <Button
                onClick={() => onReject(conf.request_id)}
                variant="outline"
                className="flex-1 border-red-600 text-red-400 hover:bg-red-600/20 h-8 text-xs"
              >
                <XCircle className="w-3 h-3 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        ))}
        {confirmations.length === 0 && (
          <p className="text-center text-slate-500 py-6">
            No pending confirmations
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ConfirmationsPanel;

