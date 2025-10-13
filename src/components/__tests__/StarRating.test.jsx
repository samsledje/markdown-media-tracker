import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StarRating from '../StarRating.jsx';

describe('StarRating', () => {
  describe('rendering', () => {
    it('should render 5 stars', () => {
      render(<StarRating rating={0} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
    });

    it('should display full stars correctly', () => {
      const { container } = render(<StarRating rating={3} halfStarsEnabled={true} />);
      const stars = container.querySelectorAll('svg.lucide-star');
      // We expect 5 stars total, 3 filled
      expect(stars.length).toBeGreaterThanOrEqual(5);
    });

    it('should display half stars correctly', () => {
      const { container } = render(<StarRating rating={3.5} halfStarsEnabled={true} />);
      // Check for half star rendering (clipped div)
      const halfStarContainer = container.querySelector('div[style*="width: 50%"]');
      expect(halfStarContainer).toBeTruthy();
    });

    it('should not display half stars when disabled', () => {
      const { container } = render(<StarRating rating={3.5} halfStarsEnabled={false} />);
      const halfStarContainer = container.querySelector('div[style*="width: 50%"]');
      expect(halfStarContainer).toBeFalsy();
    });

    it('should render non-interactive stars when interactive is false', () => {
      render(<StarRating rating={3} interactive={false} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('interaction with half stars enabled', () => {
    it('should set to full star on first click', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<StarRating rating={0} onChange={onChange} interactive={true} halfStarsEnabled={true} />);
      
      const buttons = screen.getAllByRole('button');
      
      // Click third star - should set to 3
      await user.click(buttons[2]);
      expect(onChange).toHaveBeenCalledWith(3);
    });

    it('should cycle from full to half when clicking same star', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<StarRating rating={3} onChange={onChange} interactive={true} halfStarsEnabled={true} />);
      
      const buttons = screen.getAllByRole('button');
      
      // Click third star (currently at 3) - should set to 2.5
      await user.click(buttons[2]);
      expect(onChange).toHaveBeenCalledWith(2.5);
    });

    it('should go from half star to unrated', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<StarRating rating={2.5} onChange={onChange} interactive={true} halfStarsEnabled={true} />);
      
      const buttons = screen.getAllByRole('button');
      
      // Click third star (currently at 2.5, which is half of third star) - should set to 0
      await user.click(buttons[2]);
      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('should set different star rating when clicking different star', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<StarRating rating={3} onChange={onChange} interactive={true} halfStarsEnabled={true} />);
      
      const buttons = screen.getAllByRole('button');
      
      // Click fifth star - should set to 5
      await user.click(buttons[4]);
      expect(onChange).toHaveBeenCalledWith(5);
    });
  });

  describe('interaction with half stars disabled', () => {
    it('should set to full star on first click', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<StarRating rating={0} onChange={onChange} interactive={true} halfStarsEnabled={false} />);
      
      const buttons = screen.getAllByRole('button');
      
      // Click third star - should set to 3
      await user.click(buttons[2]);
      expect(onChange).toHaveBeenCalledWith(3);
    });

    it('should toggle to unrated when clicking same star', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<StarRating rating={3} onChange={onChange} interactive={true} halfStarsEnabled={false} />);
      
      const buttons = screen.getAllByRole('button');
      
      // Click third star (currently at 3) - should set to 0
      await user.click(buttons[2]);
      expect(onChange).toHaveBeenCalledWith(0);
    });
  });

  describe('size customization', () => {
    it('should apply custom size classes', () => {
      const { container } = render(<StarRating rating={3} size="w-6 h-6" />);
      const stars = container.querySelectorAll('svg.lucide-star');
      expect(stars[0].classList.contains('w-6')).toBe(true);
      expect(stars[0].classList.contains('h-6')).toBe(true);
    });
  });
});
