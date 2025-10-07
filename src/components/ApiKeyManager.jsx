import React, { useState, useEffect } from 'react';
import { Key, Save, ExternalLink } from 'lucide-react';
import { saveConfig, getConfig, hasApiKey } from '../config.js';

const ApiKeyManager = ({ onApiKeyChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Load current API key
    const currentKey = getConfig('omdbApiKey');
    setApiKey(currentKey || '');
    
    // Show the manager if no API key is configured
    setIsVisible(!hasApiKey());
  }, []);

  const handleSave = () => {
    const success = saveConfig({ omdbApiKey: apiKey.trim() });
    
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      // Notify parent component that API key changed
      if (onApiKeyChange) {
        onApiKeyChange(apiKey.trim());
      }
      
      // Hide the manager if we now have an API key
      if (apiKey.trim()) {
        setIsVisible(false);
      }
    }
  };

  const handleShow = () => {
    setIsVisible(true);
  };

  const handleHide = () => {
    // Only allow hiding if we have an API key
    if (hasApiKey()) {
      setIsVisible(false);
    }
  };

  if (!isVisible) {
    return (
      <div className="mb-4">
        <button
          onClick={handleShow}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Key className="w-4 h-4" />
          Manage API Key
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Key className="w-5 h-5 text-yellow-600" />
        <h3 className="font-semibold text-yellow-800">OMDB API Key Required</h3>
      </div>
      
      <p className="text-sm text-yellow-700 mb-4">
        To search for movies and books online, you need to provide an OMDB API key. 
        This will be stored securely in your browser.
      </p>
      
      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your OMDB API key"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
        
        {showSuccess && (
          <p className="text-sm text-green-600 font-medium">
            ✓ API key saved successfully!
          </p>
        )}
      </div>
      
      <div className="text-sm text-yellow-700">
        <p className="mb-2">
          <strong>Don't have an API key?</strong> Get one for free:
        </p>
        <ol className="list-decimal list-inside space-y-1 mb-3">
          <li>Visit <a href="http://www.omdbapi.com/apikey.aspx" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">OMDb API <ExternalLink className="w-3 h-3" /></a></li>
          <li>Enter your email and request a free API key</li>
          <li>Check your email for the API key</li>
          <li>Paste it above and click Save</li>
        </ol>
      </div>
      
      {hasApiKey() && (
        <button
          onClick={handleHide}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Hide this panel
        </button>
      )}
    </div>
  );
};

export default ApiKeyManager;