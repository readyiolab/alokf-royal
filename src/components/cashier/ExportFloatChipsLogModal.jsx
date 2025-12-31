// src/components/cashier/ExportFloatChipsLogModal.jsx
// Export Float & Chips Log Modal

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar, Download, X } from "lucide-react";
import { format } from "date-fns";

const ExportFloatChipsLogModal = ({ isOpen, onClose, onExport }) => {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [loading, setLoading] = useState(false);

  const handleQuickSelect = (range) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (range) {
      case "today":
        setStartDate(format(today, "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        setStartDate(format(yesterday, "yyyy-MM-dd"));
        setEndDate(format(yesterday, "yyyy-MM-dd"));
        break;
      case "last7days":
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 6);
        setStartDate(format(last7Days, "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "last30days":
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 29);
        setStartDate(format(last30Days, "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "thisMonth":
        const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(format(firstDayThisMonth, "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "lastMonth":
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        setStartDate(format(firstDayLastMonth, "yyyy-MM-dd"));
        setEndDate(format(lastDayLastMonth, "yyyy-MM-dd"));
        break;
      default:
        break;
    }
  };

  const handleExport = async () => {
    if (!startDate || !endDate) {
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date cannot be after end date");
      return;
    }

    setLoading(true);
    try {
      await onExport(startDate, endDate);
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    return format(new Date(dateStr + "T00:00:00"), "dd MMM yyyy");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">Export Float & Chips Log</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Select a date range to export transactions as CSV.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-medium text-gray-700">
                Start Date
              </Label>
              <div className="relative">
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDisplayDate(startDate)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium text-gray-700">
                End Date
              </Label>
              <div className="relative">
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDisplayDate(endDate)}
              </p>
            </div>
          </div>

          {/* Quick Selection Buttons */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Quick Selection</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect("today")}
                className="text-xs"
              >
                Today
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect("yesterday")}
                className="text-xs"
              >
                Yesterday
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect("last7days")}
                className="text-xs"
              >
                Last 7 days
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect("last30days")}
                className="text-xs"
              >
                Last 30 days
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect("thisMonth")}
                className="text-xs"
              >
                This month
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect("lastMonth")}
                className="text-xs"
              >
                Last month
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="text-gray-700"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={loading || !startDate || !endDate}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            {loading ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportFloatChipsLogModal;

