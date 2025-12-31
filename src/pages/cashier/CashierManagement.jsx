// src/pages/cashier/CashierManagement.jsx
// Cashier Management Page

import React, { useState, useEffect } from "react";
import CashierLayout from "../../components/layouts/CashierLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, Edit2, Trash2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import userService from "../../services/user.service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CashierManagement = () => {
  const [cashiers, setCashiers] = useState([]);
  const [filteredCashiers, setFilteredCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [filterRole, setFilterRole] = useState("cashier");
  const [filterShift, setFilterShift] = useState("all");

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    email: "",
  });

  // Fetch all cashiers
  const fetchCashiers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers("cashier");
      const cashiersList = response?.data || response || [];
      setCashiers(cashiersList);
      setFilteredCashiers(cashiersList);
    } catch (err) {
      console.error("Error fetching cashiers:", err);
      toast.error("Failed to load cashiers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashiers();
  }, []);

  // Filter cashiers
  useEffect(() => {
    let filtered = cashiers;

    // Filter by shift (if we have shift data in the future)
    // For now, all cashiers will show
    if (filterShift !== "all") {
      // Future: filter by shift_assignment
    }

    setFilteredCashiers(filtered);
  }, [filterRole, filterShift, cashiers]);

  // Handle add cashier
  const handleAddCashier = async () => {
    if (!formData.full_name.trim()) {
      toast.error("Cashier name is required");
      return;
    }

    try {
      const response = await userService.createUser({
        full_name: formData.full_name,
        phone_number: formData.phone_number || null,
        email: formData.email || null,
      });

      if (response.success) {
        toast.success("Cashier added successfully");
        setShowAddDialog(false);
        resetForm();
        fetchCashiers();
      } else {
        toast.error(response.message || "Failed to add cashier");
      }
    } catch (err) {
      console.error("Error adding cashier:", err);
      toast.error(err.message || "Failed to add cashier");
    }
  };

  // Handle edit cashier
  const handleEditCashier = async () => {
    if (!selectedCashier || !formData.full_name.trim()) {
      toast.error("Cashier name is required");
      return;
    }

    try {
      const response = await userService.updateUser(selectedCashier.cashier_id, {
        full_name: formData.full_name,
        phone_number: formData.phone_number || null,
        email: formData.email || null,
      });

      if (response.success) {
        toast.success("Cashier updated successfully");
        setShowEditDialog(false);
        setSelectedCashier(null);
        resetForm();
        fetchCashiers();
      } else {
        toast.error(response.message || "Failed to update cashier");
      }
    } catch (err) {
      console.error("Error updating cashier:", err);
      toast.error(err.message || "Failed to update cashier");
    }
  };

  // Handle delete cashier
  const handleDeleteCashier = async () => {
    if (!selectedCashier) return;

    try {
      const response = await userService.deactivateUser(selectedCashier.cashier_id);

      if (response.success) {
        toast.success("Cashier deactivated successfully");
        setShowDeleteDialog(false);
        setSelectedCashier(null);
        fetchCashiers();
      } else {
        toast.error(response.message || "Failed to delete cashier");
      }
    } catch (err) {
      console.error("Error deleting cashier:", err);
      toast.error(err.message || "Failed to delete cashier");
    }
  };

  // Open edit dialog
  const openEditDialog = (cashier) => {
    setSelectedCashier(cashier);
    setFormData({
      full_name: cashier.full_name || "",
      phone_number: cashier.phone_number || "",
      email: cashier.email || "",
    });
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (cashier) => {
    setSelectedCashier(cashier);
    setShowDeleteDialog(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      full_name: "",
      phone_number: "",
      email: "",
    });
    setSelectedCashier(null);
  };

  // Get initials
  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "C"
    );
  };

  if (loading) {
    return (
      <CashierLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </CashierLayout>
    );
  }

  return (
    <CashierLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cashier Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Add and manage cashiers for the poker room
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowAddDialog(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Cashier
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[150px]">
                <Label className="text-sm text-gray-600 mb-2 block">Role</Label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <Label className="text-sm text-gray-600 mb-2 block">Shift</Label>
                <Select value={filterShift} onValueChange={setFilterShift}>
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shifts</SelectItem>
                    <SelectItem value="day">Day Shift</SelectItem>
                    <SelectItem value="night">Night Shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cashiers Grid */}
        {filteredCashiers.length === 0 ? (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="py-12 text-center">
              <Settings2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900">No cashiers found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCashiers.map((cashier) => (
              <Card
                key={cashier.cashier_id}
                className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="w-12 h-12 bg-gray-100">
                        <AvatarFallback className="text-gray-600 font-semibold">
                          {getInitials(cashier.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">
                          {cashier.full_name}
                        </h3>
                        {cashier.phone_number && (
                          <p className="text-sm text-gray-600 mt-1">
                            {cashier.phone_number}
                          </p>
                        )}
                        {cashier.email && (
                          <p className="text-sm text-gray-500 mt-1">
                            {cashier.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900"
                        onClick={() => openEditDialog(cashier)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-600 hover:text-red-600"
                        onClick={() => openDeleteDialog(cashier)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Cashier Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <UserPlus className="w-5 h-5 text-orange-600" />
                </div>
                Add New Cashier
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                Add a new cashier to manage shifts and transactions.
              </p>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>
                  Cashier Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter cashier name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="Enter phone number"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  className="border-gray-200"
                />
              </div>

            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCashier}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Add Cashier
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Cashier Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Edit2 className="w-5 h-5 text-orange-600" />
                </div>
                Edit Cashier
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>
                  Cashier Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter cashier name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="Enter phone number"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  className="border-gray-200"
                />
              </div>

            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditCashier}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Update Cashier
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Cashier</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to deactivate {selectedCashier?.full_name}? This action
                will prevent them from logging in.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCashier}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CashierLayout>
  );
};

export default CashierManagement;

