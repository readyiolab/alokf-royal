import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Paperclip, Check, Loader2, X, Image as ImageIcon } from 'lucide-react';
import transactionService from '../../services/transaction.service';
import { useAuth } from '../../hooks/useAuth';

const TransactionNotesModal = ({ 
  open, 
  onOpenChange, 
  transaction, 
  onNoteAdded 
}) => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [resolved, setResolved] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (open && transaction) {
      fetchNotes();
    } else {
      setNote('');
      setAttachedImage(null);
      setImagePreview(null);
    }
  }, [open, transaction]);

  const fetchNotes = async () => {
    if (!transaction?.transaction_id) return;
    
    setLoading(true);
    try {
      const response = await transactionService.getTransactionNotes(token, transaction.transaction_id);
      const data = response?.data || response;
      setNotes(data?.notes || []);
      setResolved(data?.is_resolved === true || data?.is_resolved === 1 || false);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load transaction notes',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Image size must be less than 5MB',
        });
        return;
      }
      setAttachedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
    setImagePreview(null);
  };

  const handleSaveNote = async () => {
    if (!note.trim() && !attachedImage) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please add a comment or attach an image',
      });
      return;
    }

    setSaving(true);
    try {
      await transactionService.addTransactionNote(token, transaction.transaction_id, {
        note: note.trim(),
        image: attachedImage,
      });
      
      toast({
        title: 'Success',
        description: 'Note added successfully',
      });
      
      setNote('');
      setAttachedImage(null);
      setImagePreview(null);
      await fetchNotes();
      onNoteAdded?.();
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save note',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await transactionService.resolveTransactionNotes(token, transaction.transaction_id);
      setResolved(true);
      toast({
        title: 'Success',
        description: 'Transaction notes resolved',
      });
      await fetchNotes();
    } catch (error) {
      console.error('Error resolving notes:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to resolve notes',
      });
    } finally {
      setResolving(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Transaction Notes
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">Notes are read-only after saving</p>
            </div>
            {resolved && (
              <Badge className="bg-green-500 text-white px-3 py-1 rounded-md font-medium">
                Resolved
              </Badge>
            )}
          </div>
          {!resolved && notes.length > 0 && (
            <div className="flex justify-end mt-2">
              <Button
                onClick={handleResolve}
                disabled={resolving}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                {resolving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Resolve
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 capitalize">
                    {transaction.transaction_type?.replace(/_/g, ' ') || 'Transaction'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {transaction.player_name || 'System'} • {formatDateTime(transaction.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${(transaction.amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(transaction.amount || 0) >= 0 ? '+' : ''}₹{Math.abs(transaction.amount || transaction.chips_amount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing Notes */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : notes.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Previous Notes</h4>
              {notes.map((n, idx) => (
                <Card key={idx} className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {n.created_by_name || 'System'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(n.created_at)}
                        </p>
                      </div>
                    </div>
                    {n.note && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                        {n.note}
                      </p>
                    )}
                    {n.image_url && (
                      <div className="mt-2">
                        <img
                          src={n.image_url}
                          alt="Note attachment"
                          className="max-w-full h-auto rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No notes yet</p>
            </div>
          )}

          {/* Add New Note */}
          {!resolved && (
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-medium">Add a comment</Label>
              <Textarea
                placeholder="Add a comment..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[100px]"
              />
              
              {/* Image Attachment */}
              <div className="space-y-2">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-auto rounded-lg border border-gray-200 max-h-48 object-contain"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        <Paperclip className="w-4 h-4 mr-2" />
                        Attach Image
                      </Button>
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-500">
                  {formatDateTime(new Date().toISOString())}
                </p>
                <Button
                  onClick={handleSaveNote}
                  disabled={saving || (!note.trim() && !attachedImage)}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <MessageSquare className="w-4 h-4 mr-2" />
                  )}
                  Save Note
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionNotesModal;

