import { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle, Users } from 'lucide-react';
import playerService from '../../services/player.service';
import { useAuth } from '../../contexts/AuthContext';

export const PlayerSearch = ({ onSelectPlayer, showResults = true }) => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const results = await playerService.searchPlayers(token, searchQuery);
      setSearchResults(Array.isArray(results) ? results : []);
      setHasSearched(true);
    } catch (err) {
      setError(err.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlayer = (player) => {
    if (onSelectPlayer) {
      onSelectPlayer(player);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search player by name, ID, or phone..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {loading && (
            <Loader2 className="absolute right-3 w-5 h-5 text-blue-600 animate-spin" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {error && (
              <div className="p-3 border-b border-gray-200 flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {loading && (
              <div className="p-4 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <p className="text-sm text-gray-600">Searching...</p>
              </div>
            )}

            {!loading && searchResults.length === 0 && hasSearched && (
              <div className="p-4 text-center">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No players found</p>
              </div>
            )}

            {!loading && searchResults.map((player) => (
              <button
                key={player.player_id}
                onClick={() => handleSelectPlayer(player)}
                className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{player.player_name}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      ID: {player.player_id} • Phone: {player.phone_number || 'N/A'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    player.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {player.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerSearch;