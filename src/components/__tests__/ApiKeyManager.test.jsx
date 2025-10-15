import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import ApiKeyManager from '../ApiKeyManager.jsx';
import * as config from '../../config.js';

// Mock config module
vi.mock('../../config.js', () => ({
  saveConfig: vi.fn(),
  getConfig: vi.fn(),
  hasApiKey: vi.fn()
}));

describe('ApiKeyManager', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should show the manager if no API key is configured', () => {
      config.hasApiKey.mockReturnValue(false);
      config.getConfig.mockReturnValue(null);

      render(<ApiKeyManager />);

      expect(screen.getByText('OMDB API Key Required')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your OMDB API key')).toBeInTheDocument();
    });

    it('should hide the manager if API key exists', () => {
      config.hasApiKey.mockReturnValue(true);
      config.getConfig.mockReturnValue('test-api-key');

      render(<ApiKeyManager />);

      expect(screen.queryByText('OMDB API Key Required')).not.toBeInTheDocument();
      expect(screen.getByText('Manage API Key')).toBeInTheDocument();
    });

    it('should load existing API key into input field', () => {
      config.hasApiKey.mockReturnValue(false);
      config.getConfig.mockReturnValue('existing-key-123');

      render(<ApiKeyManager />);

      const input = screen.getByPlaceholderText('Enter your OMDB API key');
      expect(input).toHaveValue('existing-key-123');
    });
  });

  describe('Showing/Hiding Panel', () => {
    it('should show panel when "Manage API Key" button is clicked', async () => {
      config.hasApiKey.mockReturnValue(true);
      config.getConfig.mockReturnValue('test-key');

      render(<ApiKeyManager />);

      const manageButton = screen.getByText('Manage API Key');
      await user.click(manageButton);

      expect(screen.getByText('OMDB API Key Required')).toBeInTheDocument();
    });

    it('should hide panel when "Hide this panel" is clicked (if API key exists)', async () => {
      config.hasApiKey.mockReturnValue(true);
      config.getConfig.mockReturnValue('test-key');

      render(<ApiKeyManager />);

      // Show panel
      const manageButton = screen.getByText('Manage API Key');
      await user.click(manageButton);

      // Hide panel
      const hideButton = screen.getByText('Hide this panel');
      await user.click(hideButton);

      expect(screen.queryByText('OMDB API Key Required')).not.toBeInTheDocument();
      expect(screen.getByText('Manage API Key')).toBeInTheDocument();
    });

    it('should not show "Hide this panel" button if no API key exists', () => {
      config.hasApiKey.mockReturnValue(false);
      config.getConfig.mockReturnValue(null);

      render(<ApiKeyManager />);

      expect(screen.queryByText('Hide this panel')).not.toBeInTheDocument();
    });
  });

  describe('Saving API Key', () => {
    it('should save API key when Save button is clicked', async () => {
      config.hasApiKey.mockReturnValue(false);
      config.getConfig.mockReturnValue(null);
      config.saveConfig.mockReturnValue(true);

      render(<ApiKeyManager />);

      const input = screen.getByPlaceholderText('Enter your OMDB API key');
      const saveButton = screen.getByRole('button', { name: /save/i });

      await user.click(input);
      await user.paste('new-api-key-123');
      await user.click(saveButton);

      expect(config.saveConfig).toHaveBeenCalledWith({ omdbApiKey: 'new-api-key-123' });
    });

    it('should trim whitespace from API key before saving', async () => {
      config.hasApiKey.mockReturnValue(false);
      config.getConfig.mockReturnValue(null);
      config.saveConfig.mockReturnValue(true);

      render(<ApiKeyManager />);

      const input = screen.getByPlaceholderText('Enter your OMDB API key');
      const saveButton = screen.getByRole('button', { name: /save/i });

      await user.click(input);
      await user.paste('  api-key-with-spaces  ');
      await user.click(saveButton);

      expect(config.saveConfig).toHaveBeenCalledWith({ omdbApiKey: 'api-key-with-spaces' });
    });

    it('should save successfully and hide panel when key is provided', async () => {
      config.hasApiKey.mockReturnValue(false); // Initially no key
      config.getConfig.mockReturnValue(null);
      config.saveConfig.mockReturnValue(true);

      render(<ApiKeyManager />);

      const input = screen.getByPlaceholderText('Enter your OMDB API key');
      const saveButton = screen.getByRole('button', { name: /save/i });

      await user.click(input);
      await user.paste('new-key');
      await user.click(saveButton);

      // After saving with a key, panel should hide (component shows "Manage API Key" button)
      await waitFor(() => {
        expect(screen.queryByText('OMDB API Key Required')).not.toBeInTheDocument();
      });

      // Should see the "Manage API Key" button instead
      expect(screen.getByText('Manage API Key')).toBeInTheDocument();
    });

    it('should call onApiKeyChange callback after successful save', async () => {
      const onApiKeyChange = vi.fn();
      config.hasApiKey.mockReturnValue(false);
      config.getConfig.mockReturnValue(null);
      config.saveConfig.mockReturnValue(true);

      render(<ApiKeyManager onApiKeyChange={onApiKeyChange} />);

      const input = screen.getByPlaceholderText('Enter your OMDB API key');
      const saveButton = screen.getByRole('button', { name: /save/i });

      await user.click(input);
      await user.paste('callback-test-key');
      await user.click(saveButton);

      await waitFor(() => {
        expect(onApiKeyChange).toHaveBeenCalledWith('callback-test-key');
      });
    });

    it('should hide panel after saving if API key is now set', async () => {
      config.getConfig.mockReturnValue(null);
      config.saveConfig.mockReturnValue(true);
      
      // Initially no key
      config.hasApiKey.mockReturnValue(false);

      const { rerender } = render(<ApiKeyManager />);

      const input = screen.getByPlaceholderText('Enter your OMDB API key');
      const saveButton = screen.getByRole('button', { name: /save/i });

      await user.click(input);
      await user.paste('new-key');
      await user.click(saveButton);

      // After save, simulate hasApiKey returning true
      config.hasApiKey.mockReturnValue(true);
      
      // Panel should be hidden after save
      await waitFor(() => {
        expect(screen.queryByText('OMDB API Key Required')).not.toBeInTheDocument();
      });
    });

    it('should disable Save button when input is empty', () => {
      config.hasApiKey.mockReturnValue(false);
      config.getConfig.mockReturnValue(null);

      render(<ApiKeyManager />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable Save button when input has value', async () => {
      config.hasApiKey.mockReturnValue(false);
      config.getConfig.mockReturnValue(null);

      render(<ApiKeyManager />);

      const input = screen.getByPlaceholderText('Enter your OMDB API key');
      const saveButton = screen.getByRole('button', { name: /save/i });

      await user.click(input);
      await user.paste('test-key');

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('UI Content', () => {
    it('should display instructions for getting an API key', () => {
      config.hasApiKey.mockReturnValue(false);
      config.getConfig.mockReturnValue(null);

      render(<ApiKeyManager />);

      expect(screen.getByText(/Don't have an API key\?/i)).toBeInTheDocument();
      expect(screen.getByText(/Visit/i)).toBeInTheDocument();
      expect(screen.getByText(/Enter your email/i)).toBeInTheDocument();
    });

    it('should have link to OMDb API website', () => {
      config.hasApiKey.mockReturnValue(false);
      config.getConfig.mockReturnValue(null);

      render(<ApiKeyManager />);

      const link = screen.getByRole('link', { name: /omdb api/i });
      expect(link).toHaveAttribute('href', 'http://www.omdbapi.com/apikey.aspx');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should display Key icon', () => {
      config.hasApiKey.mockReturnValue(false);
      config.getConfig.mockReturnValue(null);

      render(<ApiKeyManager />);

      // Key icon should be present (lucide-react renders as svg)
      const keyIcon = document.querySelector('.lucide-key');
      expect(keyIcon).toBeInTheDocument();
    });

    it('should render password input for security', () => {
      config.hasApiKey.mockReturnValue(false);
      config.getConfig.mockReturnValue(null);

      render(<ApiKeyManager />);

      const input = screen.getByPlaceholderText('Enter your OMDB API key');
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  describe('Panel State Persistence', () => {
    it('should not allow hiding panel when no API key exists', () => {
      config.hasApiKey.mockReturnValue(false);
      config.getConfig.mockReturnValue(null);

      render(<ApiKeyManager />);

      // Panel should be visible and no hide button should exist
      expect(screen.getByText('OMDB API Key Required')).toBeInTheDocument();
      expect(screen.queryByText('Hide this panel')).not.toBeInTheDocument();
    });
  });
});
