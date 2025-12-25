import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  File,
} from 'lucide-react';
import kycService from '../../services/kyc.service';

const KYCUploadForm = ({ playerId, playerName, onSuccess, onCancel, defaultDocType = '' }) => {
  const [documentType, setDocumentType] = useState(defaultDocType);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const documentTypes = [
    { value: 'id_front', label: 'ID Proof - Front' },
    { value: 'id_back', label: 'ID Proof - Back' },
    { value: 'address_proof', label: 'Address Proof' },
    { value: 'photo', label: 'Passport Photo' },
  ];

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      setFilePreview(null);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Only JPEG, PNG, and PDF files are allowed');
      setFile(null);
      setFilePreview(null);
      return;
    }

    // Validate file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      setFile(null);
      setFilePreview(null);
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!documentType) {
      setError('Please select a document type');
      return;
    }

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('document', file);
      formData.append('document_type', documentType);

      // Call KYC service
      const result = await kycService.uploadKYCDocument(playerId, formData);

      if (result.success) {
        setSuccess('Document uploaded successfully to Cloudinary!');
        setDocumentType('');
        setFile(null);
        setFilePreview(null);

        // Trigger success callback after 2 seconds
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Document Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-black">Document Type *</label>
          <Select value={documentType} onValueChange={setDocumentType} disabled={uploading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-black">Document File *</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-black transition-colors">
            <input
              type="file"
              id="file-input"
              onChange={handleFileSelect}
              accept=".jpg,.jpeg,.png,.pdf"
              disabled={uploading}
              className="hidden"
            />
            <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center gap-2">
              {filePreview ? (
                <>
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="max-h-48 object-contain rounded"
                  />
                  <span className="text-sm text-gray-600 mt-2">{file?.name}</span>
                </>
              ) : file ? (
                <>
                  <File className="w-12 h-12 text-gray-400" />
                  <span className="text-sm text-gray-600">{file.name}</span>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400" />
                  <span className="text-sm font-medium text-black">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-gray-500">
                    PNG, JPG, JPEG, PDF up to 5MB
                  </span>
                </>
              )}
            </label>
          </div>
        </div>

        {/* File Info */}
        {file && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
            <p className="text-sm text-blue-800">
              <strong>File:</strong> {file.name}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
            </p>
            <p className="text-sm text-blue-800">
              <strong>Type:</strong> {file.type}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-black text-white hover:bg-gray-800"
            disabled={uploading || !documentType || !file}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload to Cloudinary
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default KYCUploadForm;
