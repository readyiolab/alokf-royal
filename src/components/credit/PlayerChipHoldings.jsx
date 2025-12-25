import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, RotateCcw, Coins } from 'lucide-react';
import creditService from '../../services/credit.service';
import { useSession } from '../../hooks/useSession';

export const PlayerChipHoldings = () => {
  const { session } = useSession();
  const [chipHoldings, setChipHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, empty

  useEffect(() => {
    if (session?.session_id) {
      fetchChipHoldings();
    }
  }, [session?.session_id]);

  const fetchChipHoldings = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch players who have chip allocations
      const data = await creditService.getPlayerChipHoldings(session.session_id);
      setChipHoldings(data || []);
    } catch (err) {
      console.error('Error fetching chip holdings:', err);
      setError(err.message || 'Failed to load player chip holdings');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredHoldings = () => {
    return chipHoldings.filter(holding => {
      if (filter === 'active') {
        return holding.current_chip_balance > 0;
      } else if (filter === 'empty') {
        return holding.current_chip_balance <= 0;
      }
      return true;
    });
  };

  const getTotalChipsIssued = () => {
    return chipHoldings.reduce((sum, h) => sum + h.issued_amount, 0);
  };

  const getTotalChipsInHand = () => {
    return chipHoldings.reduce((sum, h) => sum + h.current_chip_balance, 0);
  };

  const filtered = getFilteredHoldings();

  if (!session?.session_id) {
    return (
      <div className="w-full border border-gray-200 rounded-lg shadow p-6 text-center text-gray-600">
        No active session. Please start a session first.
      </div>
    );
  }

  return (
    <div className="w-full border border-gray-200 rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 md:p-6 bg-gradient-to-r from-purple-50 to-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Player Chip Holdings</h2>
          </div>
          <button
            onClick={fetchChipHoldings}
            disabled={loading}
            className="p-2 hover:bg-purple-200 rounded-lg transition disabled:opacity-50"
            title="Refresh"
          >
            <RotateCcw className={`w-5 h-5 text-purple-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">Track which chips each player is holding</p>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="bg-blue-50 rounded-lg p-3 md:p-4 border border-blue-200">
            <p className="text-xs text-gray-600 font-medium">Total Issued</p>
            <p className="text-lg md:text-2xl font-bold text-blue-600">
              ₹{getTotalChipsIssued().toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 md:p-4 border border-purple-200">
            <p className="text-xs text-gray-600 font-medium">In Player Hands</p>
            <p className="text-lg md:text-2xl font-bold text-purple-600">
              ₹{getTotalChipsInHand().toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 md:p-4 border border-amber-200">
            <p className="text-xs text-gray-600 font-medium">Players Active</p>
            <p className="text-lg md:text-2xl font-bold text-amber-600">
              {chipHoldings.filter(h => h.current_chip_balance > 0).length}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {['all', 'active', 'empty'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-sm font-medium transition ${
                filter === f
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f === 'all' ? ' All' : f === 'active' ? ' With Chips' : ' Settled'}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600 mr-2" />
            <span className="text-gray-600">Loading player chip holdings...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="border border-red-300 bg-red-50 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Coins className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>
              {filter === 'all'
                ? 'No players with chip holdings yet'
                : filter === 'active'
                ? 'No active players with chips'
                : 'No settled players yet'}
            </p>
          </div>
        )}

        {/* Chip Holdings List */}
        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(holding => (
              <div key={holding.player_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                {/* Player Name & Status */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{holding.player_name}</h3>
                    <p className="text-xs text-gray-500">ID: {holding.player_id}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    holding.current_chip_balance > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {holding.current_chip_balance > 0 ? ' Active' : ' Settled'}
                  </div>
                </div>

                {/* Chip Balance Summary */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Chips Issued:</span>
                    <span className="font-bold text-lg text-blue-600">
                      ₹{holding.issued_amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Balance:</span>
                    <span className={`font-bold text-lg ${
                      holding.current_chip_balance > 0 ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      ₹{holding.current_chip_balance.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {holding.issued_amount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Played/Lost:</span>
                      <span className={`font-bold text-lg ${
                        holding.issued_amount - holding.current_chip_balance > 0
                          ? 'text-orange-600'
                          : 'text-purple-600'
                      }`}>
                        ₹{(holding.issued_amount - holding.current_chip_balance).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Chip Breakdown if Available */}
                {holding.chip_breakdown && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {holding.chip_breakdown.chips_10000 > 0 && (
                      <div className="bg-purple-50 px-2 py-1 rounded text-xs text-center border border-purple-200">
                        <div className="font-bold text-purple-700">{holding.chip_breakdown.chips_10000}</div>
                        <div className="text-gray-600 text-xs">₹10K</div>
                      </div>
                    )}
                    {holding.chip_breakdown.chips_5000 > 0 && (
                      <div className="bg-blue-50 px-2 py-1 rounded text-xs text-center border border-blue-200">
                        <div className="font-bold text-blue-700">{holding.chip_breakdown.chips_5000}</div>
                        <div className="text-gray-600 text-xs">₹5K</div>
                      </div>
                    )}
                    {holding.chip_breakdown.chips_500 > 0 && (
                      <div className="bg-green-50 px-2 py-1 rounded text-xs text-center border border-green-200">
                        <div className="font-bold text-green-700">{holding.chip_breakdown.chips_500}</div>
                        <div className="text-gray-600 text-xs">₹500</div>
                      </div>
                    )}
                    {holding.chip_breakdown.chips_100 > 0 && (
                      <div className="bg-amber-50 px-2 py-1 rounded text-xs text-center border border-amber-200">
                        <div className="font-bold text-amber-700">{holding.chip_breakdown.chips_100}</div>
                        <div className="text-gray-600 text-xs">₹100</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Last Updated */}
                <div className="text-xs text-gray-500 mt-3 border-t pt-2">
                  Last updated: {new Date(holding.last_updated).toLocaleTimeString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerChipHoldings;
