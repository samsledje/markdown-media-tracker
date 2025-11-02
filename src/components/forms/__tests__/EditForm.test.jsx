import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import EditForm from '../EditForm';

describe('EditForm', () => {
  it('should add a tag when a valid string is provided', () => {
    const mockOnChange = vi.fn();
    const item = { tags: [] };

    const { getByPlaceholderText, getByText } = render(
      <EditForm item={item} onChange={mockOnChange} allTags={[]} />
    );

    const input = getByPlaceholderText('Add tag');
    const addButton = getByText('Add');

    // Simulate typing a tag and clicking the Add button
    fireEvent.change(input, { target: { value: 'new-tag' } });
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith({ ...item, tags: ['new-tag'] });
  });

  it('should handle unexpected event objects gracefully', () => {
    const mockOnChange = vi.fn();
    const item = { tags: [] };

    const { getByText } = render(
      <EditForm item={item} onChange={mockOnChange} allTags={[]} />
    );

    const addButton = getByText('Add');

    // Simulate clicking the Add button without typing a tag
    fireEvent.click(addButton);

    // Ensure no changes are made to the tags
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should auto-update dateRead when status changes from reading to read', () => {
    const mockOnChange = vi.fn();
    const item = {
      title: 'Test Book',
      type: 'book',
      status: 'reading',
      tags: []
    };

    const { getByText } = render(
      <EditForm item={item} onChange={mockOnChange} allTags={[]} />
    );

    const readButton = getByText('Read');
    fireEvent.click(readButton);

    expect(mockOnChange).toHaveBeenCalled();
    const updatedItem = mockOnChange.mock.calls[0][0];
    expect(updatedItem.status).toBe('read');
    expect(updatedItem.dateRead).toBeDefined();
    expect(updatedItem.dateRead).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should auto-update dateWatched when status changes from watching to watched', () => {
    const mockOnChange = vi.fn();
    const item = {
      title: 'Test Movie',
      type: 'movie',
      status: 'watching',
      tags: [],
      actors: []
    };

    const { getByText } = render(
      <EditForm item={item} onChange={mockOnChange} allTags={[]} />
    );

    const watchedButton = getByText('Watched');
    fireEvent.click(watchedButton);

    expect(mockOnChange).toHaveBeenCalled();
    const updatedItem = mockOnChange.mock.calls[0][0];
    expect(updatedItem.status).toBe('watched');
    expect(updatedItem.dateWatched).toBeDefined();
    expect(updatedItem.dateWatched).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should not overwrite existing dateRead when changing to read status', () => {
    const mockOnChange = vi.fn();
    const existingDate = '2024-01-15';
    const item = {
      title: 'Test Book',
      type: 'book',
      status: 'reading',
      dateRead: existingDate,
      tags: []
    };

    const { getByText } = render(
      <EditForm item={item} onChange={mockOnChange} allTags={[]} />
    );

    const readButton = getByText('Read');
    fireEvent.click(readButton);

    expect(mockOnChange).toHaveBeenCalled();
    const updatedItem = mockOnChange.mock.calls[0][0];
    expect(updatedItem.status).toBe('read');
    expect(updatedItem.dateRead).toBe(existingDate);
  });
});