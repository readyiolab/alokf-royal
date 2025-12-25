// pages/admin/DealerManagement.jsx
// Dealer Management - CRUD and Tip History

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Edit, Trash2, HandCoins, RefreshCw,
  UserPlus, TrendingUp, Coins
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import dealerService from '../../services/dealer.service';
import AdminLayout from '../../components/layouts/AdminLayout';

const DealerManagement = () => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Add/Edit Dealer Modal
  const [showDealerModal, setShowDealerModal] = useState(false);
  const [editingDealer, setEditingDealer] = useState(null);
  const [dealerForm, setDealerForm] = useState({
    dealer_name: '',
    phone_number: '',
    status: 'active'
  });

  // Tip History Modal
  const [showTipHistory, setShowTipHistory] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [tipHistory, setTipHistory] = useState([]);
  const [tipSummary, setTipSummary] = useState({});
  const [loadingTips, setLoadingTips] = useState(false);

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    setLoading(true);
    try {
      const response = await dealerService.getAllDealers();
      setDealers(response.data || []);
    } catch (err) {
      setError('Failed to fetch dealers');
    } finally {
      setLoading(false);
    }
  };

  const fetchTipHistory = async (dealerId) => {
    setLoadingTips(true);
    try {
      const response = await dealerService.getDealerTipsSummary(dealerId);
      setTipHistory(response.data?.tips || []);
      setTipSummary(response.data || {}); // Store full summary data
    } catch (err) {
      console.error('Failed to fetch tip history:', err);
      setTipHistory([]);
      setTipSummary({});
    } finally {
      setLoadingTips(false);
    }
  };

  const handleAddDealer = async () => {
    try {
      if (editingDealer) {
        await dealerService.updateDealer(editingDealer.dealer_id, dealerForm);
        setSuccess('Dealer updated successfully');
      } else {
        await dealerService.createDealer(dealerForm);
        setSuccess('Dealer added successfully');
      }
      setShowDealerModal(false);
      resetDealerForm();
      fetchDealers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save dealer');
    }
  };

  const handleDeleteDealer = async (dealerId) => {
    if (!confirm('Are you sure you want to delete this dealer?')) return;
    
    try {
      await dealerService.deleteDealer(dealerId);
      setSuccess('Dealer deleted successfully');
      fetchDealers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete dealer');
    }
  };

  const resetDealerForm = () => {
    setDealerForm({
      dealer_name: '',
      phone_number: '',
      status: 'active'
    });
    setEditingDealer(null);
  };

  const openEditModal = (dealer) => {
    setEditingDealer(dealer);
    setDealerForm({
      dealer_name: dealer.dealer_name,
      phone_number: dealer.phone_number || '',
      status: dealer.is_active ? 'active' : 'inactive'
    });
    setShowDealerModal(true);
  };

  const openTipHistory = (dealer) => {
    setSelectedDealer(dealer);
    fetchTipHistory(dealer.dealer_id);
    setShowTipHistory(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredDealers = dealers.filter(dealer =>
    dealer.dealer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealer.dealer_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTipsEarned = dealers.reduce((sum, d) => sum + (d.total_tips_earned || 0), 0);
  const totalCashPaid = dealers.reduce((sum, d) => sum + (d.total_cash_paid || 0), 0);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <HandCoins className="w-8 h-8 text-amber-600" />
            Dealer Management
          </h1>
          <p className="text-gray-600 mt-1">Manage dealers and track tips</p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white text-black">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Dealers</p>
                  <p className="text-2xl font-bold text-gray-900">{dealers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white text-black">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Coins className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Tips (Chip Value)</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalTipsEarned)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white text-black"                         >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Cash Paid (50%)</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCashPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dealer List */}
        <Card className="bg-white text-black">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Dealers</CardTitle>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Search dealers..."
                />
              </div>
              <button
                onClick={() => {
                  resetDealerForm();
                  setShowDealerModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                <Plus className="w-4 h-4" />
                Add Dealer
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-600 mx-auto" />
                <p className="text-gray-500 mt-2">Loading dealers...</p>
              </div>
            ) : filteredDealers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto" />
                <p className="text-gray-500 mt-2">No dealers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold ">Dealer</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold ">Dealer Code</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold ">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold ">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold ">Total Tips</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold ">Cash Paid</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold ">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredDealers.map((dealer) => (
                      <tr key={dealer.dealer_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            
                            <p className="font-medium text-gray-900">{dealer.dealer_name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{dealer.dealer_code || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{dealer.phone_number || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            dealer.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {dealer.status || 'active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {formatCurrency(dealer.total_tips_received)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-green-600">
                          {formatCurrency(dealer.total_cash_paid)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openTipHistory(dealer)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                              title="View Tips"
                            >
                              <HandCoins className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(dealer)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDealer(dealer.dealer_id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dealer Modal */}
        {showDealerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white">
              <CardHeader className="bg-amber-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  {editingDealer ? 'Edit Dealer' : 'Add New Dealer'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dealer Name</label>
                  <input
                    type="text"
                    value={dealerForm.dealer_name}
                    onChange={(e) => setDealerForm(prev => ({ ...prev, dealer_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Enter dealer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={dealerForm.phone_number}
                    onChange={(e) => setDealerForm(prev => ({ ...prev, phone_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={dealerForm.status}
                    onChange={(e) => setDealerForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowDealerModal(false);
                      resetDealerForm();
                    }}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddDealer}
                    className="flex-1 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    {editingDealer ? 'Update' : 'Add Dealer'}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tip History Modal */}
        {showTipHistory && selectedDealer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden bg-white">
              <CardHeader className="bg-amber-600 text-white rounded-t-lg flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <HandCoins className="w-5 h-5" />
                  Tip History - {selectedDealer.dealer_name}
                </CardTitle>
                <button 
                  onClick={() => setShowTipHistory(false)}
                  className="text-white hover:text-amber-200"
                >
                  ✕
                </button>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingTips ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin text-amber-600 mx-auto" />
                  </div>
                ) : tipHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <HandCoins className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="text-gray-500 mt-2">No tips recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Total Chip Value</p>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(tipSummary.total_chip_tips || 0)}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Total Cash Paid (50%)</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(tipSummary.total_cash_paid || 0)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Date</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Chips</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Value</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Cash Paid</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {tipHistory.map((tip, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {formatDate(tip.created_at)}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-500">
                                {tip.chips_100 > 0 && `${tip.chips_100}×₹100 `}
                                {tip.chips_500 > 0 && `${tip.chips_500}×₹500 `}
                                {tip.chips_5000 > 0 && `${tip.chips_5000}×₹5K `}
                                {tip.chips_10000 > 0 && `${tip.chips_10000}×₹10K`}
                              </td>
                              <td className="px-4 py-2 font-semibold text-gray-900">
                                {formatCurrency(tip.chip_amount)}
                              </td>
                              <td className="px-4 py-2 font-semibold text-green-600">
                                {formatCurrency(tip.cash_paid_to_dealer)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default DealerManagement;
