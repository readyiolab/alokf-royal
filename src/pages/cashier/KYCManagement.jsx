import { useState, useEffect } from 'react';
import CashierLayout from '../../components/layouts/CashierLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileCheck,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Loader2,
  Eye,
  Download,
  Trash2,
} from 'lucide-react';
import playerService from '../../services/player.service';
import kycService from '../../services/kyc.service';
import KYCUploadForm from '../../components/kyc/KYCUploadForm';

const KYCManagement = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(null);
  const [viewDetailsPlayer, setViewDetailsPlayer] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Load players
  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use the new endpoint with KYC documents
      const result = await playerService.getAllPlayersWithKYC();
      let playerList = Array.isArray(result) ? result : result?.players || [];
      setPlayers(playerList);
    } catch (err) {
      console.error('Error loading players:', err);
      setError(err.message || 'Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const getKYCStatus = (player) => {
    const status = player?.kyc_status || 'pending';
    const statusConfig = {
      approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: X },
      submitted: { label: 'Under Review', color: 'bg-blue-100 text-blue-800', icon: Clock },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    };
    return statusConfig[status] || statusConfig.pending;
  };

  const handleUploadSuccess = () => {
    setUploadSuccess('Document uploaded successfully!');
    setTimeout(() => {
      loadPlayers();
      setUploadSuccess(null);
    }, 2000);
  };

  const handlePreviewDocument = (player, docType) => {
    setDocumentPreview({
      player,
      docType,
      url: player[getDocumentField(docType)]
    });
    setShowPreviewDialog(true);
  };

  const getDocumentField = (docType) => {
    const fieldMap = {
      id_front: 'id_document_front',
      id_back: 'id_document_back',
      address_proof: 'address_proof_document',
      photo: 'photo'
    };
    return fieldMap[docType];
  };

  const getDocumentLabel = (docType) => {
    const labelMap = {
      id_front: 'ID Front',
      id_back: 'ID Back',
      address_proof: 'Address Proof',
      photo: 'Photo'
    };
    return labelMap[docType];
  };

  const isDocumentUploaded = (player, docType) => {
    const field = getDocumentField(docType);
    return !!player?.[field];
  };

  const getUploadedDocumentsCount = (player) => {
    const docTypes = ['id_front', 'id_back', 'address_proof', 'photo'];
    return docTypes.filter(doc => isDocumentUploaded(player, doc)).length;
  };

  const getKYCCompletionStatus = (player) => {
    const count = getUploadedDocumentsCount(player);
    if (count === 4) {
      return { status: 'Done', color: 'bg-green-100 text-green-800' };
    } else if (count > 0) {
      return { status: 'Partial', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { status: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  const handleDeleteDocument = async (playerId, docType) => {
    if (!window.confirm(`Are you sure you want to delete this ${getDocumentLabel(docType)} document?`)) {
      return;
    }

    try {
      setDeletingDoc(`${playerId}-${docType}`);
      setDeleteError(null);
      await kycService.deleteKYCDocument(playerId, docType);
      
      // Reload players to refresh the UI
      await loadPlayers();
      setUploadSuccess('Document deleted successfully!');
      setTimeout(() => setUploadSuccess(null), 2000);
    } catch (err) {
      console.error('Error deleting document:', err);
      setDeleteError(err.message || 'Failed to delete document');
    } finally {
      setDeletingDoc(null);
    }
  };

  const StatusBadge = ({ player }) => {
    const config = getKYCStatus(player);
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <CashierLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-black" />
        </div>
      </CashierLayout>
    );
  }

  return (
    <CashierLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black flex items-center gap-3">
              <FileCheck className="w-8 h-8" />
              KYC Management
            </h1>
            <p className="text-gray-600 mt-1">Manage player KYC documents and status</p>
          </div>
        </div>

        {/* Success Alert */}
        {uploadSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{uploadSuccess}</AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Delete Error Alert */}
        {deleteError && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{deleteError}</AlertDescription>
          </Alert>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-xl bg-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-1">Total Players</p>
                <p className="text-3xl font-bold text-black">{players.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-1">Pending KYC</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {players.filter(p => p?.kyc_status === 'pending').length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-1">Under Review</p>
                <p className="text-3xl font-bold text-blue-600">
                  {players.filter(p => p?.kyc_status === 'submitted').length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-600">
                  {players.filter(p => p?.kyc_status === 'approved').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Players Table */}
        <Card className="border-none shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="text-black">KYC Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-black text-white">
                    <TableHead className="text-white">Player Name</TableHead>
                    <TableHead className="text-white">Phone</TableHead>
                    <TableHead className="text-white">Email</TableHead>
                    <TableHead className="text-white">Documents</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan="6" className="text-center text-gray-500 py-8">
                        No players found
                      </TableCell>
                    </TableRow>
                  ) : (
                    players.map((player) => {
                      const docCount = getUploadedDocumentsCount(player);
                      const completionStatus = getKYCCompletionStatus(player);
                      
                      return (
                        <TableRow key={player.player_id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-black">
                            {player.player_name}
                          </TableCell>
                          <TableCell className="text-gray-700">{player.phone_number || player.phone || '-'}</TableCell>
                          <TableCell className="text-gray-700">{player.email || '-'}</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">
                              {docCount}/4 docs
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={completionStatus.color}>
                              {completionStatus.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              className="bg-black text-white hover:bg-gray-800"
                              onClick={() => {
                                setViewDetailsPlayer(player);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog - Shows all 4 document cards */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-black">
              KYC Documents - {viewDetailsPlayer?.player_name}
            </DialogTitle>
          </DialogHeader>

          {viewDetailsPlayer && (
            <div className="space-y-4">
              {/* Document Upload Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['id_front', 'id_back', 'address_proof', 'photo'].map((docType) => {
                  const isUploaded = isDocumentUploaded(viewDetailsPlayer, docType);
                  const docLabel = getDocumentLabel(docType);
                  const docUrl = viewDetailsPlayer[getDocumentField(docType)];

                  return (
                    <div
                      key={docType}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isUploaded
                          ? 'bg-green-50 border-green-300'
                          : 'bg-yellow-50 border-yellow-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-sm text-black">{docLabel}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {isUploaded ? '✅ Uploaded' : '❌ Not Uploaded'}
                          </p>
                        </div>
                      </div>

                      {/* Document Actions */}
                      <div className="flex gap-2">
                        {isUploaded && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs flex-1"
                              onClick={() => handlePreviewDocument(viewDetailsPlayer, docType)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs flex-1 text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => handleDeleteDocument(viewDetailsPlayer.player_id, docType)}
                              disabled={deletingDoc === `${viewDetailsPlayer.player_id}-${docType}`}
                            >
                              {deletingDoc === `${viewDetailsPlayer.player_id}-${docType}` ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Deleting
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </>
                        )}
                        <Dialog open={uploadDialogOpen === `${viewDetailsPlayer.player_id}-${docType}`} onOpenChange={(open) => {
                          if (open) {
                            setUploadDialogOpen(`${viewDetailsPlayer.player_id}-${docType}`);
                          } else {
                            setUploadDialogOpen(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="h-7 text-xs flex-1 bg-blue-600 hover:bg-blue-700"
                              onClick={() => setUploadDialogOpen(`${viewDetailsPlayer.player_id}-${docType}`)}
                            >
                              <Upload className="w-3 h-3 mr-1" />
                              {isUploaded ? 'Update' : 'Upload'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-black">
                                {isUploaded ? 'Update' : 'Upload'} {docLabel} - {viewDetailsPlayer.player_name}
                              </DialogTitle>
                            </DialogHeader>
                            <KYCUploadForm
                              playerId={viewDetailsPlayer.player_id}
                              playerName={viewDetailsPlayer.player_name}
                              defaultDocType={docType}
                              onSuccess={() => {
                                setUploadDialogOpen(null);
                                handleUploadSuccess();
                              }}
                              onCancel={() => setUploadDialogOpen(null)}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-black">
              {documentPreview?.player?.player_name} - {getDocumentLabel(documentPreview?.docType)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {documentPreview?.url ? (
              <div className="bg-gray-100 rounded-lg p-4">
                <img
                  src={documentPreview.url}
                  alt={documentPreview.docType}
                  className="w-full max-h-96 object-contain rounded"
                />
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Document not available</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2 justify-end">
              {documentPreview?.url && (
                <a href={documentPreview.url} download target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </a>
              )}
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CashierLayout>
  );
};

export default KYCManagement;
