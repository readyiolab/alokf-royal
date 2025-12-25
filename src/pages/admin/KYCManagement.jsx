import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import KYCService from '../../services/kyc.service';
import AdminLayout from '../../components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  User,
  Phone,
  Mail,
  FileText,
  BadgeCheck,
  Search
} from 'lucide-react';

const KYCManagement = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingKYCs, setPendingKYCs] = useState([]);
  const [allKYCs, setAllKYCs] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState('approve');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pending, all, statistics] = await Promise.all([
        KYCService.getPendingKYCs(token).catch(() => ({ kycs: [] })),
        KYCService.getAllKYCs(token).catch(() => ({ kycs: [] })),
        KYCService.getKYCStats(token).catch(() => null)
      ]);
      setPendingKYCs(pending?.kycs || []);
      setAllKYCs(all?.kycs || []);
      setStats(statistics);
    } catch (error) {
      console.error('Failed to fetch KYC data:', error);
      setError(error.message || 'Failed to load KYC data');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedKYC) return;

    if (reviewAction === 'reject' && !notes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      await KYCService.reviewKYC(
        token,
        selectedKYC.player_id,
        reviewAction,
        notes || null
      );
      alert(`KYC ${reviewAction}d successfully!`);
      setShowReviewDialog(false);
      setSelectedKYC(null);
      setNotes('');
      fetchData();
    } catch (error) {
      alert(`Failed to ${reviewAction}: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const filteredKYCs = allKYCs.filter(kyc => {
    const matchesSearch = !searchTerm || 
      kyc.player_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kyc.player_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kyc.phone_number?.includes(searchTerm);
    
    const matchesStatus = !filterStatus || kyc.kyc_status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const KYCCard = ({ kyc, showActions = false }) => {
    const statusBadge = KYCService.getKYCStatusBadge(kyc.kyc_status);
    const methodLabel = KYCService.getKYCMethodLabel(kyc.kyc_method);

    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                {kyc.player_name}
              </CardTitle>
              <CardDescription className="space-y-1 mt-2">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4" />
                  {kyc.player_code}
                </div>
                {kyc.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {kyc.phone_number}
                  </div>
                )}
                {kyc.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {kyc.email}
                  </div>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge variant={statusBadge.variant} className={`bg-${statusBadge.color}-600`}>
                {statusBadge.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {methodLabel}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">ID Type</p>
              <p className="text-gray-900 font-medium">{kyc.id_type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Submitted</p>
              <p className="text-gray-900 font-medium">
                {kyc.submitted_at 
                  ? new Date(kyc.submitted_at).toLocaleDateString('en-IN')
                  : 'Not submitted'}
              </p>
            </div>
          </div>

          {kyc.digilocker_verified && (
            <Alert className="bg-green-600/10 border-green-600">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Verified via DigiLocker
              </AlertDescription>
            </Alert>
          )}

          {kyc.verification_notes && (
            <Alert className="bg-gray-100 border-gray-200">
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold text-sm">Notes:</p>
                <p className="text-sm mt-1">{kyc.verification_notes}</p>
              </AlertDescription>
            </Alert>
          )}

          {showActions && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  setSelectedKYC(kyc);
                  setReviewAction('approve');
                  setShowReviewDialog(true);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => {
                  setSelectedKYC(kyc);
                  setReviewAction('reject');
                  setShowReviewDialog(true);
                }}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading KYC data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">KYC Management</h1>
          <p className="text-gray-600 mt-1">Review and approve player KYC documents</p>
        </div>

        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        )}

      {/* Statistics */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Review
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.kyc_stats?.submitted || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Approved
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.kyc_stats?.approved || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                DigiLocker
              </CardTitle>
              <BadgeCheck className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.kyc_stats?.digilocker_kyc || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total KYC
              </CardTitle>
              <FileText className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.kyc_stats?.total_kyc || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-zinc-900">
          <TabsTrigger value="pending" className="data-[state=active]:bg-gray-100">
            Pending ({pendingKYCs.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-gray-100">
            All KYCs ({allKYCs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingKYCs.length === 0 ? (
            <Alert className="bg-zinc-900 border-zinc-800">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-gray-600">
                No pending KYC reviews. All clear!
              </AlertDescription>
            </Alert>
          ) : (
            pendingKYCs.map((kyc) => (
              <KYCCard key={kyc.kyc_id} kyc={kyc} showActions={true} />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
              <Input
                placeholder="Search by name, code, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-900 border-zinc-800 text-gray-900"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-gray-900"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {filteredKYCs.length === 0 ? (
            <Alert className="bg-zinc-900 border-zinc-800">
              <AlertCircle className="h-4 w-4 text-gray-600" />
              <AlertDescription className="text-gray-600">
                No KYC records found.
              </AlertDescription>
            </Alert>
          ) : (
            filteredKYCs.map((kyc) => (
              <KYCCard key={kyc.kyc_id} kyc={kyc} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} KYC
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} KYC for {selectedKYC?.player_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Player</p>
              <p className="text-lg font-semibold text-gray-900">{selectedKYC?.player_name}</p>
              <p className="text-sm text-gray-600">{selectedKYC?.player_code}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">
                {reviewAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason *'}
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  reviewAction === 'approve' 
                    ? 'Add any notes...' 
                    : 'Provide a reason for rejection...'
                }
                className="bg-gray-100 border-gray-200 text-gray-900 mt-2"
                required={reviewAction === 'reject'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={processing || (reviewAction === 'reject' && !notes.trim())}
              className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={reviewAction === 'reject' ? 'destructive' : 'default'}
            >
              {processing 
                ? `${reviewAction === 'approve' ? 'Approving' : 'Rejecting'}...` 
                : `${reviewAction === 'approve' ? 'Approve' : 'Reject'} KYC`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
};

export default KYCManagement;