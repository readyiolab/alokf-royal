// ============================================
// FILE: components/floor-manager/modals/CloseTableConfirmationModal.jsx
// Close Table Confirmation Modal with Statistics
// ============================================

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Download, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import floorManagerService from "../../../services/floorManager.service";

const CloseTableConfirmationModal = ({ open, onOpenChange, tableId, onConfirm }) => {
  const { toast } = useToast();
  const token = localStorage.getItem("auth_token");
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState(null);
  const [manualRake, setManualRake] = useState("0");

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format date/time
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fetch table statistics
  useEffect(() => {
    if (open && tableId) {
      fetchTableStatistics();
    }
  }, [open, tableId]);

  const fetchTableStatistics = async () => {
    try {
      setLoading(true);
      const response = await floorManagerService.getTableStatistics(tableId, token);
      const data = response?.data || response;
      setStats(data);
      setManualRake(data?.rake?.toString() || "0");
    } catch (error) {
      console.error("Error fetching table statistics:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load table statistics",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle download CSV
  const handleDownloadCSV = () => {
    if (!stats) return;

    const csvRows = [
      ["Table Close Report"],
      ["Table Number", stats.table_number],
      ["Table Start Time", formatDateTime(stats.table_start_time)],
      [""],
      ["Statistics"],
      ["Total Buy-ins", formatCurrency(stats.total_buy_ins)],
      ["Total Buy-outs", formatCurrency(stats.total_buy_outs)],
      ["Chips on Table", formatCurrency(stats.chips_on_table)],
      ["Rake", formatCurrency(parseFloat(manualRake) || stats.rake)],
      [""],
      ["Players"],
      ["Total Players Joined", stats.total_players_joined],
      ["Unique New Players", stats.unique_new_players],
      ["Current Players", stats.current_players],
      [""],
      ["Reconciliation"],
      ["Formula", "Buy-in = Buy-out + Chips + Rake"],
      ["Total Buy-in (A)", formatCurrency(stats.total_buy_ins)],
      ["Total Buy-out (B)", formatCurrency(stats.total_buy_outs)],
      ["Chips on Table (C)", formatCurrency(stats.chips_on_table)],
      ["Rake (D)", formatCurrency(parseFloat(manualRake) || stats.rake)],
      ["Expected (B+C+D)", formatCurrency(
        stats.total_buy_outs + stats.chips_on_table + (parseFloat(manualRake) || stats.rake)
      )],
      ["Difference (A - Expected)", formatCurrency(
        stats.total_buy_ins - (stats.total_buy_outs + stats.chips_on_table + (parseFloat(manualRake) || stats.rake))
      )],
      [""],
      ["Generated At", new Date().toLocaleString('en-IN')],
    ];

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `table-${stats.table_number}-close-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "Report downloaded successfully",
    });
  };

  // Handle confirm close
  const handleConfirmClose = async () => {
    if (!stats) return;

    try {
      setProcessing(true);
      await onConfirm(tableId);
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to close table",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Calculate reconciliation with manual rake
  const currentRake = parseFloat(manualRake) || stats?.rake || 0;
  const expected = stats ? stats.total_buy_outs + stats.chips_on_table + currentRake : 0;
  const difference = stats ? stats.total_buy_ins - expected : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a2e] border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Are you sure you want to end this table?
          </DialogTitle>
          <p className="text-gray-400 text-sm mt-1">
            Please review and download the report before closing.
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : stats ? (
          <div className="space-y-6 mt-4">
            {/* Statistics Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Total Buy-ins</p>
                <p className="text-white text-2xl font-bold">
                  {formatCurrency(stats.total_buy_ins)}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Total Buy-outs</p>
                <p className="text-white text-2xl font-bold">
                  {formatCurrency(stats.total_buy_outs)}
                </p>
              </div>
            </div>

            {/* Table Info */}
            <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Table Start Time:</p>
                  <p className="text-white">{formatDateTime(stats.table_start_time)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Players Joined:</p>
                  <p className="text-white font-semibold">{stats.total_players_joined}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Unique New Players:</p>
                  <p className="text-white font-semibold">{stats.unique_new_players}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Current Players:</p>
                  <p className="text-white font-semibold">{stats.current_players}</p>
                </div>
              </div>
            </div>

            {/* Chips on Table */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Chips on Table:</p>
              <p className="text-white text-2xl font-bold">
                {formatCurrency(stats.chips_on_table)}
              </p>
            </div>

            {/* Chip Outflows - Manual Rake Entry */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-2">Chip Outflows (Manual Entry)</p>
              <div>
                <label className="text-gray-300 text-sm mb-2 block">Rake</label>
                <div className="flex items-center gap-2">
                  <span className="text-white">₹</span>
                  <Input
                    type="number"
                    value={manualRake}
                    onChange={(e) => setManualRake(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Reconciliation Tally */}
            <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
              <div>
                <p className="text-white font-semibold mb-2">Reconciliation Tally</p>
                <p className="text-gray-400 text-sm mb-4">Formula:</p>
                <p className="text-gray-300 text-sm font-medium mb-4">
                  Buy-in = Buy-out + Chips + Rake
                </p>
              </div>

              <div className="space-y-3 border-t border-gray-700 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Buy-in (A):</span>
                  <span className="text-white font-semibold">
                    {formatCurrency(stats.total_buy_ins)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Buy-out (B):</span>
                  <span className="text-white font-semibold">
                    {formatCurrency(stats.total_buy_outs)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Chips on Table (C):</span>
                  <span className="text-white font-semibold">
                    {formatCurrency(stats.chips_on_table)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rake (D):</span>
                  <span className="text-white font-semibold">
                    {formatCurrency(currentRake)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2">
                  <span className="text-gray-300 font-medium">Expected (B+C+D):</span>
                  <span className="text-white font-bold">
                    {formatCurrency(expected)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300 font-medium">Difference (A - Expected):</span>
                  <span className={`font-bold ${
                    difference >= 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {formatCurrency(difference)}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  * Difference may include dealer tips, food/expenses, or other outflows tracked at cashier level.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            No statistics available
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDownloadCSV}
            disabled={!stats || loading}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Report (CSV)
          </Button>
          <Button
            onClick={handleConfirmClose}
            disabled={!stats || processing || loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {processing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Confirm End Table
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CloseTableConfirmationModal;

