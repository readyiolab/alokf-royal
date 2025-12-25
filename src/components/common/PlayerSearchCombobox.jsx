import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerSearch } from '../../hooks/usePlayerSearch';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import { 
  Loader2, 
  User, 
  UserPlus, 
  Phone, 
  ChevronsUpDown,
  Check,
  Search
} from 'lucide-react';

/**
 * Reusable Player Search Combobox with shadcn Command
 * - Shows all players on first click
 * - Search functionality
 * - Add New Player option
 * - Premium UI with avatars
 */
const PlayerSearchCombobox = ({ 
  onSelectPlayer, 
  onAddNewPlayer,
  selectedPlayer = null,
  placeholder = "Click to search or select a player...",
  showAddNew = true,
  className = ""
}) => {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  
  const {
    searchQuery,
    setSearchQuery,
    searching: searchingPlayers,
    filteredPlayers,
    loadAllPlayers,
    searchPlayers,
    selectPlayer
  } = usePlayerSearch();

  // Load players on mount
  useEffect(() => {
    if (token) {
      loadAllPlayers(token, { reuseExisting: true });
    }
  }, [token]);

  const handleSelectPlayer = (player) => {
    selectPlayer(player);
    setOpen(false);
    if (onSelectPlayer) {
      onSelectPlayer(player);
    }
  };

  const handleAddNewPlayer = () => {
    setOpen(false);
    if (onAddNewPlayer) {
      onAddNewPlayer(searchQuery);
    }
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (token && value.trim()) {
      searchPlayers(token, value);
    } else if (token) {
      loadAllPlayers(token, { reuseExisting: true });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between h-14 text-left font-normal bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 ${className}`}
        >
          {selectedPlayer ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {selectedPlayer.player_name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{selectedPlayer.player_name}</p>
                <p className="text-xs text-gray-500">
                  {selectedPlayer.player_code || selectedPlayer.player_id} • {selectedPlayer.phone_number || 'No phone'}
                </p>
              </div>
            </div>
          ) : (
            <span className="text-gray-400 flex items-center gap-2">
              <Search className="w-4 h-4" />
              {placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search by name, code, or phone..." 
            value={searchQuery}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            {searchingPlayers ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Searching...</span>
              </div>
            ) : (
              <>
                {filteredPlayers?.length === 0 && searchQuery && (
                  <CommandEmpty>
                    <div className="flex flex-col items-center py-6">
                      <User className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500 mb-4">No player found with "{searchQuery}"</p>
                      {showAddNew && (
                        <Button
                          type="button"
                          onClick={handleAddNewPlayer}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add as New Player
                        </Button>
                      )}
                    </div>
                  </CommandEmpty>
                )}
                
                {filteredPlayers?.length > 0 && (
                  <CommandGroup heading="Select a Player">
                    <ScrollArea className="h-[280px]">
                      {filteredPlayers.map((player) => (
                        <CommandItem
                          key={player.player_id}
                          value={player.player_name}
                          onSelect={() => handleSelectPlayer(player)}
                          className="cursor-pointer py-3 px-3 hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {player.player_name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {player.player_name}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="font-medium text-blue-600">{player.player_code}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {player.phone_number || 'No phone'}
                                </span>
                              </div>
                              {player.credit_outstanding > 0 && (
                                <p className="text-xs text-orange-600 font-medium mt-0.5">
                                  Outstanding: ₹{parseFloat(player.credit_outstanding).toLocaleString('en-IN')}
                                </p>
                              )}
                            </div>
                            {selectedPlayer?.player_id === player.player_id && (
                              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                )}
                
                {/* Add New Player Option - Always visible */}
                {showAddNew && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={handleAddNewPlayer}
                        className="cursor-pointer py-3 text-blue-600 hover:bg-blue-50"
                      >
                        <UserPlus className="w-5 h-5 mr-2" />
                        <span className="font-medium">Add New Player</span>
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default PlayerSearchCombobox;
