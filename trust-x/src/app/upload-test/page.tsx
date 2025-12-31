'use client';

/**
 * Upload Testing Page
 * 
 * Interactive interface for testing cloud storage file uploads.
 * Demonstrates the complete upload flow:
 * 1. Client selects file
 * 2. Client requests presigned URL from API
 * 3. Client uploads directly to cloud storage using presigned URL
 * 4. Client notifies server of successful upload
 * 5. Server verifies and saves metadata
 */

import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface UploadConfig {
  allowedTypes: string[];
  maxFileSize: number;
  maxFileSizeMB: string;
  provider: string;
  configured?: boolean;
  configMessage?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export default function UploadTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [config, setConfig] = useState<UploadConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load upload configuration on mount
  useEffect(() => {
    loadConfig();
    loadUploadHistory();
  }, []);

  async function loadConfig() {
    try {
      const response = await fetch('/api/upload/presigned-url');
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.data);
      } else {
        toast.error('Failed to load upload configuration');
      }
    } catch (error) {
      toast.error('Failed to load upload configuration');
    } finally {
      setLoading(false);
    }
  }

  async function loadUploadHistory() {
    try {
      const response = await fetch('/api/upload/complete?limit=10');
      const data = await response.json();
      
      if (data.success) {
        setUploadedFiles(data.data.files);
      }
    } catch (error) {
      console.error('Failed to load upload history:', error);
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (config && !config.allowedTypes.includes(file.type)) {
      toast.error(`File type not allowed. Supported types: ${config.allowedTypes.join(', ')}`);
      return;
    }

    // Validate file size
    if (config && file.size > config.maxFileSize) {
      toast.error(`File too large. Maximum size: ${config.maxFileSizeMB}MB`);
      return;
    }

    setSelectedFile(file);
    toast.success(`File selected: ${file.name}`);
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    if (config && !config.configured) {
      toast.error(config.configMessage || 'Storage is not configured');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned URL from our API
      toast.loading('Generating upload URL...', { id: 'upload-toast' });
      setUploadProgress(10);

      const presignedResponse = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          folder: 'uploads',
        }),
      });

      const presignedData = await presignedResponse.json();

      if (!presignedData.success) {
        throw new Error(presignedData.message || 'Failed to generate upload URL');
      }

      const { uploadUrl, publicUrl, key } = presignedData.data;
      setUploadProgress(30);

      // Step 2: Upload directly to cloud storage
      toast.loading('Uploading to cloud storage...', { id: 'upload-toast' });

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      setUploadProgress(70);

      // Step 3: Notify server of successful upload
      toast.loading('Verifying upload...', { id: 'upload-toast' });

      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          publicUrl,
        }),
      });

      const completeData = await completeResponse.json();

      if (!completeData.success) {
        throw new Error(completeData.message || 'Failed to complete upload');
      }

      setUploadProgress(100);
      toast.success('File uploaded successfully!', { id: 'upload-toast' });

      // Reset and reload
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      loadUploadHistory();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed', { id: 'upload-toast' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleDelete(fileId: string) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/upload/complete?id=${fileId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('File deleted successfully');
        loadUploadHistory();
      } else {
        toast.error(data.message || 'Failed to delete file');
      }
    } catch (error) {
      toast.error('Failed to delete file');
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Cloud Storage Upload Test
          </h1>
          <p className="text-lg text-gray-600">
            Test file uploads to {config?.provider === 'aws' ? 'AWS S3' : 'Azure Blob Storage'}
          </p>
        </div>

        {/* Configuration Info */}
        {config && (
          <>
            {/* Warning Banner if not configured */}
            {!config.configured && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6 rounded-r-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Storage Not Configured</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>{config.configMessage}</p>
                      <p className="mt-2">To set up cloud storage:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {config.provider === 'aws' ? (
                          <>
                            <li>Run: <code className="bg-yellow-100 px-2 py-1 rounded">./scripts/setup-aws-s3.sh</code></li>
                            <li>Or manually configure AWS credentials in .env file</li>
                          </>
                        ) : (
                          <>
                            <li>Run: <code className="bg-yellow-100 px-2 py-1 rounded">./scripts/setup-azure-blob.sh</code></li>
                            <li>Or manually configure Azure credentials in .env file</li>
                          </>
                        )}
                        <li>Restart the dev server after configuration</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Provider</p>
                <p className="text-lg text-gray-900">{config.provider.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Max File Size</p>
                <p className="text-lg text-gray-900">{config.maxFileSizeMB} MB</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-2">Allowed File Types</p>
                <div className="flex flex-wrap gap-2">
                  {config.allowedTypes.slice(0, 8).map((type) => (
                    <span
                      key={type}
                      className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded"
                    >
                      {type.split('/')[1]}
                    </span>
                  ))}
                  {config.allowedTypes.length > 8 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      +{config.allowedTypes.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          </>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload File</h2>
          
          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:border-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            {/* Selected File Info */}
            {selectedFile && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-indigo-900 mb-2">Selected File</h3>
                <div className="space-y-1 text-sm text-indigo-700">
                  <p><span className="font-medium">Name:</span> {selectedFile.name}</p>
                  <p><span className="font-medium">Type:</span> {selectedFile.type}</p>
                  <p><span className="font-medium">Size:</span> {formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-indigo-700">Uploading...</span>
                  <span className="text-sm font-medium text-indigo-700">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading || !config?.configured}
              className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : !config?.configured ? 'Storage Not Configured' : 'Upload to Cloud Storage'}
            </button>
          </div>
        </div>

        {/* Upload History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Uploads</h2>
            <button
              onClick={loadUploadHistory}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Refresh
            </button>
          </div>

          {uploadedFiles.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No uploads yet</p>
          ) : (
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{file.name}</h3>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">How It Works</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Select a file from your device</li>
            <li>Click "Upload to Cloud Storage"</li>
            <li>API generates a presigned URL (15 min expiry)</li>
            <li>File uploads directly to {config?.provider === 'aws' ? 'S3' : 'Azure Blob'}</li>
            <li>Server verifies and saves metadata</li>
            <li>View or delete uploaded files</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
