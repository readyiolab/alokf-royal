import React, { useState, useEffect } from 'react';
import {
  Search,
  MessageCircle,
  Phone,
  Bell,
  Clock,
  TrendingUp,
  Target,
  Users,
  RefreshCw,
  Filter,
  Heart,
  AlertCircle,
  CheckCircle2,
  Gift,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import playerService from '../../services/player.service';
import { useAuth } from '../../hooks/useAuth';
import CashierLayout from '../../components/layouts/CashierLayout';

const CRM = () => {
  const { token } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');

  const categories = [
    { id: 'all', name: 'All Categories', icon: '📊', color: 'bg-gray-100 text-gray-700' },
    { id: 'giveaways', name: 'Giveaways', icon: '🎁', color: 'bg-green-100 text-green-700' },
    { id: 'priority', name: 'Priority', icon: '⭐', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'needs-attention', name: 'Needs Action', icon: '🔔', color: 'bg-red-100 text-red-700' },
    { id: 'inactive', name: 'Inactive', icon: '📞', color: 'bg-gray-100 text-gray-700' },
  ];

  const tiers = [
    { id: 'all', name: 'All Tiers', color: 'bg-gray-100' },
    { id: 'new', name: 'NEW', color: 'bg-blue-100 text-blue-800' },
    { id: 'semi-pro', name: 'SEMI PRO', color: 'bg-purple-100 text-purple-800' },
    { id: 'pro', name: 'PRO', color: 'bg-orange-100 text-orange-800' },
    { id: 'og', name: 'OG', color: 'bg-red-100 text-red-800' },
  ];

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const response = await playerService.getAllPlayers();
      const playersList = Array.isArray(response) ? response : response.data?.players || [];
      setPlayers(playersList);
    } catch (err) {
      console.error('Error fetching players:', err);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPlayers();
    }
  }, [token]);

  const getPlayerCategory = (player) => {
    const lastVisitDate = player.last_session_at || player.last_visit;
    const daysSinceVisit = lastVisitDate
      ? Math.floor((new Date() - new Date(lastVisitDate)) / (1000 * 60 * 60 * 24))
      : null;

    const sessions = player.total_sessions || player.visit_count || 0;

    if (daysSinceVisit === null || sessions === 0) return 'giveaways'; // New players
    if (daysSinceVisit > 30) return 'inactive';
    if (player.lifetime_net && player.lifetime_net < 0) return 'needs-attention';
    if (sessions > 5) return 'priority';
    return 'giveaways';
  };

  const getPlayerTier = (player) => {
    const sessions = player.total_sessions || player.visit_count || 0;
    if (sessions === 0) return 'new';
    if (sessions <= 5) return 'semi-pro';
    if (sessions <= 20) return 'pro';
    return 'og';
  };

  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(numAmount || 0);
  };

  const formatHours = (seconds) => {
    if (!seconds) return '0.0h';
    const hours = seconds / 3600;
    return `${hours.toFixed(1)}h`;
  };

  const formatSecondsToHours = (seconds) => {
    if (!seconds) return '0.0h';
    const hours = seconds / 3600;
    return `${hours.toFixed(1)}h`;
  };

  const getDaysAway = (lastVisit) => {
    if (!lastVisit) return 'N/A';
    const days = Math.floor((new Date() - new Date(lastVisit)) / (1000 * 60 * 60 * 24));
    return `${days} Days`;
  };

  const getActionRecommendation = (player, category, tier) => {
    if (category === 'needs-attention') {
      return '⚠️ High-risk player. Personalized incentive offer recommended.';
    }
    if (category === 'priority') {
      return '🎯 High-value player with significant activity. VIP treatment recommended.';
    }
    if (category === 'giveaways') {
      return `🎁 New player - eligible for giveaway promotion${player.referred_by ? ` (Referred by: ${player.referred_by})` : ''} to encourage return visits.`;
    }
    if (category === 'inactive') {
      return '📞 Inactive player. Win-back campaign recommended with special offers.';
    }
    return 'Continue engagement and regular follow-ups.';
  };

  const filteredPlayers = players.filter((player) => {
    const playerCategory = getPlayerCategory(player);
    const playerTier = getPlayerTier(player);

    const matchesSearch =
      !searchQuery ||
      player.player_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.phone_number?.includes(searchQuery);

    const matchesCategory = selectedCategory === 'all' || playerCategory === selectedCategory;
    const matchesTier = selectedTier === 'all' || playerTier === selectedTier;

    return matchesSearch && matchesCategory && matchesTier;
  });

  const stats = {
    totalPlayers: players.length,
    og: players.filter((p) => getPlayerTier(p) === 'og').length,
    needsAttention: players.filter((p) => getPlayerCategory(p) === 'needs-attention').length,
    activeThisWeek: players.filter((p) => {
      if (!p.last_visit) return false;
      const days = Math.floor((new Date() - new Date(p.last_visit)) / (1000 * 60 * 60 * 24));
      return days <= 7;
    }).length,
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        <p className="text-sm font-medium text-gray-500">Loading CRM data...</p>
      </div>
    );
  }

  return (
    <CashierLayout>
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
        <p className="text-gray-600">Manage player relationships and retention strategies</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 text-gray-900"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-white shadow-md border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-600 font-semibold mb-1">Total Players</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPlayers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-600 font-semibold mb-1">OG Players</p>
              <p className="text-2xl font-bold text-red-600">{stats.og}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-600 font-semibold mb-1">Needs Attention</p>
              <p className="text-2xl font-bold text-red-600">{stats.needsAttention}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-600 font-semibold mb-1">Active This Week</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeThisWeek}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <p className="text-sm font-semibold text-gray-700">All Categories</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              className={`${
                selectedCategory === cat.id
                  ? 'bg-black text-white border-purple-600'
                  : `border-2 border-gray-200 text-gray-700 hover:border-purple-400`
              }`}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Tier Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <p className="text-sm font-semibold text-gray-700">All Tiers</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tiers.map((tier) => (
            <Button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              variant={selectedTier === tier.id ? 'default' : 'outline'}
              className={`${
                selectedTier === tier.id
                  ? 'bg-black text-white border-purple-600'
                  : `border-2 border-gray-200 text-gray-700 hover:border-purple-400`
              }`}
            >
              {tier.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Players List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            All Players
          </h2>
          
        </div>

        {filteredPlayers.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No players found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPlayers.map((player) => {
              const playerCategory = getPlayerCategory(player);
              const playerTier = getPlayerTier(player);
              const categoryConfig = categories.find((c) => c.id === playerCategory);
              const tierConfig = tiers.find((t) => t.id === playerTier);

              return (
                <Card
                  key={player.player_id}
                  className="bg-white shadow-md hover:shadow-lg transition-shadow border-2 border-gray-200"
                >
                  <CardContent className="p-5">
                    {/* Player Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                       

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-gray-900 font-bold text-lg">{player.player_name}</h3>
                            <Badge className={categoryConfig?.color || 'bg-gray-100'}>
                              {categoryConfig?.icon} {categoryConfig?.name}
                            </Badge>
                            <Badge className={`${tierConfig?.color || 'bg-gray-100'} font-bold`}>
                              {tierConfig?.name}
                            </Badge>
                          </div>

                          {/* Action Recommendation */}
                          <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3">
                            <p className="text-xs text-blue-800">
                              {getActionRecommendation(player, playerCategory, playerTier)}
                            </p>
                          </div>

                          {/* Player Stats Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
                            <div>
                              <p className="text-gray-600 font-semibold mb-0.5">Hours Played</p>
                              <p className="text-gray-900 font-bold text-sm">
                                {formatSecondsToHours(player.total_play_time_seconds || player.total_hours_played * 3600)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-semibold mb-0.5">Avg Session</p>
                              <p className="text-gray-900 font-bold text-sm">
                                {formatSecondsToHours(player.avg_session_seconds || player.avg_session_duration * 3600)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-semibold mb-0.5">Total Sessions</p>
                              <p className="text-gray-900 font-bold text-sm">
                                {player.total_sessions || player.visit_count || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-semibold mb-0.5">Lifetime Net</p>
                              <p className={`font-bold text-sm ${
                                player.lifetime_net && player.lifetime_net > 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}>
                                {formatCurrency(player.lifetime_net || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-semibold mb-0.5">Last Visit</p>
                              <p className="text-gray-900 font-bold text-sm">
                                {player.last_session_at || player.last_visit
                                  ? new Date(player.last_session_at || player.last_visit).toLocaleDateString('en-IN')
                                  : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-semibold mb-0.5">Days Away</p>
                              <p className="text-gray-900 font-bold text-sm">
                                {getDaysAway(player.last_session_at || player.last_visit)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-2 border-green-300 text-green-700 bg-white"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50 bg-white"
                      >
                        <Phone className="w-4 h-4 mr-1" /> Call
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 bg-white"
                      >
                        <Bell className="w-4 h-4 mr-1" /> Push
                      </Button>
                      {playerCategory === 'giveaways' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50 bg-white"
                        >
                          <Gift className="w-4 h-4 mr-1" /> Offer Bonus
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </CashierLayout>
  );
};

export default CRM;
