import { useState } from 'react';
import { Loader2, X, CheckCircle, AlertTriangle } from 'lucide-react';
import creditService from '../../services/credit.service';
import { useAuth } from '../../contexts/AuthContext';

export const CreditApprovalDialog = ({ request, isOpen, onClose, onApproved }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'

  if (!isOpen || !request) return null;

  const handleApprove = async () => {
    if (!approvalNotes.trim()) {
      setError('Please enter approval notes');
      return;
    }

    try {
      setLoading(true);
      setError(null);
    await creditService.approveCreditRequest(request.request_id, approvalNotes);
      
      if (onApproved) {
        onApproved({
          action: 'approved',
          requestId: request.request_id,
          message: `✅ Credit request #${request.request_id} approved for ${request.player_name}`
        });
      }
      
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!approvalNotes.trim()) {
      setError('Please enter rejection reason');
      return;
    }

    try {
      setLoading(true);
      setError(null);
     await creditService.rejectCreditRequest(request.request_id, approvalNotes);
      if (onApproved) {
        onApproved({
          action: 'rejected',
          requestId: request.request_id,
          message: `❌ Credit request #${request.request_id} rejected for ${request.player_name}`
        });
      }
      
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setApprovalNotes('');
    setActionType(null);
    setError(null);
    onClose();
  };

  const isPending = request.request_status === 'pending';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 md:p-6 flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Credit Request Details</h2>
            <p className="text-sm text-gray-600 mt-1">Request #{request.request_id}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-4">
          {/* Player Info */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
              Player Name
            </label>
            <p className="text-lg font-semibold text-gray-900">{request.player_name}</p>
          </div>

          {/* Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                Requested Amount
              </label>
              <p className="text-xl font-bold text-gray-900">
                ₹{parseFloat(request.requested_amount || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                Chips Amount
              </label>
              <p className="text-xl font-bold text-gray-900">
                ₹{parseFloat(request.chips_amount || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Request Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Status:</span>
              <span className={`font-semibold ${
                request.request_status === 'pending' ? 'text-yellow-700' :
                request.request_status === 'approved' ? 'text-green-700' : 'text-red-700'
              }`}>
                {request.request_status.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Requested By:</span>
              <span className="font-medium text-gray-900">{request.requested_by}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Date:</span>
              <span className="font-medium text-gray-900">
                {new Date(request.created_at).toLocaleDateString('en-IN')}
              </span>
            </div>
          </div>

          {/* Action Selection */}
          {isPending && !actionType && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-900 mb-3">Choose Action</p>
              <button
                onClick={() => setActionType('approve')}
                className="w-full px-4 py-2 bg-green-100 border-2 border-green-300 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve Credit
              </button>
              <button
                onClick={() => setActionType('reject')}
                className="w-full px-4 py-2 bg-red-100 border-2 border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Reject Request
              </button>
            </div>
          )}

          {/* Approval Form */}
          {actionType && (
            <div className="space-y-3 border-t border-gray-200 pt-4">
              <p className="text-sm font-semibold text-gray-900">
                {actionType === 'approve' ? 'Approval Notes' : 'Rejection Reason'}
              </p>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder={actionType === 'approve' ? 
                  'Enter approval notes (e.g., Player has good payment history)...' :
                  'Enter rejection reason (e.g., Insufficient float)...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows="4"
              />

              {/* Error Message */}
              {error && (
                <div className="border border-red-300 bg-red-50 rounded-lg p-3 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setActionType(null)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={actionType === 'approve' ? handleApprove : handleReject}
                  disabled={loading}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    actionType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400'
                      : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditApprovalDialog;