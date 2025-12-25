import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, TrendingUp, DollarSign, Zap, Users } from 'lucide-react';
import playerService from '../../services/player.service';
import { useAuth } from '../../contexts/AuthContext';

export const PlayerStats = ({ playerId = null, showHeader = true }) => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (playerId) {
      fetchPlayerStats();
    }
  }, [playerId]);

  const fetchPlayerStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await playerService.getPlayerStats(token, playerId);
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg shadow p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Player Statistics</h2>
          <p className="text-sm text-gray-600 mt-1">Performance and activity metrics</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visits */}
        <div className="bg-white border border-gray-200 rounded-lg shadow p-4 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Visits</p>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total_visits || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Sessions attended</p>
        </div>

        {/* Total Deposited */}
        <div className="bg-white border border-gray-200 rounded-lg shadow p-4 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Deposited</p>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{(stats.total_deposited || 0).toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">All time deposits</p>
        </div>

        {/* Total Withdrawn */}
        <div className="bg-white border border-gray-200 rounded-lg shadow p-4 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Withdrawn</p>
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{(stats.total_withdrawn || 0).toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">All time withdrawals</p>
        </div>

        {/* Net Position */}
        <div className={`rounded-lg shadow p-4 hover:shadow-md transition border ${
          (stats.total_withdrawn || 0) > (stats.total_deposited || 0)
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Net Position</p>
            <Zap className="w-5 h-5 text-purple-500" />
          </div>
          <p className={`text-2xl font-bold ${
            (stats.total_withdrawn || 0) > (stats.total_deposited || 0)
              ? 'text-green-900'
              : 'text-red-900'
          }`}>
            ₹{Math.abs((stats.total_withdrawn || 0) - (stats.total_deposited || 0)).toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {(stats.total_withdrawn || 0) > (stats.total_deposited || 0) ? 'Player Winning' : 'Player Owing'}
          </p>
        </div>
      </div>

      {/* Detailed Stats */}
      {stats && Object.keys(stats).length > 4 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200 p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Detailed Breakdown</h3>
          </div>
          <div className="p-4 space-y-3">
            {stats.total_games && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Total Games Played</span>
                <span className="font-semibold text-gray-900">{stats.total_games}</span>
              </div>
            )}
            {stats.average_deposit && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Average Deposit</span>
                <span className="font-semibold text-gray-900">₹{stats.average_deposit.toFixed(2)}</span>
              </div>
            )}
            {stats.average_withdrawal && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Average Withdrawal</span>
                <span className="font-semibold text-gray-900">₹{stats.average_withdrawal.toFixed(2)}</span>
              </div>
            )}
            {stats.win_loss_ratio && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-700">Win/Loss Ratio</span>
                <span className="font-semibold text-gray-900">{stats.win_loss_ratio.toFixed(2)}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerStats;