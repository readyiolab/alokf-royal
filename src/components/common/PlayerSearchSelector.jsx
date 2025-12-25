import { useState, useEffect } from 'react';
import { Search, User, Phone, X, Loader2, Users, CheckCircle } from 'lucide-react';
import usePlayerSearch from '../../hooks/usePlayerSearch';
import { useAuth } from '../../hooks/useAuth';

export const PlayerSearchSelector = ({ onSelectPlayer, selectedPlayer: externalPlayer }) => {
  const { token } = useAuth();
  const {
    filteredPlayers,
    searchQuery,
    setSearchQuery,
    selectedPlayer,
    selectPlayer,
    loading,
    error,
    loadAllPlayers,
    clearSearch
  } = usePlayerSearch();

  const [showDropdown, setShowDropdown] = useState(false);

  // Load all players on mount
  useEffect(() => {
    loadAllPlayers(token);
  }, [token]);

  // Sync with external selected player if provided
  useEffect(() => {
    if (externalPlayer && externalPlayer !== selectedPlayer) {
      selectPlayer(externalPlayer);
    }
  }, [externalPlayer]);

  const handleSelectPlayer = (player) => {
    selectPlayer(player);
    setShowDropdown(false);
    if (onSelectPlayer) {
      onSelectPlayer(player);
    }
  };

  const handleClearSelection = () => {
    clearSearch();
    setShowDropdown(false);
    if (onSelectPlayer) {
      onSelectPlayer(null);
    }
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  return (
    <div className="w-full space-y-3">
      {/* Selected Player Display */}
      {selectedPlayer && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{selectedPlayer.player_name}</p>
                <p className="text-sm text-blue-700 font-semibold">{selectedPlayer.player_code}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" />
                  {selectedPlayer.phone_number}
                </p>
                {selectedPlayer.credit_outstanding > 0 && (
                  <p className="text-xs text-orange-700 font-semibold mt-1">
                    Outstanding: ₹{parseFloat(selectedPlayer.credit_outstanding).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleClearSelection}
              className="p-2 hover:bg-red-100 rounded-full transition"
              title="Clear selection"
            >
              <X className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      {!selectedPlayer && (
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Search Player <span className="text-red-500">*</span>
          </label>
          
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {loading ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-gray-400" />
              )}
            </div>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="Search by code (PC00001), name, or phone number..."
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}

          {/* Dropdown Results */}
          {showDropdown && (
            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading players...</p>
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-700">No players found</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {searchQuery ? `No matches for "${searchQuery}"` : 'No players available'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Results Header */}
                  <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-4 py-2">
                    <p className="text-xs font-semibold text-blue-900">
                      {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''} found
                    </p>
                  </div>

                  {/* Player List */}
                  <div className="divide-y divide-gray-100">
                    {filteredPlayers.map((player) => (
                      <button
                        key={player.player_id || player.player_code}
                        onClick={() => handleSelectPlayer(player)}
                        className="w-full px-4 py-3 hover:bg-blue-50 transition text-left flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition truncate">
                            {player.player_name}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                              {player.player_code}
                            </span>
                            <span className="text-xs text-gray-600 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {player.phone_number}
                            </span>
                          </div>
                          {player.credit_outstanding > 0 && (
                            <p className="text-xs text-orange-600 font-semibold mt-1">
                              Outstanding: ₹{parseFloat(player.credit_outstanding).toFixed(2)}
                            </p>
                          )}
                        </div>

                        <CheckCircle className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Click outside handler */}
          {showDropdown && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerSearchSelector;