'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: number;
    name: string;
    url: string;
    size: number;
    type: string;
    userId: number;
    createdAt: string;
    updatedAt: string;
  }>>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('');
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus('Generating pre-signed URL...');

    try {
      // Step 1: Get pre-signed URL
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setUploadStatus(`Error: ${data.message}`);
        return;
      }

      setUploadStatus('Uploading file to S3...');

      // Step 2: Upload file using pre-signed URL
      const uploadRes = await fetch(data.uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile,
      });

      if (!uploadRes.ok) {
        setUploadStatus('Upload failed');
        return;
      }

      setUploadStatus('Storing file metadata...');

      // Step 3: Store file metadata in database
      const storeRes = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileKey: data.fileKey,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
        }),
      });

      const storeData = await storeRes.json();

      if (storeData.success) {
        setUploadStatus('File uploaded successfully!');
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        // Refresh file list
        fetchFiles();
      } else {
        setUploadStatus(`Error storing metadata: ${storeData.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      if (data.success) {
        setUploadedFiles(data.files);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  // Fetch files on component mount
  useState(() => {
    fetchFiles();
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">File Upload with AWS S3</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload New File</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              id="file-input"
              type="file"
              onChange={handleFileSelect}
              accept="image/*,.pdf"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {selectedFile && (
            <div className="bg-gray-50 p-4 rounded">
              <p><strong>File:</strong> {selectedFile.name}</p>
              <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              <p><strong>Type:</strong> {selectedFile.type}</p>
            </div>
          )}

          <button
            onClick={uploadFile}
            disabled={!selectedFile || uploading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>

          {uploadStatus && (
            <p className={`mt-4 p-2 rounded ${
              uploadStatus.includes('successfully')
                ? 'bg-green-100 text-green-800'
                : uploadStatus.includes('Error') || uploadStatus.includes('failed')
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {uploadStatus}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>

        {uploadedFiles.length === 0 ? (
          <p className="text-gray-500">No files uploaded yet.</p>
        ) : (
          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="border rounded p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    Size: {(file.size / 1024 / 1024).toFixed(2)} MB •
                    Type: {file.type} •
                    Uploaded: {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  View File
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}