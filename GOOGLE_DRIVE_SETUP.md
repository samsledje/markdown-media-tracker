# Google Drive API Setup Guide

This guide will walk you through setting up Google Drive API integration for the Media Tracker application.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project selector at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "Media Tracker")
5. Click "Create"

## Step 2: Enable the Google Drive API

1. In your project, go to the [APIs & Services Dashboard](https://console.cloud.google.com/apis/dashboard)
2. Click "+ ENABLE APIS AND SERVICES"
3. Search for "Google Drive API"
4. Click on "Google Drive API" from the results
5. Click "Enable"

## Step 3: Create API Credentials

### Create an API Key

1. Go to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "+ CREATE CREDENTIALS" > "API key"
3. Copy the generated API key
4. Click "RESTRICT KEY" to secure it:
   - Under "API restrictions", select "Restrict key"
   - Check "Google Drive API"
   - Click "Save"

### Create OAuth 2.0 Client ID

1. In the same Credentials page, click "+ CREATE CREDENTIALS" > "OAuth client ID"
2. If prompted to configure the OAuth consent screen:
   - Click "CONFIGURE CONSENT SCREEN"
   - Choose "External" (unless you have a Google Workspace account)
   - Fill in the required fields:
     - App name: "Markdown Media Tracker"
     - User support email: Your email
     - Developer contact information: Your email
   - Click "Save and Continue"
   - On Scopes page, click "Save and Continue" (we'll handle scopes in the app)
   - On Test users page, you can add your email for testing, then click "Save and Continue"
3. Back to creating OAuth client ID:
   - Choose "Web application"
   - Name: "Media Tracker Web Client"
   - Under "Authorized JavaScript origins", add:
     - `http://localhost:5173` (for Vite development server)
     - `http://localhost:3000` (for alternative development setup)
     - `http://127.0.0.1:5173` (alternative localhost)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Leave "Authorized redirect URIs" empty (not needed for our use case)
   - Click "Create"
4. Copy the generated Client ID

## Step 4: Configure Environment Variables

1. In your project root, copy `.env.template` to `.env.local`:

   ```bash
   cp .env.template .env.local
   ```

2. Edit `.env.local` and add your credentials:

   ```env
   VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY=your_api_key_here
   ```

## Step 5: OAuth Consent Screen (Production)

For production use, you'll need to publish your app:

1. Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Fill in all required information:
   - App domain information
   - Privacy Policy URL
   - Terms of Service URL
3. Add the required scopes:
   - `https://www.googleapis.com/auth/drive.file`
4. Submit for verification (required for production use with external users)

## Security Considerations

### API Key Security

- Restrict your API key to only the Google Drive API
- Consider adding HTTP referrer restrictions for production
- Never commit your actual API keys to version control

### OAuth Client ID Security

- Only add trusted domains to authorized JavaScript origins
- For production, ensure your domain is HTTPS
- Regularly review and rotate credentials

### Scope Permissions

The app requests minimal permissions:

- `https://www.googleapis.com/auth/drive.file`: Only allows access to files created by the app

## Testing the Integration

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Open the application in your browser
3. Choose "Google Drive" as your storage option
4. Click "Connect" and sign in with your Google account
5. Grant permissions when prompted
6. The app should create a "MediaTracker" folder in your Google Drive

## Troubleshooting

### Common Issues

1. **"Access blocked" error**
   - Ensure your OAuth consent screen is properly configured
   - Add your email as a test user if the app is not published

2. **"Invalid client" error**
   - Check that your Client ID is correctly configured
   - Ensure your domain is added to authorized JavaScript origins

3. **API key errors**
   - Verify the API key is restricted to Google Drive API
   - Check that the Google Drive API is enabled

4. **CORS errors**
   - Ensure your domain is added to authorized JavaScript origins
   - Check that you're serving the app over HTTPS in production

### Development vs Production

- **Development**: Can use `http://localhost:5173`
- **Production**: Must use HTTPS and add your production domain

## Support

If you encounter issues:

1. Check the browser console for detailed error messages
2. Verify your Google Cloud Console configuration
3. Ensure your environment variables are properly set
4. Review the [Google Drive API documentation](https://developers.google.com/drive/api)

## Costs

The Google Drive API has generous free quotas:

- 1 billion API calls per day (per project)
- 1,000 API calls per 100 seconds per user

For typical usage of the Media Tracker app, you should stay well within the free tier limits.

## Common Issues

### "idpiframe_initialization_failed" Error

This error typically occurs due to OAuth configuration issues:

1. **Check Authorized JavaScript Origins**: Ensure your current domain is listed in Google Cloud Console:
   - Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
   - Click on your OAuth 2.0 Client ID
   - Under "Authorized JavaScript origins", make sure you have:
     - `http://localhost:5173` (for development)
     - Your actual domain if deploying

2. **Clear Browser Cache**: Sometimes old auth tokens cause issues:
   - Clear your browser's cache and cookies
   - Try in an incognito/private window

3. **Check OAuth Consent Screen**: Make sure your app is configured properly:
   - Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
   - Ensure all required fields are filled
   - If in testing mode, add your email to test users

### Connection Refused or CORS Errors

If you see network errors:

- Ensure your development server is running on the correct port (5173)
- Check that no firewall is blocking the connection
- Verify your API key has the correct restrictions (or no restrictions for testing)

### "Client ID not found" Errors

- Double-check that your Client ID in `.env.local` matches exactly what's shown in Google Cloud Console
- Ensure the Client ID ends with `.apps.googleusercontent.com`
- Make sure you're using the Client ID, not the Client Secret