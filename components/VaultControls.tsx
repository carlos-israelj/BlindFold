'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useVault } from '@/contexts/VaultContext';
import { exportPortfolioData } from '@/lib/portfolio';

interface VaultFile {
  cid: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

export default function VaultControls() {
  const { portfolio, accountId } = useWallet();
  const { vaultId, isInitialized, portfolioCID, chatCIDs } = useVault();
  const [inspecting, setInspecting] = useState(false);
  const [vaultData, setVaultData] = useState<any>(null);
  const [files, setFiles] = useState<VaultFile[]>([]);

  const handleInspect = async () => {
    if (!vaultId || !accountId) return;

    setInspecting(true);
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          action: 'inspect',
          vaultId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setVaultData(data.data);
        setFiles(data.data.files || []);
      }
    } catch (error) {
      console.error('Error inspecting vault:', error);
    } finally {
      setInspecting(false);
    }
  };

  const handleExport = () => {
    if (!portfolio) return;

    const data = exportPortfolioData(portfolio);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blindfold-export-${accountId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!vaultId || !accountId) return;

    const confirmed = confirm(
      'Are you sure you want to delete your vault? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          action: 'delete',
          vaultId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Vault deleted successfully');
        window.location.href = '/';
      } else {
        alert(data.error || 'Failed to delete vault');
      }
    } catch (error: any) {
      console.error('Error deleting vault:', error);
      alert(error.message || 'Failed to delete vault');
    }
  };

  if (!isInitialized) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500">Vault not initialized</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vault Info */}
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">🗄️</span>
          Vault Information
        </h2>

        <div className="space-y-3 text-sm">
          <div>
            <div className="font-medium text-gray-700">Vault ID</div>
            <div className="font-mono text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1 break-all">
              {vaultId}
            </div>
          </div>

          {portfolioCID && (
            <div>
              <div className="font-medium text-gray-700">Portfolio CID</div>
              <div className="font-mono text-xs text-green-600 bg-green-50 p-2 rounded mt-1 break-all">
                {portfolioCID}
              </div>
            </div>
          )}

          {chatCIDs && chatCIDs.length > 0 && (
            <div>
              <div className="font-medium text-gray-700">Chat History CIDs ({chatCIDs.length})</div>
              <div className="space-y-1 mt-1">
                {chatCIDs.map((cid, index) => (
                  <div key={index} className="font-mono text-xs text-blue-600 bg-blue-50 p-2 rounded break-all">
                    {cid}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-gray-200">
            <div className="text-green-700 font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Vault Active & Encrypted (AES-256-GCM)
            </div>
          </div>
        </div>
      </div>

      {/* Vault Actions */}
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Vault Actions</h2>

        <div className="space-y-2">
          <button
            onClick={handleInspect}
            disabled={inspecting}
            className="w-full px-4 py-3 text-left font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:bg-gray-50 flex items-center gap-3"
          >
            <span className="text-xl">🔍</span>
            <div className="flex-1">
              <div>{inspecting ? 'Loading...' : 'Inspect Vault Data'}</div>
              <div className="text-xs font-normal text-gray-500">View all files stored in vault</div>
            </div>
          </button>

          <button
            onClick={handleExport}
            className="w-full px-4 py-3 text-left font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-3"
          >
            <span className="text-xl">📥</span>
            <div className="flex-1">
              <div>Export Portfolio & Chat History</div>
              <div className="text-xs font-normal text-blue-600">Download decrypted JSON file</div>
            </div>
          </button>

          <button
            onClick={handleDelete}
            className="w-full px-4 py-3 text-left font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-3"
          >
            <span className="text-xl">🗑️</span>
            <div className="flex-1">
              <div>Delete Vault</div>
              <div className="text-xs font-normal text-red-600">Permanently remove all data</div>
            </div>
          </button>
        </div>
      </div>

      {/* Vault Files */}
      {vaultData && (
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-md font-semibold mb-4">Vault Contents</h3>

          {files.length > 0 ? (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{file.filename}</div>
                      <div className="font-mono text-xs text-gray-600 mt-1 break-all">
                        CID: {file.cid}
                      </div>
                      {file.uploadedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                    {file.size && (
                      <div className="text-xs text-gray-500 ml-2">
                        {(file.size / 1024).toFixed(2)} KB
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📁</div>
              <p>No files found in vault</p>
              <p className="text-xs mt-1">Files list may not be available in current NOVA SDK version</p>
            </div>
          )}

          {vaultData.filesCount !== undefined && (
            <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
              Total files: {vaultData.filesCount}
            </div>
          )}
        </div>
      )}

      {/* Privacy Notice */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex gap-3">
          <div className="text-2xl">🔒</div>
          <div>
            <div className="font-semibold text-green-900 mb-1">Privacy Guaranteed</div>
            <div className="text-sm text-green-700">
              All data is encrypted with AES-256-GCM before upload. Keys are managed in Shade TEE on Phala Cloud.
              Only you can decrypt this data.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
