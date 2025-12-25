// components/admin/ClubExpenseModal.jsx
// Club Expense - Food delivery, salary advance, utilities, supplies, etc.

import React, { useState, useEffect } from 'react';
import { X, Building2, Truck, Wallet, Zap, Package, Wrench, MoreHorizontal, User, Check, Loader2, CheckCircle, Receipt, AlertCircle, Clock, RefreshCw, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import expenseService from '../../services/expense.service';
import staffService from '../../services/staff.service';

const EXPENSE_CATEGORIES = [
  { value: 'food_delivery', label: 'Food Delivery', icon: Truck, color: 'from-orange-500 to-amber-500', bgColor: 'bg-orange-50 border-orange-200' },
  { value: 'salary_advance', label: 'Salary Advance', icon: Wallet, color: 'from-emerald-500 to-green-500', bgColor: 'bg-emerald-50 border-emerald-200' },
  { value: 'utilities', label: 'Utilities', icon: Zap, color: 'from-yellow-500 to-amber-500', bgColor: 'bg-yellow-50 border-yellow-200' },
  { value: 'supplies', label: 'Supplies', icon: Package, color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50 border-blue-200' },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'from-purple-500 to-violet-500', bgColor: 'bg-purple-50 border-purple-200' },
  { value: 'miscellaneous', label: 'Miscellaneous', icon: MoreHorizontal, color: 'from-gray-500 to-slate-500', bgColor: 'bg-gray-50 border-gray-200' }
];

const ClubExpenseModal = ({ isOpen, onClose, onSuccess }) => {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Staff detail states (like StaffManagement)
  const [loadingStaffDetails, setLoadingStaffDetails] = useState(false);
  const [remainingBalance, setRemainingBalance] = useState(null);
  const [advanceHistory, setAdvanceHistory] = useState([]);

  useEffect(() => {
    if (isOpen && category === 'salary_advance') {
      fetchStaff();
    }
  }, [isOpen, category]);

  // Fetch staff details when a staff is selected
  useEffect(() => {
    if (selectedStaff) {
      fetchStaffDetails(selectedStaff.staff_id);
    } else {
      setRemainingBalance(null);
      setAdvanceHistory([]);
    }
  }, [selectedStaff]);

  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const response = await staffService.getAllStaff();
      setStaffList(response.data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchStaffDetails = async (staffId) => {
    setLoadingStaffDetails(true);
    try {
      const [balanceRes, historyRes] = await Promise.all([
        staffService.getRemainingBalance(staffId),
        staffService.getAdvanceHistory(staffId)
      ]);
      setRemainingBalance(balanceRes.data);
      setAdvanceHistory(historyRes.data || []);
    } catch (err) {
      console.error('Error fetching staff details:', err);
    } finally {
      setLoadingStaffDetails(false);
    }
  };

  const handleSubmit = async () => {
    if (!category) {
      setError('Please select an expense category');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (category === 'salary_advance' && !selectedStaff) {
      setError('Please select a staff member for salary advance');
      return;
    }

    // Check if advance exceeds remaining balance
    if (category === 'salary_advance' && remainingBalance) {
      if (parseFloat(amount) > remainingBalance.remaining_balance) {
        setError(`Amount exceeds available balance (${formatCurrency(remainingBalance.remaining_balance)})`);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const expenseData = {
        expense_category: category,
        amount: parseFloat(amount),
        notes: description,
        vendor_name: vendorName,
        bill_number: billNumber
      };

      if (category === 'salary_advance' && selectedStaff) {
        expenseData.staff_id = selectedStaff.staff_id;
      }

      const response = await expenseService.recordClubExpense(expenseData);

      setSuccess('Club expense recorded successfully');
      
      setTimeout(() => {
        onSuccess && onSuccess(response);
        resetForm();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record expense');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCategory('');
    setAmount('');
    setDescription('');
    setVendorName('');
    setBillNumber('');
    setSelectedStaff(null);
    setRemainingBalance(null);
    setAdvanceHistory([]);
    setError('');
    setSuccess('');
  };

  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const selectedCategory = EXPENSE_CATEGORIES.find(c => c.value === category);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Club Expense</CardTitle>
              <p className="text-sm text-indigo-100 mt-1">Record club expenses (cash from wallet)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Expense Category *</Label>
            <div className="grid grid-cols-2 gap-3">
              {EXPENSE_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = category === cat.value;
                return (
                  <div
                    key={cat.value}
                    onClick={() => {
                      setCategory(cat.value);
                      if (cat.value !== 'salary_advance') {
                        setSelectedStaff(null);
                        setRemainingBalance(null);
                        setAdvanceHistory([]);
                      }
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? `${cat.bgColor} shadow-md`
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? `bg-gradient-to-br ${cat.color} text-white` : 'bg-gray-100 text-gray-500'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className={`font-semibold text-sm ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                      {cat.label}
                    </span>
                    {isSelected && <Check className="w-5 h-5 text-indigo-600 ml-auto" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Staff Selection for Salary Advance */}
          {category === 'salary_advance' && (
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                Select Staff Member *
              </Label>
              
              {loadingStaff ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="ml-2 text-gray-500">Loading staff...</span>
                </div>
              ) : staffList.length === 0 ? (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertDescription className="text-amber-700">
                    No staff found. Please add staff first.
                  </AlertDescription>
                </Alert>
              ) : (
                <ScrollArea className="h-[120px]">
                  <div className="grid grid-cols-2 gap-2">
                    {staffList.map((staff) => (
                      <div
                        key={staff.staff_id}
                        onClick={() => setSelectedStaff(staff)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedStaff?.staff_id === staff.staff_id
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            selectedStaff?.staff_id === staff.staff_id 
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                              : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            {staff.staff_name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{staff.staff_name}</p>
                            <p className="text-xs text-gray-500">{staff.staff_role}</p>
                          </div>
                          {selectedStaff?.staff_id === staff.staff_id && (
                            <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Staff Details Panel - Like StaffManagement */}
              {selectedStaff && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  {loadingStaffDetails ? (
                    <div className="flex flex-col items-center py-8">
                      <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                      <p className="mt-3 text-gray-500">Loading details...</p>
                    </div>
                  ) : (
                    <>
                      {/* Staff Info Header */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                          {selectedStaff.staff_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{selectedStaff.staff_name}</h3>
                          <p className="text-sm text-gray-500">{selectedStaff.staff_role} • {selectedStaff.phone_number || 'No phone'}</p>
                        </div>
                      </div>

                      {/* Salary & Advance Cards */}
                      <div className="grid grid-cols-2 gap-3">
                        <Card className="border-gray-200">
                          <CardContent className="p-4">
                            <p className="text-xs text-gray-500 mb-1">Monthly Salary</p>
                            <p className="text-xl font-bold text-gray-900">
                              {formatCurrency(remainingBalance?.monthly_salary || selectedStaff.monthly_salary)}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="border-orange-200 bg-orange-50">
                          <CardContent className="p-4">
                            <p className="text-xs text-orange-600 mb-1">Advances This Month</p>
                            <p className="text-xl font-bold text-orange-600">
                              {formatCurrency(remainingBalance?.total_advances_this_month || 0)}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Remaining Balance Card */}
                      <Card className={
                        remainingBalance?.remaining_balance > 0
                          ? 'border-green-300 bg-green-50'
                          : 'border-red-300 bg-red-50'
                      }>
                        <CardContent className="p-4 text-center">
                          <p className="text-sm font-medium text-gray-600 mb-1">Available for Advance</p>
                          <p className={`text-2xl font-bold ${
                            remainingBalance?.remaining_balance > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(remainingBalance?.remaining_balance || 0)}
                          </p>
                        </CardContent>
                      </Card>

                      {/* No Balance Warning */}
                      {remainingBalance?.remaining_balance <= 0 && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <AlertDescription className="text-red-700">
                            No balance available for advance this month. Full salary already given as advance.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Advance History */}
                      {advanceHistory.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4" /> Recent Advance History
                          </h4>
                          <ScrollArea className="h-[100px]">
                            <div className="space-y-2">
                              {advanceHistory.slice(0, 5).map((adv, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                  <div>
                                    <p className="font-semibold text-gray-900">{formatCurrency(adv.advance_amount)}</p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(adv.created_at).toLocaleDateString('en-IN')} • {adv.for_month}
                                    </p>
                                  </div>
                                  <Badge variant={adv.is_deducted ? 'default' : 'secondary'} className="text-xs">
                                    {adv.is_deducted ? 'Deducted' : 'Pending'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Amount - Only show if balance available or non-salary expense */}
          {(category !== 'salary_advance' || (selectedStaff && remainingBalance?.remaining_balance > 0)) && (
            <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 shadow-md">
              <CardContent className="pt-5 pb-4">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <Wallet className="w-4 h-4" />
                  Amount *
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl font-bold">₹</span>
                  <Input
                    type="number"
                    min="0"
                    max={category === 'salary_advance' ? remainingBalance?.remaining_balance : undefined}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10 h-14 text-3xl font-black text-center border-2 border-gray-200 focus:border-indigo-400"
                    placeholder="0"
                  />
                </div>
                {category === 'salary_advance' && remainingBalance && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Max: {formatCurrency(remainingBalance.remaining_balance)}
                  </p>
                )}

                {/* New Balance Preview for Salary Advance */}
                {category === 'salary_advance' && selectedStaff && amount && parseFloat(amount) > 0 && remainingBalance && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Current Advances:</span>
                      <span className="font-medium text-gray-700">{formatCurrency(remainingBalance.total_advances_this_month)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">New Advance:</span>
                      <span className="font-medium text-orange-600">+ {formatCurrency(parseFloat(amount))}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t border-gray-200 mt-2 pt-2">
                      <span className="text-gray-700">Total Advances:</span>
                      <span className="text-red-600">
                        {formatCurrency((remainingBalance.total_advances_this_month || 0) + parseFloat(amount))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">Remaining After:</span>
                      <span className={`font-semibold ${
                        remainingBalance.remaining_balance - parseFloat(amount) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(remainingBalance.remaining_balance - parseFloat(amount))}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Vendor Name */}
          {category && category !== 'salary_advance' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Vendor Name (Optional)</Label>
              <Input
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g., Swiggy, Zomato, Local Store..."
                className="h-11"
              />
            </div>
          )}

          {/* Bill Number */}
          {category && category !== 'salary_advance' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Bill/Invoice Number (Optional)
              </Label>
              <Input
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="e.g., INV-12345"
                className="h-11"
              />
            </div>
          )}

          {/* Description */}
          {(category !== 'salary_advance' || (selectedStaff && remainingBalance?.remaining_balance > 0)) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Description (Optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={category === 'salary_advance' ? 'Reason for advance...' : 'Describe the expense...'}
                className="h-11"
              />
            </div>
          )}

          {/* Summary */}
          {amount && parseFloat(amount) > 0 && (category !== 'salary_advance' || remainingBalance?.remaining_balance > 0) && (
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 shadow-md">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-800">
                    {selectedCategory?.label || 'Expense'} 
                    {selectedStaff && ` - ${selectedStaff.staff_name}`}
                  </span>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Wallet className="w-3 h-3" />
                    Cash from wallet
                  </p>
                </div>
                <span className="text-3xl font-black text-indigo-600">
                  {formatCurrency(parseFloat(amount))}
                </span>
              </CardContent>
            </Card>
          )}

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-emerald-200 bg-emerald-50">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <AlertDescription className="text-emerald-700">{success}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={
                loading || 
                !category || 
                !amount || 
                parseFloat(amount) <= 0 || 
                (category === 'salary_advance' && !selectedStaff) ||
                (category === 'salary_advance' && remainingBalance && parseFloat(amount) > remainingBalance.remaining_balance) ||
                (category === 'salary_advance' && remainingBalance?.remaining_balance <= 0)
              }
              className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Record Expense {amount && parseFloat(amount) > 0 && `• ${formatCurrency(parseFloat(amount))}`}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubExpenseModal;