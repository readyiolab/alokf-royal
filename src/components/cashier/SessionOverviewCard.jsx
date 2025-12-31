// ============================================
// FILE: components/cashier/SessionOverviewCard.jsx
// Session overview with start/close functionality
// ============================================

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Plus, History, Power, PlayCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SessionOverviewCard = ({
  session,
  dashboard,
  hasActiveSession,
  onOpenFloatHistory,
  onAddFloat,
  onStartSession,
  onCloseSession,
  formatCurrency,
}) => {
  const { toast } = useToast();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closingSession, setClosingSession] = useState(false);

  // Extract float data
  const initialOpeningFloat = dashboard?.float_summary?.initial_opening || 0;
  const totalFloatAdditions = dashboard?.float_summary?.total_additions || 0;
  const totalFloat = dashboard?.float_summary?.total_float || 0;
  const additionCount = dashboard?.float_summary?.addition_count || 0;

  // Calculate withdrawn
  const totalWithdrawn =
    (dashboard?.totals?.withdrawals || 0) + (dashboard?.totals?.expenses || 0);

  // Outstanding credit check
  const outstandingCredit = dashboard?.outstanding_credit || 0;
  const chipsInCirculation = dashboard?.chips_in_circulation || 0;

  const handleCloseSession = async () => {
    setClosingSession(true);
    try {
      await onCloseSession();
      toast({
        title: 'Session Closed',
        description: 'Daily session has been closed successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to close session',
      });
    } finally {
      setClosingSession(false);
      setShowCloseConfirm(false);
    }
  };

  // No active session - show start session UI
  if (!hasActiveSession || !session) {
    return (
      <Card className="shadow-md bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
              <PlayCircle className="w-8 h-8 text-gray-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700">No Active Session</h3>
              <p className="text-sm text-gray-500 mt-1">
                Start a new session to begin recording transactions
              </p>
            </div>
            <Button
              onClick={onStartSession}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Start New Session
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active session - show session details
  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-shadow bg-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-600">Daily Session</p>
              <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
            </div>
          </div>

          <div className="space-y-2">
            {/* Opening Float */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Opening Float</span>
              <span className="text-sm font-semibold text-gray-700">
                {formatCurrency(initialOpeningFloat)}
              </span>
            </div>

            {/* Float Additions */}
            {additionCount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Float Added (Mali)</span>
                <span className="text-sm font-semibold text-green-600">
                  + {formatCurrency(totalFloatAdditions)}
                </span>
              </div>
            )}

            {/* Total Float */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-300">
              <span className="text-xs text-gray-500">Total Float</span>
              <span className="text-lg font-bold text-blue-700">
                {formatCurrency(totalFloat)}
              </span>
            </div>

            {/* Withdrawn */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Withdrawn</span>
              <span className="text-sm font-semibold text-red-600">
                {formatCurrency(totalWithdrawn)}
              </span>
            </div>

            {/* Float history button */}
            {additionCount > 0 && (
              <button
                onClick={onOpenFloatHistory}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2"
              >
                <History className="w-3 h-3" />
                View {additionCount} addition{additionCount > 1 ? 's' : ''}
              </button>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 mt-3">
              <Button
                onClick={onAddFloat}
                className="flex-1 h-8 text-xs bg-gradient-to-r from-green-500 to-emerald-600"
              >
                <Plus className="w-3 h-3 mr-1" />
                {additionCount === 0 ? 'Add Float' : 'Add More'}
              </Button>
              <Button
                onClick={() => setShowCloseConfirm(true)}
                variant="outline"
                className="flex-1 h-8 text-xs border-red-300 text-red-600 hover:bg-red-50"
              >
                <Power className="w-3 h-3 mr-1" />
                Close
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Close Session Confirmation Dialog */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Power className="w-5 h-5 text-red-600" />
              Close Daily Session
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Are you sure you want to close today's session?</p>

              {/* Warnings */}
              {(outstandingCredit > 0 || chipsInCirculation > 0) && (
                <div className="space-y-2">
                  {outstandingCredit > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-orange-700">
                        Outstanding credit: {formatCurrency(outstandingCredit)}
                      </span>
                    </div>
                  )}
                  {chipsInCirculation > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700">
                        Chips with players: {formatCurrency(chipsInCirculation)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-500">
                You can start a new session after closing this one.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closingSession}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseSession}
              disabled={closingSession}
              className="bg-red-600 hover:bg-red-700"
            >
              {closingSession ? 'Closing...' : 'Close Session'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SessionOverviewCard;

