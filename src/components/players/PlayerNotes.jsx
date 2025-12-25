import { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle, Trash2, Edit2, X } from 'lucide-react';
import playerService from '../../services/player.service';
import { useAuth } from '../../contexts/AuthContext';

export const PlayerNotes = ({ playerId, playerName, initialNotes = '' }) => {
  const { token } = useAuth();
  const [notes, setNotes] = useState(initialNotes);
  const [isEditing, setIsEditing] = useState(false);
  const [tempNotes, setTempNotes] = useState(initialNotes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSaveNotes = async () => {
    if (!tempNotes.trim()) {
      setError('Notes cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await playerService.updatePlayer(token, playerId, { notes: tempNotes });
      setNotes(tempNotes);
      setSuccess('✅ Notes updated successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message || 'Failed to update notes');
    } finally {
      setLoading(false);
    }
  };

  const handleClearNotes = async () => {
    if (!window.confirm('Are you sure you want to clear all notes?')) return;

    try {
      setLoading(true);
      setError(null);
      await playerService.updatePlayer(token, playerId, { notes: '' });
      setNotes('');
      setTempNotes('');
      setSuccess('✅ Notes cleared');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message || 'Failed to clear notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTempNotes(notes);
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="border border-gray-200 rounded-lg shadow overflow-hidden bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-blue-50 to-blue-100">
        <h3 className="font-semibold text-gray-900">Player Notes</h3>
        <p className="text-xs text-gray-600 mt-1">{playerName}</p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Display Mode */}
        {!isEditing && (
          <div>
            {notes ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-32">
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{notes}</p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-sm text-gray-500">No notes added yet</p>
              </div>
            )}
          </div>
        )}

        {/* Edit Mode */}
        {isEditing && (
          <div>
            <textarea
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="Add notes about this player..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-32 resize-none"
            />
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="border border-red-300 bg-red-50 rounded-lg p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="border border-green-300 bg-green-50 rounded-lg p-3 flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setTempNotes(notes);
                }}
                className="flex-1 px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Notes
              </button>
              {notes && (
                <button
                  onClick={handleClearNotes}
                  disabled={loading}
                  className="flex-1 px-3 py-2 text-sm font-semibold text-red-700 bg-red-100 rounded hover:bg-red-200 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-300 bg-white rounded hover:bg-gray-50 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Save Notes
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerNotes;