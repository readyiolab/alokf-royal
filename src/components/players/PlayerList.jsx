import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Users } from 'lucide-react';
import playerService from '../../services/player.service';
import { useAuth } from '../../contexts/AuthContext';
import PlayerCard from './PlayerCard';

export const PlayerList = ({ onSelectPlayer, onEdit, onViewDetails, onIssueCredit, compact = false }) => {
  const { token } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive, blacklisted

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await playerService.getAllPlayers(token);
      setPlayers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPlayers = () => {
    return players.filter(player => {
      if (filterStatus === 'active') return player.is_active && !player.is_blacklisted;
      if (filterStatus === 'inactive') return !player.is_active;
      if (filterStatus === 'blacklisted') return player.is_blacklisted;
      return true;
    });
  };

  const filteredPlayers = getFilteredPlayers();

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg shadow p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading players...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-800">Error Loading Players</p>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg bg-gray-50 p-12 text-center">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No players found</p>
        <p className="text-sm text-gray-500 mt-1">Start by creating a new player</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white rounded-lg shadow p-4 overflow-x-auto">
        {['all', 'active', 'inactive', 'blacklisted'].map(status => {
          const count = status === 'all'
            ? players.length
            : status === 'active'
            ? players.filter(p => p.is_active && !p.is_blacklisted).length
            : status === 'inactive'
            ? players.filter(p => !p.is_active).length
            : players.filter(p => p.is_blacklisted).length;

          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {/* Players Grid or List */}
      {filteredPlayers.length === 0 ? (
        <div className="border border-gray-200 rounded-lg bg-gray-50 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No {filterStatus} players</p>
        </div>
      ) : compact ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map(player => (
            <PlayerCard
              key={player.player_id}
              player={player}
              compact={true}
              onViewDetails={onViewDetails}
              onEdit={onEdit}
              onIssueCredit={onIssueCredit}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPlayers.map(player => (
            <div
              key={player.player_id}
              onClick={() => onSelectPlayer?.(player)}
              className="cursor-pointer hover:shadow-md transition"
            >
              <PlayerCard
                player={player}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                onIssueCredit={onIssueCredit}
              />
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredPlayers.length}</span> of <span className="font-semibold">{players.length}</span> players
        </p>
      </div>
    </div>
  );
};

export default PlayerList;