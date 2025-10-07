import { StorageAdapter } from './storageAdapter.js';
import { parseMarkdown, generateMarkdown } from '../utils/markdownUtils.js';
import { getConfig } from '../config.js';

/**
 * Google Drive Storage Adapter using Google Identity Services (newer, more reliable)
 * Implements storage operations using Google Drive API
 */
export class GoogleDriveStorageGIS extends StorageAdapter {
  constructor() {
    super();
    this.isInitialized = false;
    this.isSignedIn = false;
    this.accessToken = null;
    this.mediaTrackerFolderId = null;
    this.trashFolderId = null;
    
    // Google API configuration
    this.CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    this.API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
    this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
  }

  static isSupported() {
    return typeof window !== 'undefined' && !!window.fetch;
  }

  getStorageType() {
    return 'googledrive';
  }

  async initialize() {
    if (this.isInitialized) return true;

    try {
      if (!this.CLIENT_ID || !this.API_KEY) {
        const isDev = import.meta.env.DEV;
        const missingVars = [];
        if (!this.CLIENT_ID) missingVars.push('VITE_GOOGLE_CLIENT_ID');
        if (!this.API_KEY) missingVars.push('VITE_GOOGLE_API_KEY');
        
        const errorMessage = isDev 
          ? `Google API credentials not configured. Missing: ${missingVars.join(', ')}. Please check your .env.local file.`
          : `Google API credentials not configured. Missing: ${missingVars.join(', ')}. This might be a deployment configuration issue.`;
        
        throw new Error(errorMessage);
      }

      console.log('Initializing Google Identity Services...');

      // Suppress COOP warnings in development
      if (import.meta.env.DEV) {
        const originalWarn = console.warn;
        console.warn = (message, ...args) => {
          if (typeof message === 'string' && message.includes('Cross-Origin-Opener-Policy')) {
            return; // Suppress COOP warnings in development
          }
          originalWarn(message, ...args);
        };
      }

      // Load Google Identity Services
      await this._loadGoogleIdentityServices();
      
      // Initialize the Google API client for Drive API calls
      await this._loadGoogleAPI();
      await window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: this.API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
        });
      });

      this.isInitialized = true;
      console.log('Google Identity Services initialization complete');
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Identity Services:', error);
      return false;
    }
  }

  async _loadGoogleIdentityServices() {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        console.log('Google Identity Services loaded');
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load Google Identity Services:', error);
        reject(new Error('Failed to load Google Identity Services'));
      };
      document.head.appendChild(script);
    });
  }

  async _loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        console.log('Google API script loaded');
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load Google API script:', error);
        reject(new Error('Failed to load Google API script'));
      };
      document.head.appendChild(script);
    });
  }

  isConnected() {
    return this.isInitialized && this.isSignedIn && !!this.accessToken && !!this.mediaTrackerFolderId;
  }

  getStorageInfo() {
    if (!this.isConnected()) return null;
    
    const folderName = getConfig('googleDriveFolderName') || 'MediaTracker';
    return `Google Drive - ${folderName} folder`;
  }

  async selectStorage() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      console.log('Starting Google Sign-In with Identity Services...');
      
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: this.CLIENT_ID,
        scope: this.SCOPES,
        callback: async (tokenResponse) => {
          try {
            console.log('Token received:', !!tokenResponse.access_token);
            this.accessToken = tokenResponse.access_token;
            this.isSignedIn = true;

            // Set the access token for gapi client
            window.gapi.client.setToken({ access_token: this.accessToken });

            await this._initializeFolders();
            
            localStorage.setItem('googleDriveConnected', 'true');
            localStorage.setItem('googleDriveFolderId', this.mediaTrackerFolderId);
            
            const folderName = getConfig('googleDriveFolderName') || 'MediaTracker';
            resolve({
              folderId: this.mediaTrackerFolderId,
              folderName: folderName
            });
          } catch (error) {
            console.error('Error after token received:', error);
            reject(new Error(`Failed to initialize Google Drive: ${error.message}`));
          }
        },
        error_callback: (error) => {
          console.error('OAuth error:', error);
          if (error.type === 'popup_closed') {
            reject(new Error('Sign-in popup was closed. Please try again.'));
          } else {
            reject(new Error(`Authentication failed: ${error.type || 'Unknown error'}`));
          }
        }
      });

      // Request access token
      client.requestAccessToken();
    });
  }

  async disconnect() {
    if (this.accessToken) {
      window.google.accounts.oauth2.revoke(this.accessToken);
    }
    
    this.isSignedIn = false;
    this.accessToken = null;
    this.mediaTrackerFolderId = null;
    this.trashFolderId = null;
    
    localStorage.removeItem('googleDriveConnected');
    localStorage.removeItem('googleDriveFolderId');
  }

  // Rest of the methods remain the same as the original implementation
  async _initializeFolders() {
    try {
      // Get configured folder name, fallback to 'MediaTracker' for backward compatibility
      const folderName = getConfig('googleDriveFolderName') || 'MediaTracker';
      
      this.mediaTrackerFolderId = await this._findOrCreateFolder(folderName);
      this.trashFolderId = await this._findOrCreateFolder('.trash', this.mediaTrackerFolderId);
    } catch (error) {
      console.error('Error initializing Google Drive folders:', error);
      throw error;
    }
  }

  async _findOrCreateFolder(name, parentId = null) {
    try {
      let query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      if (parentId) {
        query += ` and '${parentId}' in parents`;
      } else {
        query += ` and parents in 'root'`;
      }

      const searchResponse = await window.gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name)'
      });

      if (searchResponse.result.files.length > 0) {
        return searchResponse.result.files[0].id;
      }

      const folderMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : ['root']
      };

      const createResponse = await window.gapi.client.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      return createResponse.result.id;
    } catch (error) {
      console.error(`Error finding/creating folder ${name}:`, error);
      throw error;
    }
  }

  async loadItems() {
    if (!this.isConnected()) {
      throw new Error('Not connected to Google Drive');
    }

    try {
      const response = await window.gapi.client.drive.files.list({
        q: `'${this.mediaTrackerFolderId}' in parents and name contains '.md' and trashed=false`,
        fields: 'files(id, name, modifiedTime)',
        orderBy: 'modifiedTime desc'
      });

      const items = [];
      
      for (const file of response.result.files) {
        try {
          const content = await this._downloadFile(file.id);
          const { metadata, body } = parseMarkdown(content);
          
          items.push({
            id: file.name.replace('.md', ''),
            filename: file.name,
            fileId: file.id,
            title: metadata.title || 'Untitled',
            type: metadata.type || 'book',
            author: metadata.author,
            director: metadata.director,
            actors: metadata.actors || [],
            isbn: metadata.isbn,
            year: metadata.year,
            rating: metadata.rating,
            tags: metadata.tags || [],
            coverUrl: metadata.coverUrl,
            dateRead: metadata.dateRead,
            dateWatched: metadata.dateWatched,
            dateAdded: metadata.dateAdded,
            review: body
          });
        } catch (error) {
          console.error(`Error loading file ${file.name}:`, error);
        }
      }

      return items.sort((a, b) => 
        new Date(b.dateAdded) - new Date(a.dateAdded)
      );
    } catch (error) {
      console.error('Error loading items from Google Drive:', error);
      throw new Error(`Failed to load items: ${error.message}`);
    }
  }

  async _downloadFile(fileId) {
    try {
      const response = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });
      return response.body;
    } catch (error) {
      console.error(`Error downloading file ${fileId}:`, error);
      throw error;
    }
  }

  async saveItem(item) {
    if (!this.isConnected()) {
      throw new Error('Not connected to Google Drive');
    }

    try {
      const filename = item.filename || `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.md`;
      const content = generateMarkdown(item);
      
      if (item.fileId) {
        await this._updateFile(item.fileId, content, filename);
      } else {
        const fileId = await this._createFile(filename, content, this.mediaTrackerFolderId);
        item.fileId = fileId;
      }
    } catch (error) {
      console.error('Error saving item to Google Drive:', error);
      throw new Error(`Failed to save item: ${error.message}`);
    }
  }

  async _createFile(name, content, parentId) {
    try {
      const metadata = {
        name: name,
        parents: [parentId]
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
      form.append('file', new Blob([content], {type: 'text/markdown'}));

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: form
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  }

  async _updateFile(fileId, content, name = null) {
    try {
      const metadata = name ? { name } : {};
      
      const form = new FormData();
      if (Object.keys(metadata).length > 0) {
        form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
      }
      form.append('file', new Blob([content], {type: 'text/markdown'}));

      const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: form
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating file:', error);
      throw error;
    }
  }

  async deleteItem(item) {
    if (!this.isConnected()) {
      throw new Error('Not connected to Google Drive');
    }

    try {
      if (!item.fileId) {
        throw new Error('Item does not have a Google Drive file ID');
      }

      await window.gapi.client.drive.files.update({
        fileId: item.fileId,
        addParents: this.trashFolderId,
        removeParents: this.mediaTrackerFolderId,
        fields: 'id, parents'
      });

      return {
        fileId: item.fileId,
        filename: item.filename,
        fromFolder: this.mediaTrackerFolderId,
        toFolder: this.trashFolderId
      };
    } catch (error) {
      console.error('Error deleting item from Google Drive:', error);
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }

  async restoreItem(undoInfo) {
    if (!this.isConnected()) {
      throw new Error('Not connected to Google Drive');
    }

    try {
      await window.gapi.client.drive.files.update({
        fileId: undoInfo.fileId,
        addParents: undoInfo.fromFolder,
        removeParents: undoInfo.toFolder,
        fields: 'id, parents'
      });

      return undoInfo.filename;
    } catch (error) {
      console.error('Error restoring item from Google Drive:', error);
      throw new Error(`Failed to restore item: ${error.message}`);
    }
  }

  // Method to check if a folder name is available or conflicts exist
  async checkFolderAvailability(folderName) {
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false and parents in 'root'&fields=files(id,name,modifiedTime)`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const existingFolders = data.files || [];
      
      return {
        isAvailable: existingFolders.length === 0,
        existingFolders: existingFolders,
        recommendation: existingFolders.length > 0 
          ? `A folder named "${folderName}" already exists. The app will use this existing folder.`
          : `A new folder named "${folderName}" will be created.`
      };
    } catch (error) {
      console.error('Error checking folder availability:', error);
      return {
        isAvailable: false,
        existingFolders: [],
        recommendation: 'Unable to check folder availability. The app will attempt to use or create the folder.'
      };
    }
  }

  // Method to check if there are files in a specific folder
  async checkFolderContents(folderId) {
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and name contains '.md' and trashed=false&fields=files(id,name)&pageSize=10`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const files = data.files || [];

      return {
        hasFiles: files.length > 0,
        fileCount: files.length,
        files: files
      };
    } catch (error) {
      console.error('Error checking folder contents:', error);
      return {
        hasFiles: false,
        fileCount: 0,
        files: []
      };
    }
  }

  // Method to get information about current vs new folder for migration warnings
  async getMigrationInfo(newFolderName) {
    try {
      const currentFolderName = getConfig('googleDriveFolderName') || 'MediaTracker';
      
      // If the folder name isn't changing, no migration needed
      if (currentFolderName === newFolderName) {
        return {
          migrationNeeded: false,
          currentFolder: { name: currentFolderName, hasFiles: false },
          newFolder: { name: newFolderName, exists: true }
        };
      }

      // Check current folder contents
      let currentFolderInfo = { name: currentFolderName, hasFiles: false, fileCount: 0 };
      if (this.mediaTrackerFolderId) {
        const currentContents = await this.checkFolderContents(this.mediaTrackerFolderId);
        currentFolderInfo.hasFiles = currentContents.hasFiles;
        currentFolderInfo.fileCount = currentContents.fileCount;
      }

      // Check if new folder exists and its contents
      const newFolderAvailability = await this.checkFolderAvailability(newFolderName);
      let newFolderInfo = { 
        name: newFolderName, 
        exists: !newFolderAvailability.isAvailable,
        hasFiles: false,
        fileCount: 0
      };

      if (newFolderAvailability.existingFolders.length > 0) {
        const newFolderId = newFolderAvailability.existingFolders[0].id;
        const newContents = await this.checkFolderContents(newFolderId);
        newFolderInfo.hasFiles = newContents.hasFiles;
        newFolderInfo.fileCount = newContents.fileCount;
      }

      return {
        migrationNeeded: true,
        currentFolder: currentFolderInfo,
        newFolder: newFolderInfo,
        recommendation: this._getMigrationRecommendation(currentFolderInfo, newFolderInfo)
      };
    } catch (error) {
      console.error('Error getting migration info:', error);
      return {
        migrationNeeded: false,
        currentFolder: { name: 'Unknown', hasFiles: false },
        newFolder: { name: newFolderName, exists: false },
        recommendation: 'Unable to check migration requirements.'
      };
    }
  }

  _getMigrationRecommendation(currentFolder, newFolder) {
    if (!currentFolder.hasFiles && !newFolder.hasFiles) {
      return 'No files will be affected. The app will start using the new folder.';
    } else if (currentFolder.hasFiles && !newFolder.hasFiles) {
      return `Your ${currentFolder.fileCount} files will remain in the "${currentFolder.name}" folder. You'll need to manually move them to "${newFolder.name}" if you want to keep them.`;
    } else if (!currentFolder.hasFiles && newFolder.hasFiles) {
      return `The app will start using the existing "${newFolder.name}" folder which contains ${newFolder.fileCount} files.`;
    } else {
      return `Both folders contain files. Your current ${currentFolder.fileCount} files will remain in "${currentFolder.name}". The app will switch to "${newFolder.name}" which contains ${newFolder.fileCount} files.`;
    }
  }
}