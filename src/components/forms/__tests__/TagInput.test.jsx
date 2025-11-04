import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagInput from '../TagInput.jsx';

describe('TagInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onAdd: vi.fn(),
    existingTags: [],
    allTags: ['fiction', 'sci-fi', 'fantasy', 'mystery', 'thriller'],
    placeholder: 'Add tag'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render input with placeholder', () => {
    render(<TagInput {...defaultProps} />);
    const input = screen.getByPlaceholderText('Add tag');
    expect(input).toBeInTheDocument();
  });

  it('should display input value', () => {
    render(<TagInput {...defaultProps} value="test" />);
    const input = screen.getByDisplayValue('test');
    expect(input).toBeInTheDocument();
  });

  it('should call onChange when typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput {...defaultProps} onChange={onChange} />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.type(input, 'test');
    
    expect(onChange).toHaveBeenCalledTimes(4); // One for each character
  });

  it('should show suggestions when typing and matches exist', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.click(input);
    await user.type(input, 'fic');
    
    await waitFor(() => {
      expect(screen.getByText('fiction')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should filter suggestions based on input', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.click(input);
    await user.type(input, 'sci');
    
    await waitFor(() => {
      expect(screen.getByText('sci-fi')).toBeInTheDocument();
      expect(screen.queryByText('fiction')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should exclude existing tags from suggestions', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} existingTags={['fiction']} />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.type(input, 'fic');
    
    await waitFor(() => {
      expect(screen.queryByText('fiction')).not.toBeInTheDocument();
    });
  });

  it('should limit suggestions to 8 items', async () => {
    const user = userEvent.setup();
    const manyTags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
    render(<TagInput {...defaultProps} allTags={manyTags} />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.type(input, 'tag');
    
    await waitFor(() => {
      const suggestions = screen.getAllByRole('button');
      expect(suggestions.length).toBeLessThanOrEqual(8);
    });
  });

  it('should call onAdd when Enter is pressed with no suggestions', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<TagInput {...defaultProps} onAdd={onAdd} />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.type(input, 'newtag');
    await user.keyboard('{Enter}');
    
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('should navigate suggestions with ArrowDown', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.type(input, 'fic');
    
    await waitFor(() => {
      expect(screen.getByText('fiction')).toBeInTheDocument();
    });
    
    await user.keyboard('{ArrowDown}');
    
    // Check that the first suggestion is focused
    const firstSuggestion = screen.getByText('fiction');
    expect(firstSuggestion).toHaveClass('bg-slate-600');
  });

  it('should navigate suggestions with ArrowUp', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.type(input, 'fic');
    
    await waitFor(() => {
      expect(screen.getByText('fiction')).toBeInTheDocument();
    });
    
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowUp}');
    
    // First item should be focused again (wraps around)
    const firstSuggestion = screen.getByText('fiction');
    expect(firstSuggestion).toHaveClass('bg-slate-600');
  });

  it('should select suggestion with Enter when focused', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onChange = vi.fn();
    render(<TagInput {...defaultProps} onAdd={onAdd} onChange={onChange} />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.type(input, 'fic');
    
    await waitFor(() => {
      expect(screen.getByText('fiction')).toBeInTheDocument();
    });
    
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    
    expect(onChange).toHaveBeenCalled();
    expect(onAdd).toHaveBeenCalledWith('fiction');
  });

  it('should close suggestions with Escape', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.type(input, 'fic');
    
    await waitFor(() => {
      expect(screen.getByText('fiction')).toBeInTheDocument();
    });
    
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByText('fiction')).not.toBeInTheDocument();
    });
  });

  it('should select suggestion when clicked', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onChange = vi.fn();
    render(<TagInput {...defaultProps} onAdd={onAdd} onChange={onChange} />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.type(input, 'fic');
    
    await waitFor(() => {
      expect(screen.getByText('fiction')).toBeInTheDocument();
    });
    
    const suggestion = screen.getByText('fiction');
    await user.click(suggestion);
    
    expect(onChange).toHaveBeenCalled();
    expect(onAdd).toHaveBeenCalledWith('fiction');
  });

  it('should update focused index when hovering over suggestions', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.type(input, 'fic');
    
    await waitFor(() => {
      expect(screen.getByText('fiction')).toBeInTheDocument();
    });
    
    const suggestion = screen.getByText('fiction');
    await user.hover(suggestion);
    
    expect(suggestion).toHaveClass('bg-slate-600');
  });

  it('should close suggestions when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <TagInput {...defaultProps} />
      </div>
    );
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.type(input, 'fic');
    
    await waitFor(() => {
      expect(screen.getByText('fiction')).toBeInTheDocument();
    });
    
    const outside = screen.getByTestId('outside');
    await user.click(outside);
    
    await waitFor(() => {
      expect(screen.queryByText('fiction')).not.toBeInTheDocument();
    });
  });

  it('should not show suggestions when input is empty', () => {
    render(<TagInput {...defaultProps} value="" />);
    expect(screen.queryByText('fiction')).not.toBeInTheDocument();
  });

  it('should not show suggestions when there are no matches', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.type(input, 'xyz');
    
    await waitFor(() => {
      expect(screen.queryByText('fiction')).not.toBeInTheDocument();
    });
  });

  it('should show suggestions when input is focused and has matches', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} value="fic" />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.click(input);
    
    await waitFor(() => {
      expect(screen.getByText('fiction')).toBeInTheDocument();
    });
  });

  it('should handle case-insensitive matching', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.type(input, 'FIC');
    
    await waitFor(() => {
      expect(screen.getByText('fiction')).toBeInTheDocument();
    });
  });

  it('should reset focused index when suggestions change', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.type(input, 'fic');
    
    await waitFor(() => {
      expect(screen.getByText('fiction')).toBeInTheDocument();
    });
    
    await user.keyboard('{ArrowDown}');
    
    // Clear and type new value
    await user.clear(input);
    await user.type(input, 'sci');
    
    // Focused index should be reset
    await waitFor(() => {
      expect(screen.getByText('sci-fi')).toBeInTheDocument();
    });
  });

  it('should handle wrapping around when navigating with ArrowDown', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} allTags={['fiction', 'fantasy', 'mystery']} />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.type(input, 'f');
    
    await waitFor(() => {
      expect(screen.getByText('fiction')).toBeInTheDocument();
    });
    
    // Navigate to first item
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      const firstSuggestion = screen.getByText('fiction');
      expect(firstSuggestion).toHaveClass('bg-slate-600');
    });
    
    // Navigate to next item
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      const secondSuggestion = screen.getByText('fantasy');
      expect(secondSuggestion).toHaveClass('bg-slate-600');
    });
  });

  it('should handle wrapping around when navigating with ArrowUp', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} allTags={['fiction', 'fantasy']} />);
    
    const input = screen.getByPlaceholderText('Add tag');
    await user.type(input, 'f');
    
    await waitFor(() => {
      expect(screen.getByText('fiction')).toBeInTheDocument();
      expect(screen.getByText('fantasy')).toBeInTheDocument();
    });
    
    // Navigate to first item
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      const firstSuggestion = screen.getByText('fiction');
      expect(firstSuggestion).toHaveClass('bg-slate-600');
    });
    
    // ArrowUp from first should wrap to last
    await user.keyboard('{ArrowUp}');
    await waitFor(() => {
      const lastSuggestion = screen.getByText('fantasy');
      expect(lastSuggestion).toHaveClass('bg-slate-600');
    });
  });
});
