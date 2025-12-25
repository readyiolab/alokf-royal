// pages/admin/Players.jsx
import { useState, useEffect } from 'react';
import { Plus, BarChart3, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import AdminLayout from '../../components/layouts/AdminLayout';
import PlayerSearch from '@/components/players/PlayerSearch';
import PlayerList from '@/components/players/PlayerList';
import AddPlayerDialog from '@/components/players/AddPlayerDialog';
import EditPlayerDialog from '@/components/players/EditPlayerDialog';
import PlayerDetails from '@/components/players/PlayerDetails';
import PlayerStats from '@/components/players/PlayerStats';

import { useAuth } from '@/hooks/useAuth';
import PlayerService from '@/services/player.service';

export const AdminPlayersPage = () => {
  const { token, loading: authLoading, hasRole } = useAuth();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    blacklisted: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Fetch player stats (total, active, blacklisted)
   // Fetch player stats (total, active, blacklisted)
  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const players = await PlayerService.getAllPlayers(token);

        if (Array.isArray(players)) {
          const total = players.length;
          const active = players.filter(
            (p) => p.is_active === 1 && p.is_blacklisted === 0
          ).length;
          const blacklisted = players.filter((p) => p.is_blacklisted === 1).length;

          setStats({ total, active, blacklisted });
        } else {
          throw new Error('Expected array of players');
        }
      } catch (err) {
        console.error('Failed to load player stats:', err);
        setStatsError('Failed to load stats');
        setStats({ total: 0, active: 0, blacklisted: 0 });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [token, refreshTrigger]);
  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    setDetailsOpen(true);
    setShowStats(false);
  };

  const handlePlayerAdded = () => {
    setAddDialogOpen(false);
    setRefreshTrigger((prev) => prev + 1);
    // You can add a success toast here later
  };

  const handleViewStats = (player) => {
    setSelectedPlayer(player);
    setShowStats(true);
    setDetailsOpen(false);
  };

  const handleEdit = (player) => {
    setSelectedPlayer(player);
    setEditDialogOpen(true);
  };

  const handlePlayerUpdated = () => {
    setEditDialogOpen(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleIssueCredit = (player) => {
    console.log('Issue credit to:', player);
    // Implement credit issuance here
  };

  // Auth checks
  if (authLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!token || !hasRole(['admin'])) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-lg text-red-600">Access denied. Admin role required.</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Player Management</h1>
          <p className="text-muted-foreground mt-1 ">Manage all players in the system</p>
        </div>
        <Button className="bg-black hover:bg-black/80" onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2 text-white" />
          <span className="text-white">Add New Player</span>
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <PlayerSearch onSelectPlayer={handleSelectPlayer} />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white text-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-8 w-8 text-blue-500 opacity-20" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20 text-black" />
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
            <p className="text-xs text-black">All registered players</p>
          </CardContent>
        </Card>

        <Card className="bg-white text-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <Users className="h-8 w-8 text-green-500 opacity-20" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            )}
            <p className="text-xs text-black">Currently active</p>
          </CardContent>
        </Card>

        <Card className="bg-white text-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blacklisted</CardTitle>
            <Users className="h-8 w-8 text-red-500 opacity-20" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats.blacklisted}</div>
            )}
            <p className="text-xs text-black">Restricted access</p>
          </CardContent>
        </Card>
      </div>

      {statsError && (
        <p className="text-sm text-red-600 text-center">{statsError}</p>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player List - Left Side */}
        <div className="lg:col-span-2">
          <Card className="h-full bg-white text-black">
            <CardHeader>
              <CardTitle>All Players</CardTitle>
              <CardDescription>List of all registered players</CardDescription>
            </CardHeader>
            <CardContent>
              <PlayerList
                key={refreshTrigger} // Forces re-fetch when player is added
                onSelectPlayer={handleSelectPlayer}
                onViewDetails={handleSelectPlayer}
                onEdit={handleEdit}
                onIssueCredit={handleIssueCredit}
                compact={false}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-6">
          {selectedPlayer && !showStats ? (
            <>
              {/* Player Summary Card */}
              <Card className="bg-white text-black">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-lg">{selectedPlayer.player_name}</CardTitle>
                  <CardDescription>ID: {selectedPlayer.player_id}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {selectedPlayer.phone_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedPlayer.phone_number}</p>
                    </div>
                  )}
                  {selectedPlayer.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedPlayer.email}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailsOpen(true)}
                    >
                      Full Details
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewStats(selectedPlayer)}
                      className="flex items-center justify-center gap-1"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Stats
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Notes Card */}
              <Card>
                <CardHeader className="bg-blue-50 pb-3">
                  <CardTitle className="text-sm">Quick Notes</CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  {selectedPlayer.notes ? (
                    <p className="text-sm text-muted-foreground">{selectedPlayer.notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No notes added</p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : selectedPlayer && showStats ? (
            <Card>
              <CardHeader>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStats(false)}
                  className="w-full justify-start"
                >
                  ← Back to Player
                </Button>
              </CardHeader>
              <CardContent>
                <PlayerStats playerId={selectedPlayer.player_id} showHeader={false} />
              </CardContent>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center py-12">
              <Users className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Select a player to view details</p>
              <p className="text-sm text-muted-foreground mt-2 text-center max-w-xs">
                Click on any player from the list to see their information here.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AddPlayerDialog
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onPlayerAdded={handlePlayerAdded}
      />

      <EditPlayerDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        player={selectedPlayer}
        onPlayerUpdated={handlePlayerUpdated}
      />

      <PlayerDetails
        player={selectedPlayer}
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onEdit={handleEdit}
      />
      </div>
    </AdminLayout>
  );
};

export default AdminPlayersPage;