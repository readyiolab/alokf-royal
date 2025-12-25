// ============================================
// FILE: components/floor-manager/modals/AddPlayerModal.jsx
// Modal for adding a player to a table - with New Player Creation
// ============================================

import React, { useState, useEffect } from 'react';
import { Search, X, UserPlus, Plus, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import playerService from '../../../services/player.service';

const AddPlayerModal = ({
  open,
  onOpenChange,
  selectedTable,
  selectedSeat,
  getUnseatedPlayers,
  onSubmit,
  tables = [],
}) => {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [chosenTable, setChosenTable] = useState(null);
  const [form, setForm] = useState({
    seat_number: '',
    buy_in_amount: '10000',
  });
  
  // New Player Form
  const [newPlayerForm, setNewPlayerForm] = useState({
    player_name: '',
    phone_number: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [creatingPlayer, setCreatingPlayer] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Set initial seat and table when modal opens
  useEffect(() => {
    if (open) {
      if (selectedSeat) {
        setForm((prev) => ({ ...prev, seat_number: selectedSeat.toString() }));
      }
      if (selectedTable) {
        setChosenTable(selectedTable);
      }
    }
  }, [open, selectedSeat, selectedTable]);

  // Search for players - show all when dropdown is open, filter when query exists
  useEffect(() => {
    if (showDropdown) {
      // Get players - if no query, returns all unseated; otherwise filtered
      const players = getUnseatedPlayers(searchQuery.trim());
      setFilteredPlayers(players);
    } else {
      setFilteredPlayers([]);
    }
  }, [searchQuery, showDropdown, getUnseatedPlayers]);

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    setSearchQuery('');
    setFilteredPlayers([]);
    setShowDropdown(false);
  };

  const clearSelection = () => {
    setSelectedPlayer(null);
    setSearchQuery('');
    setFilteredPlayers([]);
    setShowDropdown(false);
  };

  const handleCreateNewPlayer = async () => {
    if (!newPlayerForm.player_name.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Player name is required' });
      return;
    }
    if (!newPlayerForm.phone_number.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Phone number is required' });
      return;
    }

    setCreatingPlayer(true);
    try {
      const result = await playerService.createPlayer({
        player_name: newPlayerForm.player_name.trim(),
        phone_number: newPlayerForm.phone_number.trim(),
      });
      
      // Select the newly created player
      const newPlayer = result.data || result;
      setSelectedPlayer({
        player_id: newPlayer.player_id,
        player_name: newPlayer.player_name,
        player_code: newPlayer.player_code,
        phone_number: newPlayer.phone_number,
      });
      
      // Clear form and switch to search tab
      setNewPlayerForm({ player_name: '', phone_number: '' });
      setActiveTab('search');
      
      toast({ title: 'Success', description: `Player ${newPlayer.player_name} created (${newPlayer.player_code})` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to create player' });
    } finally {
      setCreatingPlayer(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tableToUse = chosenTable || selectedTable;
    if (!selectedPlayer || !tableToUse) return;

    setLoading(true);
    try {
      await onSubmit({
        table_id: tableToUse.table_id,
        player_id: selectedPlayer.player_id,
        seat_number: Number(form.seat_number),
        buy_in_amount: Number(form.buy_in_amount),
      });
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPlayer(null);
    setSearchQuery('');
    setFilteredPlayers([]);
    setShowDropdown(false);
    setChosenTable(null);
    setForm({ seat_number: '', buy_in_amount: '10000' });
    setNewPlayerForm({ player_name: '', phone_number: '' });
    setActiveTab('search');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // Get available seats for the selected table
  const activeTable = chosenTable || selectedTable;
  const occupiedSeats = activeTable?.players?.map((p) => p.seat_number) || [];
  const availableSeats = [];
  for (let i = 1; i <= (activeTable?.max_seats || 9); i++) {
    if (!occupiedSeats.includes(i)) {
      availableSeats.push(i);
    }
  }

  // Tables with empty seats
  const tablesWithSpace = tables.filter(
    (t) => (t.players?.length || 0) < (t.max_seats || 9)
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1a1a2e] border-gray-700 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white text-sm">
            <UserPlus className="w-4 h-4 text-emerald-500" />
            Add Player {activeTable ? `to ${activeTable.table_name}` : ''}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Table Selection (if no table pre-selected) */}
          {!selectedTable && tablesWithSpace.length > 0 && (
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">Table</Label>
              <Select
                value={chosenTable?.table_id?.toString() || ''}
                onValueChange={(v) => {
                  const t = tables.find((tbl) => tbl.table_id.toString() === v);
                  setChosenTable(t);
                  setForm((prev) => ({ ...prev, seat_number: '' }));
                }}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-8 text-xs">
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {tablesWithSpace.map((t) => (
                    <SelectItem key={t.table_id} value={t.table_id.toString()}>
                      {t.table_name} ({t.players?.length || 0}/{t.max_seats})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Player Selection Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 bg-gray-800 h-7">
              <TabsTrigger value="search" className="text-[10px] data-[state=active]:bg-emerald-600">
                <Search className="w-3 h-3 mr-1" />
                Search
              </TabsTrigger>
              <TabsTrigger value="new" className="text-[10px] data-[state=active]:bg-blue-600">
                <Plus className="w-3 h-3 mr-1" />
                New Player
              </TabsTrigger>
            </TabsList>

            {/* Search Tab */}
            <TabsContent value="search" className="mt-2 space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2 w-3 h-3 text-gray-500" />
                <Input
                  type="text"
                  className="bg-gray-800 border-gray-700 text-white pl-7 h-8 text-xs"
                  placeholder="Click to see all players or type to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                />
              </div>

              {/* Search Results - show when dropdown is open */}
              {showDropdown && filteredPlayers.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-gray-700 rounded bg-gray-800">
                  <div className="px-2 py-1 text-[10px] text-gray-500 border-b border-gray-700 sticky top-0 bg-gray-800">
                    {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''} available
                  </div>
                  {filteredPlayers.map((player) => (
                    <button
                      key={player.player_id}
                      type="button"
                      onClick={() => {
                        handleSelectPlayer(player);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left p-2 hover:bg-gray-700 border-b border-gray-700 last:border-b-0"
                    >
                      <p className="font-medium text-white text-xs">{player.player_name}</p>
                      <p className="text-[10px] text-gray-400">
                        {player.player_code || 'N/A'} • {player.phone_number || 'N/A'}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {showDropdown && filteredPlayers.length === 0 && (
                <div className="p-3 bg-gray-800 border border-gray-700 rounded text-center">
                  <p className="text-gray-400 text-[10px] mb-2">
                    {searchQuery ? 'No players found matching search' : 'No players available'}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setActiveTab('new')}
                    className="bg-blue-600 hover:bg-blue-700 h-6 text-[10px] px-2"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create New Player
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* New Player Tab */}
            <TabsContent value="new" className="mt-2 space-y-2">
              <div className="space-y-1">
                <Label className="text-gray-400 text-xs">Name *</Label>
                <Input
                  type="text"
                  className="bg-gray-800 border-gray-700 text-white h-8 text-xs"
                  placeholder="Enter player name"
                  value={newPlayerForm.player_name}
                  onChange={(e) => setNewPlayerForm({ ...newPlayerForm, player_name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-400 text-xs">Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-2 top-2 w-3 h-3 text-gray-500" />
                  <Input
                    type="tel"
                    className="bg-gray-800 border-gray-700 text-white pl-7 h-8 text-xs"
                    placeholder="10-digit phone number"
                    value={newPlayerForm.phone_number}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, phone_number: e.target.value })}
                    maxLength={10}
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={handleCreateNewPlayer}
                disabled={creatingPlayer || !newPlayerForm.player_name.trim() || !newPlayerForm.phone_number.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 h-8 text-xs"
              >
                {creatingPlayer ? 'Creating...' : 'Create & Select'}
              </Button>
            </TabsContent>
          </Tabs>

          {/* Selected Player Display */}
          {selectedPlayer && (
            <div className="p-2 bg-emerald-900/30 border border-emerald-600 rounded flex justify-between items-center">
              <div>
                <p className="font-medium text-white text-xs">{selectedPlayer.player_name}</p>
                <p className="text-[10px] text-gray-400">
                  {selectedPlayer.player_code} {selectedPlayer.phone_number ? `• ${selectedPlayer.phone_number}` : ''}
                </p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6 hover:bg-red-600/20"
                onClick={clearSelection}
              >
                <X className="w-3 h-3 text-red-400" />
              </Button>
            </div>
          )}

          {/* Seat & Buy-in Row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">Seat</Label>
              <Select
                value={form.seat_number}
                onValueChange={(v) => setForm({ ...form, seat_number: v })}
                disabled={!!selectedSeat}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-8 text-xs">
                  <SelectValue placeholder="Seat" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {availableSeats.map((seat) => (
                    <SelectItem key={seat} value={seat.toString()}>
                      Seat {seat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">Buy-in (₹)</Label>
              <Input
                type="number"
                className="bg-gray-800 border-gray-700 text-white h-8 text-xs"
                value={form.buy_in_amount}
                onChange={(e) => setForm({ ...form, buy_in_amount: e.target.value })}
                placeholder="10000"
                required
              />
            </div>
          </div>

          {/* Quick Buy-in Options */}
          <div className="flex gap-1 flex-wrap">
            {[5000, 10000, 25000, 50000].map((amt) => (
              <Button
                key={amt}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setForm({ ...form, buy_in_amount: amt.toString() })}
                className={`h-6 text-[10px] px-2 ${
                  form.buy_in_amount === amt.toString()
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-gray-600 text-gray-400 hover:bg-gray-800'
                }`}
              >
                ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
              </Button>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedPlayer || !activeTable || loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 h-8 text-xs"
            >
              {loading ? 'Adding...' : 'Add Player'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlayerModal;
