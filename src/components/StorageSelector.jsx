import React, { useState } from 'react';
import { FolderOpen, Cloud, Loader2 } from 'lucide-react';
import GoogleDriveConfigModal from './modals/GoogleDriveConfigModal.jsx';

/**
 * Storage Selector Component
 * Allows users to choose between local files and Google Drive storage
 */
const StorageSelector = ({ onStorageSelect, availableOptions = [], error, isLoading }) => {
  const [showGoogleDriveModal, setShowGoogleDriveModal] = useState(false);

  const getIcon = (type) => {
    switch (type) {
      case 'googledrive':
        return <Cloud className="w-8 h-8" />;
      case 'filesystem':
        return <FolderOpen className="w-8 h-8" />;
      default:
        return <FolderOpen className="w-8 h-8" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <img src="./logo_white.svg" alt="Media Tracker logo" className="w-40 h-40 mx-auto mb-6 object-contain" />
      <h2 className="text-3xl font-bold mb-4">Welcome to Markdown Media Tracker</h2>
      <p className="text-slate-400 mb-12 max-w-2xl mx-auto">
        Choose where to store your book and movie markdown files. Each item will be saved as a separate .md file with YAML frontmatter.
      </p>

      {error && (
        <div className="mb-8 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200">
          <p className="font-medium">Connection Error</p>
          <p className="text-sm">{error}</p>
          {error.includes('popup') && (
            <div className="mt-3 text-xs space-y-1">
              <p className="font-medium">Troubleshooting tips:</p>
              <p>• Disable popup blockers for this site</p>
              <p>• Try using an incognito/private window</p>
              <p>• Clear browser cache and cookies</p>
            </div>
          )}
          {error.includes('authorized origins') && (
            <div className="mt-3 text-xs space-y-1">
              <p className="font-medium">To fix this:</p>
              <p>• Go to Google Cloud Console → Credentials</p>
              <p>• Add http://localhost:5173 to authorized origins</p>
              <p>• See GOOGLE_DRIVE_SETUP.md for detailed instructions</p>
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {availableOptions.map((option) => (
          <div key={option.type}>
            <button
              onClick={() => {
                if (!isLoading) {
                  if (option.type === 'googledrive') {
                    setShowGoogleDriveModal(true);
                  } else {
                    onStorageSelect(option.type);
                  }
                }
              }}
              disabled={!option.supported || isLoading}
              className={`
                w-full p-8 rounded-xl border-2 transition-all duration-200 text-left
                ${option.supported 
                  ? 'border-slate-600 hover:border-purple-500 hover:bg-slate-800/50 cursor-pointer' 
                  : 'border-slate-700 bg-slate-800/30 cursor-not-allowed opacity-50'
                }
                ${isLoading ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <div className="flex items-center gap-4 mb-4">
                {getIcon(option.type)}
                <div>
                  <h3 className="text-xl font-semibold text-white">{option.name}</h3>
                  {!option.supported && (
                    <span className="text-sm text-red-400">Not supported on this device</span>
                  )}
                </div>
              </div>
              
              <p className="text-slate-300 text-sm leading-relaxed">
                {option.description}
              </p>

            <div className="mt-6 space-y-2 text-xs text-slate-400">
              {option.type === 'filesystem' && (
                <div className="space-y-1">
                  <p>✓ Files stored locally on your device</p>
                  <p>✓ Works offline</p>
                  <p>✓ Full control over your data</p>
                  <p className="text-amber-400">⚠ Desktop browsers only (Chrome, Edge, Opera)</p>
                </div>
              )}
              
              {option.type === 'googledrive' && (
                <div className="space-y-1">
                  <p>✓ Access from any device</p>
                  <p>✓ Automatic cloud backup</p>
                  <p>✓ Works on mobile devices</p>
                  <p className="text-blue-400">ℹ Requires Google account</p>
                  <p className="text-amber-400">⚠ Allow popups when prompted</p>
                </div>
              )}
            </div>

            {isLoading && (
              <div className="mt-4 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="ml-2 text-sm">Connecting...</span>
              </div>
            )}
            </button>
          </div>
        ))}
      </div>

      {availableOptions.length === 0 && !isLoading && (
        <div className="mt-8 p-6 bg-slate-800/50 rounded-lg">
          <p className="text-slate-400">
            No storage options are available on this device. Please use a supported browser or check your configuration.
          </p>
        </div>
      )}

      <div className="mt-12 p-6 bg-slate-800/30 rounded-lg max-w-2xl mx-auto">
        <h4 className="text-lg font-semibold mb-3 text-white">Need help choosing?</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-300">
          <div>
            <p className="font-medium text-white mb-2">Choose Local Files if:</p>
            <ul className="space-y-1 text-xs">
              <li>• You primarily use desktop/laptop</li>
              <li>• You prefer local data control</li>
              <li>• You don't need mobile access</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-white mb-2">Choose Google Drive if:</p>
            <ul className="space-y-1 text-xs">
              <li>• You want mobile/tablet access</li>
              <li>• You use multiple devices</li>
              <li>• You want automatic backup</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Google Drive Configuration Modal */}
      {showGoogleDriveModal && (
        <GoogleDriveConfigModal
          onClose={() => setShowGoogleDriveModal(false)}
          onConnect={() => {
            setShowGoogleDriveModal(false);
            onStorageSelect('googledrive');
          }}
        />
      )}
    </div>
  );
};

export default StorageSelector;