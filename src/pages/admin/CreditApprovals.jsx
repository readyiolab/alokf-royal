// pages/admin/CreditApprovals.jsx
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { AlertCircle, CheckCircle, XCircle, Clock, Loader2, Eye, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import creditService from '@/services/credit.service';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export const AdminCreditApprovalsPage = () => {
  const { user, token } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('view'); // 'view', 'approve', 'reject'
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    // Admin can view approvals without session
    fetchAllRequests();
  }, []);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch ALL credit requests (pending, approved, rejected)
      const result = await creditService.getAllRequests();
      
      // Handle response structure from the new endpoint
      if (result?.data) {
        setPendingRequests(result.data.pending || []);
        setApprovedRequests(result.data.approved || []);
        setRejectedRequests(result.data.rejected || []);
      } else {
        // Fallback if structure is different
        const requests = Array.isArray(result) ? result : [];
        setPendingRequests(requests.filter(r => r.request_status === 'pending'));
        setApprovedRequests(requests.filter(r => r.request_status === 'approved'));
        setRejectedRequests(requests.filter(r => r.request_status === 'rejected'));
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError(err.message || 'Failed to load credit requests');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (request, mode = 'view') => {
    setSelectedRequest(request);
    setDialogMode(mode);
    setApprovalNotes('');
    setDialogOpen(true);
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;

    try {
      setApproving(true);
      await creditService.approveCreditRequest(selectedRequest.request_id, approvalNotes);
      setDialogOpen(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      await fetchAllRequests(); // Refresh list
    } catch (err) {
      console.error('Failed to approve request:', err);
      setError(err.message || 'Failed to approve request');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    try {
      setApproving(true);
      await creditService.rejectCreditRequest(selectedRequest.request_id, {
        rejection_notes: approvalNotes,
      });
      setDialogOpen(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      await fetchAllRequests(); // Refresh list
    } catch (err) {
      console.error('Failed to reject request:', err);
      setError(err.message || 'Failed to reject request');
    } finally {
      setApproving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Credit Request Approvals</h1>
          <p className="text-gray-600 mt-1">Manage and approve pending credit requests from cashiers</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pending Requests */}
          <div className="bg-white border border-gray-200 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Requests</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ₹{pendingRequests.reduce((sum, r) => sum + Number(r.requested_amount || 0), 0).toLocaleString('en-IN')}
                </p>
              </div>
              <Clock className="w-10 h-10 text-yellow-100" />
            </div>
          </div>

          {/* Approved Requests */}
          <div className="bg-white border border-gray-200 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedRequests.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ₹{approvedRequests.reduce((sum, r) => sum + Number(r.requested_amount || 0), 0).toLocaleString('en-IN')}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-100" />
            </div>
          </div>

          {/* Rejected Requests */}
          <div className="bg-white border border-gray-200 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{rejectedRequests.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ₹{rejectedRequests.reduce((sum, r) => sum + Number(r.requested_amount || 0), 0).toLocaleString('en-IN')}
                </p>
              </div>
              <XCircle className="w-10 h-10 text-red-100" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending ({pendingRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'approved'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Approved ({approvedRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rejected'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Rejected ({rejectedRequests.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-12">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <p className="text-gray-600">Loading credit requests...</p>
              </div>
            ) : activeTab === 'pending' && pendingRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Player</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Phone</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingRequests.map(request => (
                      <tr key={request.request_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {request.player_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {request.phone_number}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-right text-gray-900">
                          ₹{Number(request.requested_amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge className="bg-blue-100 text-blue-800">
                            {request.credit_type || 'Mixed Chips'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(request.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenDialog(request, 'view')}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-sm font-medium transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => handleOpenDialog(request, 'approve')}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded text-sm font-medium transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenDialog(request, 'reject')}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-medium transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : activeTab === 'approved' && approvedRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Player</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Phone</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Approved Date</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {approvedRequests.map(request => (
                      <tr key={request.request_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {request.player_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {request.phone_number}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-right text-gray-900">
                          ₹{Number(request.requested_amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge className="bg-blue-100 text-blue-800">
                            {request.credit_type || 'Mixed Chips'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {(request.processed_at || request.approved_at) 
                            ? new Date(request.processed_at || request.approved_at).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleOpenDialog(request, 'view')}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-sm font-medium transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : activeTab === 'rejected' && rejectedRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Player</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Phone</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rejected Date</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rejectedRequests.map(request => (
                      <tr key={request.request_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {request.player_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {request.phone_number}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-right text-gray-900">
                          ₹{Number(request.requested_amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge className="bg-blue-100 text-blue-800">
                            {request.credit_type || 'Mixed Chips'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {(request.processed_at || request.rejected_at)
                            ? new Date(request.processed_at || request.rejected_at).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleOpenDialog(request, 'view')}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-sm font-medium transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 font-medium">
                  {activeTab === 'pending' && 'No pending credit requests'}
                  {activeTab === 'approved' && 'No approved requests'}
                  {activeTab === 'rejected' && 'No rejected requests'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Approval Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'view' && 'View Request Details'}
                {dialogMode === 'approve' && 'Approve Credit Request'}
                {dialogMode === 'reject' && 'Reject Credit Request'}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === 'view' && 'Credit request details'}
                {dialogMode === 'approve' && 'Add notes (optional) before approving'}
                {dialogMode === 'reject' && 'Add rejection reason (optional)'}
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded p-4 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Player Name</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedRequest.player_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Phone Number</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedRequest.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Amount Requested</p>
                    <p className="text-lg font-bold text-blue-600">
                      ₹{Number(selectedRequest.requested_amount).toLocaleString('en-IN')}
                    </p>
                  </div>
                  
                  {/* Chip Breakdown Section */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Chips Given</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(selectedRequest.chips_100 > 0 || selectedRequest.chip_breakdown?.chips_100 > 0) && (
                        <div className="flex items-center justify-between bg-white border border-gray-200 rounded px-3 py-2">
                          <span className="text-xs text-gray-600">₹100 Chips</span>
                          <span className="text-sm font-bold text-green-600">
                            {selectedRequest.chips_100 || selectedRequest.chip_breakdown?.chips_100 || 0}
                          </span>
                        </div>
                      )}
                      {(selectedRequest.chips_500 > 0 || selectedRequest.chip_breakdown?.chips_500 > 0) && (
                        <div className="flex items-center justify-between bg-white border border-gray-200 rounded px-3 py-2">
                          <span className="text-xs text-gray-600">₹500 Chips</span>
                          <span className="text-sm font-bold text-blue-600">
                            {selectedRequest.chips_500 || selectedRequest.chip_breakdown?.chips_500 || 0}
                          </span>
                        </div>
                      )}
                      {(selectedRequest.chips_5000 > 0 || selectedRequest.chip_breakdown?.chips_5000 > 0) && (
                        <div className="flex items-center justify-between bg-white border border-gray-200 rounded px-3 py-2">
                          <span className="text-xs text-gray-600">₹5,000 Chips</span>
                          <span className="text-sm font-bold text-purple-600">
                            {selectedRequest.chips_5000 || selectedRequest.chip_breakdown?.chips_5000 || 0}
                          </span>
                        </div>
                      )}
                      {(selectedRequest.chips_10000 > 0 || selectedRequest.chip_breakdown?.chips_10000 > 0) && (
                        <div className="flex items-center justify-between bg-white border border-gray-200 rounded px-3 py-2">
                          <span className="text-xs text-gray-600">₹10,000 Chips</span>
                          <span className="text-sm font-bold text-orange-600">
                            {selectedRequest.chips_10000 || selectedRequest.chip_breakdown?.chips_10000 || 0}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Total Chips Value */}
                    <div className="mt-2 flex items-center justify-between bg-gray-100 rounded px-3 py-2">
                      <span className="text-xs font-medium text-gray-600">Total Chips Value</span>
                      <span className="text-sm font-bold text-gray-900">
                        ₹{(
                          ((selectedRequest.chips_100 || selectedRequest.chip_breakdown?.chips_100 || 0) * 100) +
                          ((selectedRequest.chips_500 || selectedRequest.chip_breakdown?.chips_500 || 0) * 500) +
                          ((selectedRequest.chips_5000 || selectedRequest.chip_breakdown?.chips_5000 || 0) * 5000) +
                          ((selectedRequest.chips_10000 || selectedRequest.chip_breakdown?.chips_10000 || 0) * 10000)
                        ).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                    <Badge className={`
                      ${selectedRequest.request_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${selectedRequest.request_status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                      ${selectedRequest.request_status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {selectedRequest.request_status?.charAt(0).toUpperCase() + selectedRequest.request_status?.slice(1)}
                    </Badge>
                  </div>

                  {selectedRequest.approval_type && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Approval Type</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedRequest.approval_type === 'auto' ? 'Auto-Approved' : 'Admin Approved'}
                      </p>
                    </div>
                  )}

                  {selectedRequest.notes && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Cashier Notes</p>
                      <p className="text-sm text-gray-900">{selectedRequest.notes}</p>
                    </div>
                  )}

                  {selectedRequest.approval_notes && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Approval Notes</p>
                      <p className="text-sm text-gray-900">{selectedRequest.approval_notes}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Requested On</p>
                    <p className="text-sm text-gray-900">
                      {selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString() : '-'}
                    </p>
                  </div>

                  {selectedRequest.processed_at && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Processed On</p>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedRequest.processed_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {(dialogMode === 'approve' || dialogMode === 'reject') && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {dialogMode === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Optional)'}
                    </label>
                    <Textarea
                      value={approvalNotes}
                      onChange={e => setApprovalNotes(e.target.value)}
                      placeholder="Add any notes..."
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={approving}
              >
                Cancel
              </Button>
              {dialogMode === 'approve' && (
                <Button
                  onClick={handleApproveRequest}
                  disabled={approving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {approving ? 'Approving...' : 'Approve Request'}
                </Button>
              )}
              {dialogMode === 'reject' && (
                <Button
                  onClick={handleRejectRequest}
                  disabled={approving}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {approving ? 'Rejecting...' : 'Reject Request'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCreditApprovalsPage;