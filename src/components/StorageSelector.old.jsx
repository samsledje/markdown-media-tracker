import React, { useState, useEffect } from 'react';
import { FolderOpen, Cloud, AlertCircle, Loader2 } from 'lucide-react';

const StorageSelector = ({ onStorageSelect, availableOptions, error, isLoading }) => {
  const [selectedType, setSelectedType] = useState(null);

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'FolderOpen':
        return FolderOpen;
      case 'Cloud':
        return Cloud;
      default:
        return FolderOpen;
    }
  };

  const handleConnect = async () => {
    if (selectedType) {
      await onStorageSelect(selectedType);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Markdown Media Tracker
          </h1>
          <p className="text-gray-600">
            Choose how you'd like to store your media collection
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {availableOptions.map((option) => {
            const IconComponent = getIcon(option.icon);
            return (
              <button
                key={option.type}
                onClick={() => setSelectedType(option.type)}
                disabled={!option.supported || isLoading}
                className={`w-full p-4 border rounded-lg text-left transition-colors ${
                  selectedType === option.type
                    ? 'border-blue-500 bg-blue-50'
                    : option.supported
                    ? 'border-gray-200 hover:border-gray-300 bg-white'
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent 
                    className={`w-5 h-5 ${
                      option.supported ? 'text-gray-700' : 'text-gray-400'
                    }`} 
                  />
                  <div className="flex-1">
                    <div className={`font-medium ${
                      option.supported ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {option.name}
                      {!option.supported && (
                        <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          Not Available
                        </span>
                      )}
                    </div>
                    <div className={`text-sm ${
                      option.supported ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {option.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {!availableOptions.some(opt => opt.supported) && (
          <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertCircle className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-yellow-800">
              Your browser doesn't support any of the available storage options. 
              Please use a modern browser like Chrome, Edge, or Safari.
            </p>
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={!selectedType || isLoading || !availableOptions.find(opt => opt.type === selectedType)?.supported}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect'
          )}
        </button>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Your data stays private and is only stored in the location you choose
          </p>
        </div>
      </div>
    </div>
  );
};

export default StorageSelector;