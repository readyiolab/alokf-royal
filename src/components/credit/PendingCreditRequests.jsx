import { useState, useEffect } from 'react';
import { AlertCircle, Clock, Loader2, CheckCircle, XCircle } from 'lucide-react';
import creditService from '../../services/credit.service';
import { useAuth } from '../../contexts/AuthContext';

export const PendingCreditRequests = ({ sessionId = null, onRefresh }) => {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState({});
  const [rejecting, setRejecting] = useState({});

  useEffect(() => {
    fetchPendingRequests();
  }, [sessionId]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
     const data = await creditService.getPendingRequests(sessionId);
      setRequests(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load pending requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, playerName) => {
    if (!window.confirm(`Approve credit request for ${playerName}?`)) return;

    try {
      setApproving(prev => ({ ...prev, [requestId]: true }));
     await creditService.approveCreditRequest(requestId, 'Approved by admin');
      setRequests(requests.filter(r => r.request_id !== requestId));
      if (onRefresh) onRefresh();
      alert('✅ Credit request approved successfully');
    } catch (err) {
      alert('❌ Error approving request: ' + err.message);
    } finally {
      setApproving(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleReject = async (requestId, playerName) => {
    const reason = prompt(`Enter rejection reason for ${playerName}:`);
    if (!reason) return;

    try {
      setRejecting(prev => ({ ...prev, [requestId]: true }));
    await creditService.rejectCreditRequest(requestId, reason);
      setRequests(requests.filter(r => r.request_id !== requestId));
      if (onRefresh) onRefresh();
      alert('✅ Credit request rejected');
    } catch (err) {
      alert('❌ Error rejecting request: ' + err.message);
    } finally {
      setRejecting(prev => ({ ...prev, [requestId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg shadow p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading pending requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-800">Error Loading Requests</p>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg bg-gray-50 p-12 text-center">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No pending credit requests</p>
        <p className="text-sm text-gray-500 mt-1">All requests have been processed</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg shadow overflow-hidden">
      <div className="border-b border-gray-200 p-4 md:p-6 bg-gradient-to-r from-yellow-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Pending Credit Requests</h2>
            <p className="text-sm text-gray-600 mt-1">⏳ {requests.length} awaiting admin approval</p>
          </div>
          <button
            onClick={fetchPendingRequests}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Req ID</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Player Name</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Requested By</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.request_id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-semibold text-blue-600">#{req.request_id}</td>
                <td className="px-4 py-3 text-gray-900 font-medium">{req.player_name}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">
                  ₹{parseFloat(req.requested_amount || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{req.requested_by}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {new Date(req.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleApprove(req.request_id, req.player_name)}
                      disabled={approving[req.request_id]}
                      className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 disabled:bg-gray-200 disabled:text-gray-500 rounded-md text-xs font-semibold transition flex items-center gap-1"
                    >
                      {approving[req.request_id] ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(req.request_id, req.player_name)}
                      disabled={rejecting[req.request_id]}
                      className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 disabled:bg-gray-200 disabled:text-gray-500 rounded-md text-xs font-semibold transition flex items-center gap-1"
                    >
                      {rejecting[req.request_id] ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingCreditRequests;