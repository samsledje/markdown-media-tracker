import React, { useState } from 'react';
import { Cloud, FolderOpen, Wifi, WifiOff, Settings } from 'lucide-react';

/**
 * Compact Storage Indicator Component
 * Shows storage status in bottom right, expandable on click
 */
const StorageIndicator = ({ storageAdapter, storageInfo, onSwitchStorage }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!storageAdapter) return null;

  const isConnected = storageAdapter.isConnected();
  const storageType = storageAdapter.getStorageType();

  const getIcon = () => {
    if (storageType === 'googledrive') {
      return isConnected ? <Cloud className="w-4 h-4" /> : <Cloud className="w-4 h-4 opacity-50" />;
    }
    return isConnected ? <FolderOpen className="w-4 h-4" /> : <FolderOpen className="w-4 h-4 opacity-50" />;
  };

  const getStatusIcon = () => {
    return isConnected ? 
      <Wifi className="w-3 h-3 text-green-400" /> : 
      <WifiOff className="w-3 h-3 text-red-400" />;
  };

  const getStatusColor = () => {
    if (!isConnected) return 'border-red-500/30 bg-red-500/10';
    if (storageType === 'googledrive') return 'border-blue-500/30 bg-blue-500/10';
    return 'border-green-500/30 bg-green-500/10';
  };

  const getDisplayName = () => {
    if (!isConnected) return 'Disconnected';
    if (storageType === 'googledrive') return 'Google Drive';
    return 'Local Files';
  };

  const getDetailedInfo = () => {
    if (!storageInfo) return 'No storage connected';
    return storageInfo;
  };

  return (
    <div className="relative">
      {/* Compact indicator button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all duration-200
          ${getStatusColor()}
          hover:bg-opacity-20 active:scale-95
        `}
        title={`Storage: ${getDisplayName()}`}
      >
        {getIcon()}
        {getStatusIcon()}
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsExpanded(false)}
          />
          
          {/* Panel */}
          <div className="absolute bottom-full right-0 mb-2 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className={`px-4 py-3 border-b border-slate-600 ${
              storageType === 'googledrive' ? 'bg-blue-500/10' : 'bg-green-500/10'
            }`}>
              <div className="flex items-center gap-2">
                {getIcon()}
                <div className="flex-1">
                  <div className="font-medium text-white">{getDisplayName()}</div>
                  <div className="flex items-center gap-1 text-xs text-slate-300">
                    {getStatusIcon()}
                    <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Storage info */}
              <div>
                <div className="text-xs text-slate-400 mb-1">Location</div>
                <div className="text-sm text-slate-200 break-all">
                  {getDetailedInfo()}
                </div>
              </div>

              {/* Storage type info */}
              <div>
                <div className="text-xs text-slate-400 mb-1">Type</div>
                <div className="text-sm text-slate-200">
                  {storageType === 'googledrive' ? 'Cloud Storage' : 'Local Storage'}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-600">
                <button
                  onClick={() => {
                    setIsExpanded(false);
                    onSwitchStorage();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Switch Storage
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StorageIndicator;