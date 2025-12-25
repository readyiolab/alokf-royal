/**
 * ============================================
 * EXAMPLE: How to use Floor Manager Service
 * ============================================
 * 
 * This file demonstrates various ways to use the Floor Manager service
 * and the useFloorManager hook in your components.
 */

// ============================================
// EXAMPLE 1: Using the useFloorManager Hook
// ============================================

import { useFloorManager } from '@/hooks/useFloorManager';

export function FloorManagerDashboardWidget() {
  const { tables, waitlist, confirmations, stats, loading, error } = useFloorManager();

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-blue-100 p-4 rounded">
        <p className="text-gray-600">Active Tables</p>
        <p className="text-3xl font-bold">{stats.totalTables}</p>
      </div>
      <div className="bg-green-100 p-4 rounded">
        <p className="text-gray-600">Players</p>
        <p className="text-3xl font-bold">{stats.activePlayers}</p>
      </div>
      <div className="bg-yellow-100 p-4 rounded">
        <p className="text-gray-600">Waiting</p>
        <p className="text-3xl font-bold">{stats.waitingPlayers}</p>
      </div>
      <div className="bg-red-100 p-4 rounded">
        <p className="text-gray-600">Pending</p>
        <p className="text-3xl font-bold">{stats.pendingConfirmations}</p>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 2: Create Table Form
// ============================================

import { useState } from 'react';

export function CreateTableForm() {
  const { createTable, loading } = useFloorManager();
  const [formData, setFormData] = useState({
    table_number: '',
    table_name: '',
    game_type: 'Texas Hold\'em',
    stakes: '',
    max_seats: 9
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTable(formData);
      alert('Table created successfully!');
      setFormData({
        table_number: '',
        table_name: '',
        game_type: 'Texas Hold\'em',
        stakes: '',
        max_seats: 9
      });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium">Table Number</label>
        <input
          type="number"
          value={formData.table_number}
          onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
          className="w-full border px-3 py-2 rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Table Name</label>
        <input
          type="text"
          value={formData.table_name}
          onChange={(e) => setFormData({ ...formData, table_name: e.target.value })}
          className="w-full border px-3 py-2 rounded"
          placeholder="e.g., Royal Flush, Diamond Club"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Game Type</label>
        <select
          value={formData.game_type}
          onChange={(e) => setFormData({ ...formData, game_type: e.target.value })}
          className="w-full border px-3 py-2 rounded"
        >
          <option>Texas Hold'em</option>
          <option>Omaha</option>
          <option>7 Card Stud</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Stakes</label>
        <input
          type="text"
          value={formData.stakes}
          onChange={(e) => setFormData({ ...formData, stakes: e.target.value })}
          className="w-full border px-3 py-2 rounded"
          placeholder="e.g., $5/$10 NL"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-500 text-white px-4 py-2 rounded font-bold disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Table'}
      </button>
    </form>
  );
}

// ============================================
// EXAMPLE 3: Active Tables List with Actions
// ============================================

export function ActiveTablesList() {
  const { tables, assignDealer, removeDealer, closeTable } = useFloorManager();

  return (
    <div className="space-y-3">
      {tables.map((table) => (
        <div key={table.table_id} className="border p-4 rounded bg-gray-50">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-lg">{table.table_name}</h3>
              <p className="text-gray-600">{table.stakes}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Players</p>
              <p className="text-2xl font-bold">{table.players?.length || 0}/9</p>
            </div>
          </div>

          <div className="mb-3 pb-3 border-b">
            <p className="text-xs text-gray-500">DEALER</p>
            <p className="font-semibold">{table.dealer?.full_name || 'Unassigned'}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => assignDealer(table.table_id, 'dealer_id')}
              className="flex-1 bg-blue-500 text-white px-3 py-1 rounded text-sm"
            >
              Assign Dealer
            </button>
            <button
              onClick={() => removeDealer(table.table_id)}
              className="flex-1 bg-yellow-500 text-white px-3 py-1 rounded text-sm"
            >
              Remove Dealer
            </button>
            <button
              onClick={() => closeTable(table.table_id)}
              className="flex-1 bg-red-500 text-white px-3 py-1 rounded text-sm"
            >
              Close Table
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// EXAMPLE 4: Waitlist Management
// ============================================

export function WaitlistManager() {
  const { waitlist, seatFromWaitlist, cancelWaitlist } = useFloorManager();
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);

  const handleSeat = async (waitlistId) => {
    if (!selectedTable || !selectedSeat) {
      alert('Please select table and seat');
      return;
    }
    try {
      await seatFromWaitlist(waitlistId, selectedTable, selectedSeat);
      alert('Player seated!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-3 max-w-2xl">
      <h2 className="text-xl font-bold">Waitlist Queue</h2>

      {waitlist.map((entry, idx) => (
        <div
          key={entry.waitlist_id}
          className="border p-4 rounded bg-blue-50 flex justify-between items-start"
        >
          <div className="flex-1">
            <p className="font-bold text-lg">
              #{idx + 1} {entry.player_name}
            </p>
            <p className="text-gray-600">{entry.player_phone}</p>
            <p className="text-sm text-gray-500">Waiting {entry.wait_time_minutes} min</p>
          </div>

          <div className="space-y-2">
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full border px-2 py-1 rounded text-sm"
            >
              <option value="">Select Table</option>
              {/* Tables would come from props or hook */}
            </select>
            <select
              value={selectedSeat}
              onChange={(e) => setSelectedSeat(e.target.value)}
              className="w-full border px-2 py-1 rounded text-sm"
            >
              <option value="">Select Seat</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((seat) => (
                <option key={seat} value={seat}>
                  Seat {seat}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => handleSeat(entry.waitlist_id)}
                className="flex-1 bg-green-500 text-white px-3 py-1 rounded text-sm font-bold"
              >
                Seat
              </button>
              <button
                onClick={() => cancelWaitlist(entry.waitlist_id)}
                className="flex-1 bg-red-500 text-white px-3 py-1 rounded text-sm font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ))}

      {waitlist.length === 0 && (
        <p className="text-center text-gray-500 py-4">No players waiting</p>
      )}
    </div>
  );
}

// ============================================
// EXAMPLE 5: Buy-in Confirmations
// ============================================

export function BuyinConfirmations() {
  const { confirmations, acceptConfirmation, rejectConfirmation } = useFloorManager();

  return (
    <div className="space-y-3 max-w-2xl">
      <h2 className="text-xl font-bold">Pending Confirmations</h2>

      {confirmations.map((conf) => (
        <div
          key={conf.request_id}
          className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-bold">{conf.player_name}</p>
              <p className="text-gray-600">{conf.player_phone}</p>
            </div>
            <p className="text-2xl font-bold text-green-600">₹{conf.buy_in_amount}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            <div>
              <p className="text-gray-600">Table</p>
              <p className="font-semibold">{conf.table_name}</p>
            </div>
            <div>
              <p className="text-gray-600">Collected by</p>
              <p className="font-semibold">{conf.collected_by_name}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => acceptConfirmation(conf.request_id)}
              className="flex-1 bg-green-500 text-white px-4 py-2 rounded font-bold"
            >
              ✓ Accept
            </button>
            <button
              onClick={() => rejectConfirmation(conf.request_id, 'Rejected')}
              className="flex-1 bg-red-500 text-white px-4 py-2 rounded font-bold"
            >
              ✗ Reject
            </button>
          </div>
        </div>
      ))}

      {confirmations.length === 0 && (
        <p className="text-center text-gray-500 py-4">No pending confirmations</p>
      )}
    </div>
  );
}

// ============================================
// EXAMPLE 6: Using Service Directly (Advanced)
// ============================================

import floorManagerService from '@/services/floorManager.service';

export async function useFloorManagerServiceDirectly() {
  const token = localStorage.getItem('auth_token');
  const sessionId = 'current_session_id';

  try {
    // Get all tables
    const tablesResponse = await floorManagerService.getAllTables(sessionId, token);
    console.log('Tables:', tablesResponse.tables);

    // Create a table
    const newTable = await floorManagerService.createTable(
      {
        table_number: 5,
        table_name: 'Royal Flush',
        game_type: 'Texas Hold\'em',
        stakes: '$5/$10 NL',
        max_seats: 9
      },
      token
    );
    console.log('Table created:', newTable);

    // Get all dealers
    const dealersResponse = await floorManagerService.getAllDealers(token);
    console.log('Dealers:', dealersResponse.dealers);

    // Assign dealer to table
    await floorManagerService.assignDealerToTable(
      {
        table_id: newTable.table_id,
        dealer_id: 'dealer_123'
      },
      token
    );

    // Add to waitlist
    const waitlistEntry = await floorManagerService.addToWaitlist(
      {
        player_name: 'John Doe',
        player_phone: '9999999999',
        requested_game_type: 'Texas Hold\'em',
        buy_in_range_min: 1000,
        buy_in_range_max: 5000
      },
      token
    );
    console.log('Added to waitlist:', waitlistEntry);

    // Get confirmations
    const confirmationsResponse = await floorManagerService.getPendingConfirmations(token);
    console.log('Confirmations:', confirmationsResponse.pending_requests);

    // Accept confirmation
    if (confirmationsResponse.pending_requests.length > 0) {
      const firstRequest = confirmationsResponse.pending_requests[0];
      await floorManagerService.acceptConfirmation(
        firstRequest.request_id,
        {
          chips_100: 10,
          chips_500: 5,
          chips_5000: 2,
          chips_10000: 1
        },
        token
      );
      console.log('Confirmation accepted');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

export default {
  FloorManagerDashboardWidget,
  CreateTableForm,
  ActiveTablesList,
  WaitlistManager,
  BuyinConfirmations
};
