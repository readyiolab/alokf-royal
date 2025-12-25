import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSession } from '../../hooks/useSession';
import transactionService from '../../services/transaction.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, AlertCircle, Receipt, Wallet, ArrowDown, DollarSign } from 'lucide-react';

const ExpenseForm = ({ onSuccess, onCancel }) => {
  const { token } = useAuth();
  const { dashboard } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    description: ''
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Calculate wallet balances
  const secondaryBalance = parseFloat(dashboard?.wallets?.secondary?.balance || 0);
  const primaryBalance = parseFloat(dashboard?.wallets?.primary?.available || dashboard?.session?.available_float || 0);
  const totalAvailable = secondaryBalance + primaryBalance;

  // Calculate expense split preview
  const expenseSplit = useMemo(() => {
    const amount = parseFloat(formData.amount) || 0;
    if (amount <= 0) return { fromSecondary: 0, fromPrimary: 0, isValid: false };

    let fromSecondary = 0;
    let fromPrimary = 0;

    if (secondaryBalance >= amount) {
      fromSecondary = amount;
    } else {
      fromSecondary = secondaryBalance;
      fromPrimary = amount - secondaryBalance;
    }

    const isValid = amount <= totalAvailable;
    return { fromSecondary, fromPrimary, isValid };
  }, [formData.amount, secondaryBalance, totalAvailable]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Valid expense amount is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Expense description is required');
      return;
    }

    if (parseFloat(formData.amount) > totalAvailable) {
      setError(`Insufficient funds. Total Available: ${formatCurrency(totalAvailable)}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await transactionService.createExpense(token, {
        amount: parseFloat(formData.amount),
        description: formData.description.trim()
      });

      setSuccessMessage(result?.message || 'Expense recorded successfully');
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to record expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-0 shadow-2xl rounded-2xl overflow-hidden">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-slate-600 via-gray-700 to-slate-800 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Receipt className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Record Expense</h2>
            <p className="text-white/80 text-sm">Track operational costs</p>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Wallet Balances */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-700">Secondary Wallet</span>
            </div>
            <div className="text-2xl font-black text-purple-800">{formatCurrency(secondaryBalance)}</div>
            <p className="text-xs text-purple-600 mt-1">Deducted first</p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-gray-700">Primary Float</span>
            </div>
            <div className="text-2xl font-black text-gray-800">{formatCurrency(primaryBalance)}</div>
            <p className="text-xs text-gray-600 mt-1">Used if secondary insufficient</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Total Available for Expenses</span>
            </div>
            <span className="text-2xl font-black text-blue-800">{formatCurrency(totalAvailable)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-bold text-gray-700">Expense Amount (₹) *</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter expense amount"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            className="h-14 text-xl font-bold text-center border-2 border-gray-200 rounded-xl focus:border-gray-500 focus:ring-gray-500"
          />
        </div>

        {/* Expense Split Preview */}
        {parseFloat(formData.amount) > 0 && (
          <div className={`rounded-xl p-5 border-2 ${expenseSplit.isValid ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300'}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 ${expenseSplit.isValid ? 'bg-green-500' : 'bg-red-500'} rounded-lg flex items-center justify-center`}>
                <ArrowDown className="w-4 h-4 text-white" />
              </div>
              <span className={`text-sm font-bold ${expenseSplit.isValid ? 'text-green-700' : 'text-red-700'}`}>
                {expenseSplit.isValid ? 'Expense Split Preview' : 'Insufficient Funds'}
              </span>
            </div>
            
            {expenseSplit.isValid ? (
              <div className="space-y-3">
                {expenseSplit.fromSecondary > 0 && (
                  <div className="flex justify-between items-center bg-white/60 rounded-lg p-3">
                    <span className="text-sm text-purple-700 font-medium">From Secondary Wallet:</span>
                    <span className="font-bold text-purple-800">- {formatCurrency(expenseSplit.fromSecondary)}</span>
                  </div>
                )}
                {expenseSplit.fromPrimary > 0 && (
                  <div className="flex justify-between items-center bg-white/60 rounded-lg p-3">
                    <span className="text-sm text-gray-700 font-medium">From Primary Float:</span>
                    <span className="font-bold text-gray-800">- {formatCurrency(expenseSplit.fromPrimary)}</span>
                  </div>
                )}
                <div className="border-t-2 border-green-300 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-green-700">Total Expense:</span>
                    <span className="text-xl font-black text-green-800">{formatCurrency(parseFloat(formData.amount))}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-red-700 font-medium">
                Amount exceeds available balance by <span className="font-bold">{formatCurrency(parseFloat(formData.amount) - totalAvailable)}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-bold text-gray-700">Description *</Label>
          <Input
            id="description"
            placeholder="What is this expense for?"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="h-12 border-2 border-gray-200 rounded-xl focus:border-gray-500 focus:ring-gray-500"
          />
          <p className="text-xs text-gray-500">
            Examples: Food, Supplies, Maintenance, Staff Payment, etc.
          </p>
        </div>

        {error && (
          <Alert className="bg-red-50 border-2 border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <AlertDescription className="text-red-700 font-medium ml-2">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="bg-green-50 border-2 border-green-200 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <AlertDescription className="text-green-700 font-medium ml-2">{successMessage}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !expenseSplit.isValid}
            className="flex-1 h-14 rounded-xl bg-gradient-to-r from-slate-600 via-gray-700 to-slate-800 hover:from-slate-700 hover:via-gray-800 hover:to-slate-900 text-white font-bold text-base shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Record Expense
              </div>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="h-14 px-8 rounded-xl border-2 border-gray-200 hover:bg-gray-50 font-semibold"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseForm;