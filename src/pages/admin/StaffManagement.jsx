// pages/admin/StaffManagement.jsx
import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  DollarSign,
  TrendingDown,
  Filter,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

import AdminLayout from "../../components/layouts/AdminLayout";
import staffService from "../../services/staff.service";

const StaffManagement = () => {
  const [activeTab, setActiveTab] = useState("list");
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Staff Modal
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({
    staff_name: "",
    staff_role: "",
    phone_number: "",
    monthly_salary: "",
    date_of_joining: "",
  });

  // Advance Modal
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [selectedStaffForAdvance, setSelectedStaffForAdvance] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceNotes, setAdvanceNotes] = useState("");
  const [remainingBalance, setRemainingBalance] = useState(null);
  const [advanceHistory, setAdvanceHistory] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Attendance
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState({});

  const ROLES = [
    { value: "cleaner", label: "Cleaner" },
    { value: "washroom_cleaner", label: "Washroom Cleaner" },
    { value: "watchman", label: "Watchman" },
    { value: "security", label: "Security" },
    { value: "manager", label: "Manager" },
    { value: "assistant", label: "Assistant" },
    { value: "other", label: "Other" },
  ];

  useEffect(() => {
    fetchStaff();
  }, []);

  // Auto-clear alerts
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await staffService.getAllStaff();
      setStaffList(response.data || []);
    } catch (err) {
      setError("Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStaff = async () => {
    try {
      if (editingStaff) {
        await staffService.updateStaff(editingStaff.staff_id, staffForm);
        setSuccess("Staff updated successfully");
      } else {
        await staffService.createStaff(staffForm);
        setSuccess("Staff added successfully");
      }
      setStaffDialogOpen(false);
      resetStaffForm();
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save staff");
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm("Are you sure you want to delete this staff member?"))
      return;
    try {
      await staffService.deleteStaff(staffId);
      setSuccess("Staff deleted successfully");
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete staff");
    }
  };

  const handleMarkAttendance = async (staffId, status) => {
    try {
      await staffService.markAttendance(staffId, {
        date: attendanceDate,
        status,
      });
      setAttendanceRecords((prev) => ({ ...prev, [staffId]: status }));
      setSuccess(`Attendance marked as ${status}`);
    } catch (err) {
      setError("Failed to mark attendance");
    }
  };

  const openAdvanceDialog = async (staff) => {
    setSelectedStaffForAdvance(staff);
    setAdvanceDialogOpen(true);
    setLoadingBalance(true);
    setAdvanceAmount("");
    setAdvanceNotes("");

    try {
      const [balanceRes, historyRes] = await Promise.all([
        staffService.getRemainingBalance(staff.staff_id),
        staffService.getAdvanceHistory(staff.staff_id),
      ]);
      setRemainingBalance(balanceRes.data);
      setAdvanceHistory(historyRes.data || []);
    } catch (err) {
      setError("Failed to fetch balance info");
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleSalaryAdvance = async () => {
    try {
      const result = await staffService.giveSalaryAdvance(
        selectedStaffForAdvance.staff_id,
        {
          advance_amount: parseFloat(advanceAmount),
          notes: advanceNotes,
        }
      );
      setSuccess(`Advance of ₹${advanceAmount} recorded`);
      setAdvanceDialogOpen(false);
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record advance");
    }
  };

  const resetStaffForm = () => {
    setStaffForm({
      staff_name: "",
      staff_role: "",
      phone_number: "",
      monthly_salary: "",
      date_of_joining: "",
    });
    setEditingStaff(null);
  };

  const openEditDialog = (staff) => {
    setEditingStaff(staff);
    setStaffForm({
      staff_name: staff.staff_name,
      staff_role: staff.staff_role,
      phone_number: staff.phone_number || "",
      monthly_salary: staff.monthly_salary,
      date_of_joining: staff.date_of_joining?.split("T")[0] || "",
    });
    setStaffDialogOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getRoleLabel = (roleValue) => {
    const role = ROLES.find((r) => r.value === roleValue);
    return role
      ? role.label
      : roleValue.charAt(0).toUpperCase() + roleValue.slice(1);
  };

  const filteredStaff = staffList.filter(
    (staff) =>
      staff.staff_name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedRole === "all" || staff.staff_role === selectedRole)
  );

  const groupedStaff = () => {
    const grouped = {};
    filteredStaff.forEach((staff) => {
      const role = staff.staff_role || "other";
      if (!grouped[role]) grouped[role] = [];
      grouped[role].push(staff);
    });
    return grouped;
  };

  const totalPayroll = staffList.reduce(
    (sum, s) => sum + (parseFloat(s.monthly_salary) || 0),
    0
  );
  const totalAdvances = staffList.reduce(
    (sum, s) => sum + parseFloat(s.total_advances_given || 0),
    0
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full  grid-cols-3">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Staff List
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Attendance
            </TabsTrigger>
            <TabsTrigger value="salary" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Salary & Advances
            </TabsTrigger>
          </TabsList>

          {/* Staff List Tab */}
          <TabsContent value="list" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => {
                  resetStaffForm();
                  setStaffDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Staff
              </Button>
            </div>

            {loading ? (
              <div className="space-y-10">
                {[...Array(2)].map(
                  (
                    _,
                    i // Simulate 2 role groups
                  ) => (
                    <div key={i}>
                      <Skeleton className="h-8 w-48 mb-6" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, j) => (
                          <Card key={j} className="border-gray-200">
                            <CardContent className="p-6 space-y-4">
                              <Skeleton className="h-8 w-40 rounded" />
                              <Skeleton className="h-4 w-32 rounded" />
                              <Skeleton className="h-4 w-24 rounded" />
                              <Skeleton className="h-12 w-full rounded-lg" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : Object.keys(groupedStaff()).length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="text-center py-16">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No staff found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-12">
                {Object.entries(groupedStaff()).map(([role, members]) => (
                  <div key={role}>
                    {/* Role Header - Clean & Light */}
                    <div className="flex items-center gap-4 mb-6">
                      <Badge
                        variant="secondary"
                        className="text-base px-6 py-2 bg-gray-100 text-gray-800 font-semibold"
                      >
                        {getRoleLabel(role)}
                      </Badge>
                      <span className="text-gray-600 font-medium">
                        {members.length} member{members.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Fixed 4-column grid on large screens, responsive otherwise */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {members.map((staff) => (
                        <Card
                          key={staff.staff_id}
                          className="bg-white border border-gray-200 rounded-xl hover:shadow-xl transition-shadow duration-300"
                        >
                          <CardContent className="p-6 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-5">
                              <div className="space-y-1">
                                <h3 className="font-bold text-lg text-gray-900">
                                  {staff.staff_name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {staff.phone_number || "No phone"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Joined:{" "}
                                  {new Date(
                                    staff.date_of_joining
                                  ).toLocaleDateString("en-IN")}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => openEditDialog(staff)}
                                  className="hover:bg-gray-100 rounded-lg"
                                >
                                  <Edit className="w-4 h-4 text-gray-700" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() =>
                                    handleDeleteStaff(staff.staff_id)
                                  }
                                  className="hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-4 mt-auto pt-5 border-t border-gray-100">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                  Monthly Salary
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {formatCurrency(staff.monthly_salary)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                  Advance Given
                                </span>
                                {parseFloat(staff.total_advances_given || 0) >
                                0 ? (
                                  <span className="font-semibold text-red-600">
                                    {formatCurrency(staff.total_advances_given)}
                                  </span>
                                ) : (
                                  <span className="font-medium text-green-600">
                                    ₹0
                                  </span>
                                )}
                              </div>
                            </div>

                            <Button
                              className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white font-medium"
                              onClick={() => openAdvanceDialog(staff)}
                            >
                              <Wallet className="w-4 h-4 mr-2" />
                              Give Advance
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card className="bg-white text-black">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Mark Daily Attendance</CardTitle>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-black" />
                    <Input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="w-auto text-white"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {staffList.map((staff) => (
                  <div
                    key={staff.staff_id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{staff.staff_name}</h3>
                      <p className="text-sm text-gray-500">
                        {getRoleLabel(staff.staff_role)} •{" "}
                        {staff.phone_number || "No phone"}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      {["present", "absent", "half_day"].map((status) => {
                        const isActive =
                          attendanceRecords[staff.staff_id] === status;
                        const variants = {
                          present: isActive ? "default" : "",
                          absent: isActive ? "destructive" : "",
                          half_day: isActive ? "secondary" : "",
                        };
                        const icons = {
                          present: CheckCircle,
                          absent: XCircle,
                          half_day: Clock,
                        };
                        const Icon = icons[status];
                        return (
                          <Button
                            key={status}
                            variant={variants[status]}
                            onClick={() =>
                              handleMarkAttendance(staff.staff_id, status)
                            }
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {status.replace("_", " ").charAt(0).toUpperCase() +
                              status.slice(1).replace("_", " ")}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Salary Tab */}
          <TabsContent value="salary" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white text-black">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Staff</p>
                      <p className="text-3xl font-bold">{staffList.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white text-black">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Monthly Payroll</p>
                      <p className="text-3xl font-bold">
                        {formatCurrency(totalPayroll)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white text-black">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        Total Advances Given
                      </p>
                      <p className="text-3xl font-bold text-red-600">
                        {formatCurrency(totalAdvances)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white text-black">
              <CardHeader>
                <CardTitle>Salary Details & Advances</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-black text-white">
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Monthly Salary</TableHead>
                      <TableHead>Daily Rate</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffList.map((staff) => (
                      <TableRow key={staff.staff_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{staff.staff_name}</p>
                            <p className="text-sm text-gray-500">
                              {staff.phone_number || "No phone"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getRoleLabel(staff.staff_role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(staff.monthly_salary)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(
                            (parseFloat(staff.monthly_salary) || 0) / 30
                          )}
                        </TableCell>
                        <TableCell>
                          {parseFloat(staff.total_advances_given) > 0 ? (
                            <span className="font-semibold text-red-600">
                              {formatCurrency(staff.total_advances_given)}
                            </span>
                          ) : (
                            <span className="font-semibold text-green-600">
                              ₹0
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => openAdvanceDialog(staff)}
                          >
                            <Wallet className="w-4 h-4 mr-2" /> Give Advance
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Staff Dialog */}
        <Dialog
          open={staffDialogOpen}
          onOpenChange={(open) => {
            setStaffDialogOpen(open);
            if (!open) resetStaffForm();
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label>Full Name</Label>
                <Input
                  value={staffForm.staff_name}
                  onChange={(e) =>
                    setStaffForm((prev) => ({
                      ...prev,
                      staff_name: e.target.value,
                    }))
                  }
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select
                    value={staffForm.staff_role}
                    onValueChange={(v) =>
                      setStaffForm((prev) => ({ ...prev, staff_role: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    value={staffForm.phone_number}
                    onChange={(e) =>
                      setStaffForm((prev) => ({
                        ...prev,
                        phone_number: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Monthly Salary (₹)</Label>
                  <Input
                    type="number"
                    value={staffForm.monthly_salary}
                    onChange={(e) =>
                      setStaffForm((prev) => ({
                        ...prev,
                        monthly_salary: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Date of Joining</Label>
                  <Input
                    type="date"
                    value={staffForm.date_of_joining}
                    onChange={(e) =>
                      setStaffForm((prev) => ({
                        ...prev,
                        date_of_joining: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStaffDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveStaff}>
                {editingStaff ? "Update" : "Add"} Staff
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Salary Advance Dialog */}
        <Dialog open={advanceDialogOpen} onOpenChange={setAdvanceDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Salary Advance - {selectedStaffForAdvance?.staff_name}
              </DialogTitle>
            </DialogHeader>
            {loadingBalance ? (
              <div className="flex flex-col items-center py-12">
                <RefreshCw className="w-10 h-10 animate-spin" />
                <p className="mt-4 text-gray-500">Loading balance...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 rounded-2xl bg-white text-black">
                      <p className="text-sm text-gray-600">Monthly Salary</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(
                          remainingBalance?.monthly_salary ||
                            selectedStaffForAdvance?.monthly_salary
                        )}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                      <p className="text-sm text-orange-700">
                        Advances This Month
                      </p>
                      <p className="text-xl font-bold text-orange-600">
                        {formatCurrency(
                          remainingBalance?.total_advances_this_month || 0
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card
                  className={
                    remainingBalance?.remaining_balance > 0
                      ? "border-green-300 bg-green-50"
                      : "border-red-300 bg-red-50"
                  }
                >
                  <CardContent className="p-3 text-center">
                    <p className="text-sm font-medium text-gray-600">
                      Available for Advance
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        remainingBalance?.remaining_balance > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(remainingBalance?.remaining_balance || 0)}
                    </p>
                  </CardContent>
                </Card>

                {remainingBalance?.remaining_balance > 0 ? (
                  <>
                    <div className="space-y-4">
                      <div>
                        <Label>Advance Amount</Label>
                        <Input
                          type="number"
                          value={advanceAmount}
                          onChange={(e) => setAdvanceAmount(e.target.value)}
                          max={remainingBalance?.remaining_balance}
                          placeholder="0"
                          className="text-xl font-semibold"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Max:{" "}
                          {formatCurrency(remainingBalance?.remaining_balance)}
                        </p>
                      </div>
                      <div>
                        <Label>Notes (Optional)</Label>
                        <Textarea
                          value={advanceNotes}
                          onChange={(e) => setAdvanceNotes(e.target.value)}
                          placeholder="Reason for advance..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-red-600">
                      No balance available this month
                    </p>
                  </div>
                )}

                {advanceHistory.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Clock className="w-5 h-5" /> Advance History
                    </h3>
                    {advanceHistory.map((adv, i) => (
                      <Card key={i}>
                        <CardContent className="p-4 flex justify-between items-start">
                          <div>
                            <p className="font-bold text-lg">
                              {formatCurrency(adv.advance_amount)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(adv.created_at).toLocaleDateString()} •{" "}
                              {adv.for_month}
                            </p>
                            {adv.notes && (
                              <p className="text-sm text-gray-600 mt-1">
                                {adv.notes}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant={adv.is_deducted ? "default" : "secondary"}
                          >
                            {adv.is_deducted ? "Deducted" : "Pending"}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <DialogFooter className="flex gap-3 sm:justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setAdvanceDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  {remainingBalance?.remaining_balance > 0 && (
                    <Button
                      onClick={handleSalaryAdvance}
                      disabled={
                        !advanceAmount ||
                        parseFloat(advanceAmount) <= 0 ||
                        parseFloat(advanceAmount) >
                          remainingBalance.remaining_balance
                      }
                    >
                      Give Advance
                    </Button>
                  )}
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default StaffManagement;
