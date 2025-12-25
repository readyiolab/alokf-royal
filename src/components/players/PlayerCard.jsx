import { User, Phone, Mail, MapPin, Calendar, Loader2, AlertCircle, CreditCard } from 'lucide-react';
import { useState } from 'react';

export const PlayerCard = ({ player, onEdit, onViewDetails, onIssueCredit, compact = false }) => {
  const [loading, setLoading] = useState(false);

  const formatCurrency = (value) => {
    return `₹${parseFloat(value || 0).toLocaleString('en-IN')}`;
  };

  const getStatusColor = (isActive, isBlacklisted) => {
    if (isBlacklisted) return 'bg-red-100 text-red-700 border-red-300';
    if (!isActive) return 'bg-gray-100 text-gray-700 border-gray-300';
    return 'bg-green-100 text-green-700 border-green-300';
  };

  const getStatusLabel = (isActive, isBlacklisted) => {
    if (isBlacklisted) return '🚫 Blacklisted';
    if (!isActive) return '⭕ Inactive';
    return '✅ Active';
  };

  if (compact) {
    return (
      <div className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{player.player_name}</p>
              <p className="text-xs text-gray-600">ID: {player.player_id}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(player.is_active, player.is_blacklisted)}`}>
            {getStatusLabel(player.is_active, player.is_blacklisted)}
          </span>
        </div>

        <div className="space-y-1 mb-3 text-xs text-gray-600">
          {player.phone_number && (
            <p className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> {player.phone_number}
            </p>
          )}
          {player.email && (
            <p className="flex items-center gap-1">
              <Mail className="w-3 h-3" /> {player.email}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(player)}
              className="flex-1 px-2 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition"
            >
              Edit
            </button>
          )}
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(player)}
              className="flex-1 px-2 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition"
            >
              View
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full Card View
  return (
    <div className="border border-gray-200 rounded-lg shadow overflow-hidden bg-white hover:shadow-lg transition">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{player.player_name}</h3>
              <p className="text-sm text-gray-600">Player ID: {player.player_id}</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(player.is_active, player.is_blacklisted)}`}>
            {getStatusLabel(player.is_active, player.is_blacklisted)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Contact Information */}
        <div>
          <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Contact Info</p>
          <div className="space-y-2 text-sm">
            {player.phone_number && (
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{player.phone_number}</span>
              </div>
            )}
            {player.email && (
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{player.email}</span>
              </div>
            )}
            {player.address && (
              <div className="flex items-start gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                <span>{player.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {player.created_at && (
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-600 mb-1">Joined</p>
              <p className="font-semibold text-gray-900">
                {new Date(player.created_at).toLocaleDateString('en-IN')}
              </p>
            </div>
          )}
          {player.last_activity && (
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-600 mb-1">Last Active</p>
              <p className="font-semibold text-gray-900">
                {new Date(player.last_activity).toLocaleDateString('en-IN')}
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        {player.total_visits !== undefined && (
          <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded">
            <div>
              <p className="text-xs text-gray-600">Total Visits</p>
              <p className="text-xl font-bold text-gray-900">{player.total_visits || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Player Type</p>
              <p className="text-lg font-bold text-blue-600">
                {player.player_type?.charAt(0).toUpperCase() + player.player_type?.slice(1) || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> Credit Limit
              </p>
              <p className="text-lg font-bold text-purple-600">
                {formatCurrency(player.credit_limit_personal || player.credit_limit || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Warnings */}
        {player.is_blacklisted && (
          <div className="border border-red-200 bg-red-50 rounded p-3 flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Blacklisted Player</p>
              {player.blacklist_reason && (
                <p className="text-xs text-red-700 mt-1">{player.blacklist_reason}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Actions */}
      <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-2">
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(player)}
            className="flex-1 px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
          >
            View Details
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(player)}
            className="flex-1 px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition"
          >
            Edit Info
          </button>
        )}
        {onIssueCredit && (
          <button
            onClick={() => onIssueCredit(player)}
            className="flex-1 px-3 py-2 text-sm font-semibold text-green-700 bg-green-100 rounded hover:bg-green-200 transition"
          >
            Issue Credit
          </button>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;