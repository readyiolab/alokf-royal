import { Clock, CheckCircle, XCircle, Zap } from 'lucide-react';

export const CreditRequestCard = ({ request, onApprove, onReject, onViewDetails }) => {
  const isAutoApproved = request.approval_notes?.includes('Auto-approved');
  const isPending = request.request_status === 'pending';

  const statusConfig = {
    pending: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: Clock,
      iconColor: 'text-yellow-600',
      badgeBg: 'bg-yellow-100',
      badgeText: 'text-yellow-800'
    },
    approved: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      badgeBg: 'bg-green-100',
      badgeText: 'text-green-800'
    },
    rejected: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: XCircle,
      iconColor: 'text-red-600',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-800'
    }
  };

  const config = statusConfig[request.request_status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className={`border-2 rounded-lg p-4 ${config.bg} ${config.border}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-3">
          <StatusIcon className={`w-5 h-5 ${config.iconColor} mt-1`} />
          <div>
            <h3 className="font-semibold text-gray-900">{request.player_name}</h3>
            <p className="text-xs text-gray-600 mt-0.5">Request #{request.request_id}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {isAutoApproved && (
            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Auto-Approved
            </span>
          )}
          <span className={`px-2.5 py-1 rounded text-xs font-semibold ${config.badgeBg} ${config.badgeText}`}>
            {request.request_status.charAt(0).toUpperCase() + request.request_status.slice(1)}
          </span>
        </div>
      </div>

      {/* Amount and Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-300 border-opacity-50">
        <div>
          <p className="text-xs font-medium text-gray-700 mb-1">Credit Amount</p>
          <p className="text-xl font-bold text-gray-900">₹{parseFloat(request.requested_amount || 0).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-700 mb-1">Chips Amount</p>
          <p className="text-xl font-bold text-gray-900">₹{parseFloat(request.chips_amount || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Request Details */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-700">Requested By:</span>
          <span className="font-medium text-gray-900">{request.requested_by}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700">Date:</span>
          <span className="font-medium text-gray-900">
            {new Date(request.created_at).toLocaleDateString('en-IN')}
          </span>
        </div>
        {request.approved_by && (
          <div className="flex justify-between">
            <span className="text-gray-700">Approved By:</span>
            <span className="font-medium text-gray-900">{request.approved_by}</span>
          </div>
        )}
      </div>

      {/* Approval Notes */}
      {request.approval_notes && (
        <div className="mb-4 p-3 bg-white bg-opacity-50 rounded border border-gray-300 border-opacity-30">
          <p className="text-xs font-medium text-gray-700 mb-1">Notes</p>
          <p className="text-sm text-gray-700">{request.approval_notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      {isPending && (
        <div className="flex gap-2">
          {onApprove && (
            <button
              onClick={() => onApprove(request.request_id)}
              className="flex-1 px-3 py-2 bg-green-500 text-white rounded-md font-semibold hover:bg-green-600 transition text-sm"
            >
              ✓ Approve
            </button>
          )}
          {onReject && (
            <button
              onClick={() => onReject(request.request_id)}
              className="flex-1 px-3 py-2 bg-red-500 text-white rounded-md font-semibold hover:bg-red-600 transition text-sm"
            >
              ✕ Reject
            </button>
          )}
        </div>
      )}

      {/* View Details Link */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(request.request_id)}
          className="w-full mt-2 px-3 py-2 border border-gray-400 text-gray-700 rounded-md font-semibold hover:bg-gray-100 transition text-sm"
        >
          View Details
        </button>
      )}
    </div>
  );
};

export default CreditRequestCard;