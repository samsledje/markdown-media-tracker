import { StorageAdapter } from './storageAdapter.js';
import { parseMarkdown, generateMarkdown } from '../utils/markdownUtils.js';

/**
 * Google Drive Storage Adapter
 * Implements storage operations using Google Drive API
 */
export class GoogleDriveStorage extends StorageAdapter {
  constructor() {
    super();
    this.isInitialized = false;
    this.isSignedIn = false;
    this.mediaTrackerFolderId = null;
    this.trashFolderId = null;
    this.gapi = null;
    
    // Google API configuration
    this.CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    this.API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
    this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
    this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
  }

  static isSupported() {
    // Google Drive API is supported in all modern browsers
    return typeof window !== 'undefined' && !!window.fetch;
  }

  getStorageType() {
    return 'googledrive';
  }

  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Check if environment variables are set
      if (!this.CLIENT_ID || !this.API_KEY) {
        throw new Error('Google API credentials not configured. Please check your .env.local file.');
      }

      console.log('Initializing Google Drive API...');
      console.log('Client ID configured:', !!this.CLIENT_ID);
      console.log('API Key configured:', !!this.API_KEY);

      // Load Google API library if not already loaded
      if (typeof window.gapi === 'undefined') {
        console.log('Loading Google API library...');
        await this._loadGoogleAPI();
      }

      this.gapi = window.gapi;
      console.log('Google API library loaded');
      
      // Initialize Google API client - wrap gapi.load in Promise
      await new Promise((resolve, reject) => {
        console.log('Loading gapi client and auth2...');
        this.gapi.load('client:auth2', async () => {
          try {
            console.log('Initializing gapi client...');
            await this.gapi.client.init({
              apiKey: this.API_KEY,
              clientId: this.CLIENT_ID,
              discoveryDocs: [this.DISCOVERY_DOC],
              scope: this.SCOPES
            });

            console.log('gapi client initialized');

            // Initialize auth2 separately to handle initialization errors
            try {
              await this.gapi.auth2.init({
                client_id: this.CLIENT_ID,
                scope: this.SCOPES
              });
              console.log('auth2 initialized successfully');
            } catch (authError) {
              console.warn('auth2 initialization failed, but continuing:', authError);
              // Continue even if auth2 init fails - we'll handle it in selectStorage
            }

            // Check if user is already signed in
            const authInstance = this.gapi.auth2.getAuthInstance();
            if (authInstance) {
              this.isSignedIn = authInstance.isSignedIn.get();
              console.log('Auth instance found, signed in:', this.isSignedIn);
              
              if (this.isSignedIn) {
                await this._initializeFolders();
              }
            } else {
              console.log('Auth instance not available');
            }

            this.isInitialized = true;
            console.log('Google Drive API initialization complete');
            resolve();
          } catch (initError) {
            console.error('Error during gapi client init:', initError);
            reject(initError);
          }
        });
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize Google Drive API:', error);
      return false;
    }
  }

  async _loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
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
    return this.isInitialized && this.isSignedIn && !!this.mediaTrackerFolderId;
  }

  getStorageInfo() {
    if (!this.isConnected()) return null;
    
    const authInstance = this.gapi.auth2.getAuthInstance();
    const user = authInstance.currentUser.get();
    const profile = user.getBasicProfile();
    
    return `Google Drive (${profile.getEmail()}) - MediaTracker folder`;
  }

  async selectStorage() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      let authInstance = this.gapi.auth2.getAuthInstance();
      
      // If auth instance is null, try to initialize it again
      if (!authInstance) {
        console.log('Auth instance not found, reinitializing...');
        try {
          authInstance = await this.gapi.auth2.init({
            client_id: this.CLIENT_ID,
            scope: this.SCOPES
          });
        } catch (authInitError) {
          console.error('Failed to initialize auth2:', authInitError);
          throw new Error('Failed to initialize Google authentication. Please check your OAuth configuration in Google Cloud Console.');
        }
      }
      
      if (!this.isSignedIn) {
        console.log('Starting sign-in process...');
        
        // Test if popups are allowed
        const testPopup = window.open('', '_blank', 'width=1,height=1');
        if (!testPopup || testPopup.closed || typeof testPopup.closed === 'undefined') {
          console.error('Popup test failed - popups appear to be blocked');
          throw new Error('Popup blockers detected. Please allow popups for this site and try again. Check your browser\'s address bar for a popup blocker icon.');
        } else {
          testPopup.close();
          console.log('Popup test passed');
        }
        
        try {
          // First try to check if user is already signed in silently
          const currentUser = authInstance.currentUser.get();
          if (currentUser && currentUser.isSignedIn()) {
            console.log('User already signed in silently');
            this.isSignedIn = true;
          } else {
            // Show user a message about popups before attempting sign-in
            console.log('Attempting interactive sign-in...');
            
            const user = await authInstance.signIn({
              prompt: 'select_account'
            });
            
            if (user && user.getBasicProfile) {
              console.log('Sign-in successful:', user.getBasicProfile().getEmail());
              this.isSignedIn = true;
            } else {
              throw new Error('Sign-in completed but user object is invalid');
            }
          }
        } catch (signInError) {
          console.error('Sign-in failed:', signInError);
          if (signInError.error === 'popup_closed_by_user') {
            throw new Error('Sign-in popup was closed. Please disable popup blockers and try again.');
          } else if (signInError.error === 'access_denied') {
            throw new Error('Access denied. Please grant permission to access Google Drive.');
          } else if (signInError.error === 'idpiframe_initialization_failed') {
            throw new Error('Google authentication failed. Please ensure localhost:5173 is added to authorized origins in Google Cloud Console.');
          } else {
            throw new Error(`Sign-in failed: ${signInError.error || signInError.message || 'Unknown error'}`);
          }
        }
      }

      await this._initializeFolders();
      
      // Store sign-in state in localStorage
      localStorage.setItem('googleDriveConnected', 'true');
      localStorage.setItem('googleDriveFolderId', this.mediaTrackerFolderId);
      
      return {
        folderId: this.mediaTrackerFolderId,
        folderName: 'MediaTracker'
      };
    } catch (error) {
      console.error('Error connecting to Google Drive:', error);
      throw new Error(`Failed to connect to Google Drive: ${error.message}`);
    }
  }

  async disconnect() {
    if (this.isInitialized && this.isSignedIn) {
      const authInstance = this.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      this.isSignedIn = false;
    }
    
    this.mediaTrackerFolderId = null;
    this.trashFolderId = null;
    
    // Clear stored state
    localStorage.removeItem('googleDriveConnected');
    localStorage.removeItem('googleDriveFolderId');
  }

  async _initializeFolders() {
    try {
      // Find or create MediaTracker folder
      this.mediaTrackerFolderId = await this._findOrCreateFolder('MediaTracker');
      
      // Find or create .trash subfolder
      this.trashFolderId = await this._findOrCreateFolder('.trash', this.mediaTrackerFolderId);
      
    } catch (error) {
      console.error('Error initializing Google Drive folders:', error);
      throw error;
    }
  }

  async _findOrCreateFolder(name, parentId = null) {
    try {
      // Search for existing folder
      let query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      if (parentId) {
        query += ` and '${parentId}' in parents`;
      } else {
        query += ` and parents in 'root'`;
      }

      const searchResponse = await this.gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name)'
      });

      if (searchResponse.result.files.length > 0) {
        return searchResponse.result.files[0].id;
      }

      // Create folder if it doesn't exist
      const folderMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : ['root']
      };

      const createResponse = await this.gapi.client.drive.files.create({
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
      // List all .md files in the MediaTracker folder
      const response = await this.gapi.client.drive.files.list({
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
            fileId: file.id, // Store Google Drive file ID for updates
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
      const response = await this.gapi.client.drive.files.get({
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
        // Update existing file
        await this._updateFile(item.fileId, content, filename);
      } else {
        // Create new file
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

      // Use multipart upload for file with content
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
      form.append('file', new Blob([content], {type: 'text/markdown'}));

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
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
          'Authorization': `Bearer ${this.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
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

      // Move file to trash folder by changing its parent
      await this.gapi.client.drive.files.update({
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
      // Move file back from trash to main folder
      await this.gapi.client.drive.files.update({
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

  // Utility method to handle API rate limiting
  async _retryWithBackoff(apiCall, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (error.status === 429 && attempt < maxRetries - 1) {
          // Rate limited, wait before retry
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  }
}