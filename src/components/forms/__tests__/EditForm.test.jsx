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
});