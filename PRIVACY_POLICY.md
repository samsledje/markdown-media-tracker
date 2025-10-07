# Privacy Policy for Markdown Media Tracker

**Effective Date:** October 7, 2025

## Overview

Markdown Media Tracker is a local-first application designed to help you track books and movies you've read or watched. We are committed to protecting your privacy and ensuring transparency about how your data is handled.

## Information We Collect

### Personal Information

The application does not collect personal information such as names, email addresses, or phone numbers, except as necessary for Google Drive integration (see Google Drive section below).

### Media Tracking Data

When you use the application, you create and store:

- Book and movie titles, authors, directors, actors
- Your personal ratings and reviews
- Reading/watching dates
- Tags and categories you assign
- Cover images (URLs only)
- ISBN numbers for books
- Any notes or comments you add

### API Keys

- **OMDb API Key**: If you choose to use movie search functionality, you must provide your own OMDb API key. This key is stored locally in your browser and is only sent to OMDb for movie searches.
- **Google API Credentials**: For Google Drive integration, the app uses Google API credentials that are configured by the application maintainer.

## How We Use Your Information

### Local Storage Mode

When using local directory storage:

- All your data remains on your device
- No data is transmitted to our servers or any third parties (except for optional API searches)
- Your files are stored as plain text Markdown files on your local file system

### Google Drive Integration

When using Google Drive storage:

- Your media tracking data is stored in your Google Drive account
- We access only the specific folder you designate for the application
- Your data is transmitted securely to Google Drive using HTTPS encryption
- We do not access, read, or store your data on our servers

### Third-Party API Usage

- **OMDb API**: When searching for movies, your search queries and API key are sent to OMDb. This is governed by OMDb's privacy policy.
- **Open Library API**: When searching for books, your search queries are sent to Open Library. No authentication is required.

## Data Storage and Security

### Local Storage

- Data is stored directly on your device using the File System Access API
- Files are saved as standard Markdown files with YAML frontmatter
- No data leaves your device except for optional API searches

### Google Drive Storage

- Data is stored in your personal Google Drive account
- Communication with Google Drive is encrypted using HTTPS
- We use Google's official APIs and follow their security guidelines
- You can revoke access at any time through your Google Account settings

### Browser Storage

- API keys are stored in your browser's localStorage
- Application preferences and settings are stored locally
- No tracking cookies or analytics are used

## Data Sharing

We do not sell, trade, or otherwise transfer your personal information or media tracking data to third parties, except:

### Service Providers

- **Google Drive**: If you choose Google Drive storage, your data is stored in your Google Drive account according to Google's privacy policy
- **OMDb**: If you use movie search, your queries are sent to OMDb according to their privacy policy
- **Open Library**: If you use book search, your queries are sent to Open Library according to their privacy policy

### Legal Requirements

We may disclose information if required by law or in response to valid legal requests.

## Your Rights and Choices

### Data Control

- **Local Storage**: You have complete control over your data files and can move, copy, or delete them at any time
- **Google Drive**: You can access, modify, or delete your data through the application or directly in Google Drive

### Access Revocation

- **Google Drive**: You can revoke the application's access to your Google Drive at any time through your Google Account settings
- **API Keys**: You can remove stored API keys from the application settings

### Data Export

- All your data is stored in standard Markdown format, making it easily portable to other applications
- You can export your data at any time by copying the Markdown files

## Third-Party Services

This application integrates with:

### Google Drive API

- **Purpose**: Cloud storage and synchronization
- **Data Shared**: Your media tracking files
- **Privacy Policy**: [Google Privacy Policy](https://policies.google.com/privacy)

### OMDb API

- **Purpose**: Movie information lookup
- **Data Shared**: Search queries
- **Privacy Policy**: [OMDb Terms](http://www.omdbapi.com/)

### Open Library API

- **Purpose**: Book information lookup
- **Data Shared**: Search queries
- **Privacy Policy**: [Internet Archive Privacy Policy](https://archive.org/about/privacy.php)

## Children's Privacy

This application is not directed to children under 13. We do not knowingly collect personal information from children under 13.

## International Users

This application can be used globally. If you are using the application from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States or other countries where our service providers operate.

## Changes to This Privacy Policy

We may update this privacy policy from time to time. We will notify users of any material changes by updating the "Effective Date" at the top of this policy. Continued use of the application after changes constitutes acceptance of the revised policy.

## Data Retention

### Local File Storage

- Data persists until you manually delete it
- The application does not automatically delete your data

### Google Drive File Storage

- Data persists in your Google Drive according to your Google Drive settings
- You can delete data at any time through the application or Google Drive

## Security Measures

- All communications with Google Drive use HTTPS encryption
- API keys are stored securely in browser localStorage
- The application runs entirely in your browser with no server-side data processing
- Regular security updates are applied to dependencies

## Contact Information

This is an open-source project. For privacy-related questions or concerns:

- **GitHub Repository**: [samsledje/markdown-media-tracker](https://github.com/samsledje/markdown-media-tracker)
- **Issues**: Please file issues on GitHub for privacy concerns or questions

## Open Source

This application is open source. You can review the complete source code to understand exactly how your data is handled:

- **Repository**: [https://github.com/samsledje/markdown-media-tracker](https://github.com/samsledje/markdown-media-tracker)
- **License**: See LICENSE file in the repository

## Compliance

This privacy policy is designed to comply with:

- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
- Google API Services User Data Policy

---

*This privacy policy was last updated on October 7, 2025.*
