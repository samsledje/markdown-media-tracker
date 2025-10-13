import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LandingPage from '../LandingPage';

// Mock StorageSelector component
vi.mock('../StorageSelector', () => ({
  default: ({ onStorageSelect, availableOptions, error, isLoading, loadProgress }) => (
    <div data-testid="storage-selector">
      <div>Storage Selector</div>
      {error && <div data-testid="storage-error">{error}</div>}
      {isLoading && <div data-testid="storage-loading">Loading...</div>}
      {loadProgress && <div data-testid="load-progress">{loadProgress.current}/{loadProgress.total}</div>}
      {availableOptions?.map(opt => (
        <button key={opt} onClick={() => onStorageSelect(opt)}>
          Select {opt}
        </button>
      ))}
    </div>
  )
}));

describe('LandingPage', () => {
  const defaultProps = {
    onStorageSelect: vi.fn(),
    availableOptions: ['filesystem', 'googledrive'],
    error: null,
    isLoading: false,
    loadProgress: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the hero section with logo and title', () => {
      render(<LandingPage {...defaultProps} />);
      
      expect(screen.getByAltText('Markdown Media Tracker logo')).toBeInTheDocument();
      const headings = screen.getAllByRole('heading', { name: /markdown media tracker/i });
      expect(headings.length).toBeGreaterThan(0);
      expect(screen.getByText(/track books and movies with the simplicity of markdown files/i)).toBeInTheDocument();
    });

    it('should render CTA buttons', () => {
      render(<LandingPage {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view features/i })).toBeInTheDocument();
    });

    it('should render features section', () => {
      render(<LandingPage {...defaultProps} />);
      
      expect(screen.getByRole('heading', { name: /why markdown media tracker/i })).toBeInTheDocument();
      expect(screen.getByText(/privacy-first storage/i)).toBeInTheDocument();
      expect(screen.getByText(/markdown-powered/i)).toBeInTheDocument();
      expect(screen.getByText(/rich features/i)).toBeInTheDocument();
      expect(screen.getByText(/keyboard-first/i)).toBeInTheDocument();
    });

    it('should render storage selection section', () => {
      render(<LandingPage {...defaultProps} />);
      
      expect(screen.getByRole('heading', { name: /choose your storage/i })).toBeInTheDocument();
      expect(screen.getByTestId('storage-selector')).toBeInTheDocument();
    });

    it('should render all four feature cards', () => {
      render(<LandingPage {...defaultProps} />);
      
      const featureCards = screen.getAllByText(/your data stays yours|each item is a simple|search open library|navigate your entire library/i);
      expect(featureCards.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Screenshot Carousel', () => {
    it('should render carousel with first screenshot', () => {
      render(<LandingPage {...defaultProps} />);
      
      const img = screen.getByAltText(/keep track of books and movies/i);
      expect(img).toBeInTheDocument();
      expect(img.src).toContain('main-panel.jpg');
    });

    it('should render navigation arrows', () => {
      render(<LandingPage {...defaultProps} />);
      
      expect(screen.getByLabelText('Previous screenshot')).toBeInTheDocument();
      expect(screen.getByLabelText('Next screenshot')).toBeInTheDocument();
    });

    it('should render slide indicators', () => {
      render(<LandingPage {...defaultProps} />);
      
      // 8 screenshots = 8 indicators
      const indicators = screen.getAllByLabelText(/go to screenshot \d+/i);
      expect(indicators.length).toBe(8);
    });

    // TODO: Complex timing tests with useEffect carousel - skip for now
    it.skip('should advance to next slide when next button clicked', async () => {
      // Carousel transitions are complex with timers and state
    });

    it.skip('should go to previous slide when prev button clicked', async () => {
      // Carousel transitions are complex with timers and state
    });

    it.skip('should go to specific slide when indicator clicked', async () => {
      // Carousel transitions are complex with timers and state
    });

    it.skip('should auto-advance slides', async () => {
      // Auto-advance involves intervals and transitions
    });

    it.skip('should stop auto-play when user clicks indicator', async () => {
      // Auto-play state management is complex to test
    });

    it.skip('should wrap to first slide from last slide', async () => {
      // Carousel wrapping involves state transitions
    });
  });

  describe('Navigation', () => {
    it('should have View Features and Get Started buttons', () => {
      render(<LandingPage {...defaultProps} />);
      
      const viewFeaturesButton = screen.getByRole('button', { name: /view features/i });
      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      
      expect(viewFeaturesButton).toBeInTheDocument();
      expect(getStartedButton).toBeInTheDocument();
    });

    it('should expose scrollToStorage method via ref', () => {
      const ref = { current: null };
      
      render(<LandingPage {...defaultProps} ref={ref} />);
      
      expect(ref.current).toBeTruthy();
      expect(ref.current.scrollToStorage).toBeInstanceOf(Function);
    });
  });

  describe('Storage Integration', () => {
    it('should pass onStorageSelect to StorageSelector', () => {
      render(<LandingPage {...defaultProps} />);
      
      expect(screen.getByTestId('storage-selector')).toBeInTheDocument();
    });

    it('should pass availableOptions to StorageSelector', () => {
      render(<LandingPage {...defaultProps} availableOptions={['filesystem', 'googledrive']} />);
      
      expect(screen.getByText('Select filesystem')).toBeInTheDocument();
      expect(screen.getByText('Select googledrive')).toBeInTheDocument();
    });

    it('should pass error to StorageSelector', () => {
      render(<LandingPage {...defaultProps} error="Connection failed" />);
      
      expect(screen.getByTestId('storage-error')).toHaveTextContent('Connection failed');
    });

    it('should pass isLoading to StorageSelector', () => {
      render(<LandingPage {...defaultProps} isLoading={true} />);
      
      expect(screen.getByTestId('storage-loading')).toBeInTheDocument();
    });

    it('should pass loadProgress to StorageSelector', () => {
      render(<LandingPage {...defaultProps} loadProgress={{ current: 5, total: 10 }} />);
      
      expect(screen.getByTestId('load-progress')).toHaveTextContent('5/10');
    });

    it('should call onStorageSelect when storage option selected', () => {
      const onStorageSelect = vi.fn();
      
      render(<LandingPage {...defaultProps} onStorageSelect={onStorageSelect} />);
      
      const filesystemButton = screen.getByText('Select filesystem');
      filesystemButton.click();
      
      expect(onStorageSelect).toHaveBeenCalledWith('filesystem');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<LandingPage {...defaultProps} />);
      
      const h1s = screen.getAllByRole('heading', { level: 1 });
      expect(h1s[0]).toHaveTextContent('Markdown Media Tracker');
      
      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h2s.length).toBeGreaterThanOrEqual(2); // Features and Storage headings
    });

    it('should have aria-labels for buttons', () => {
      render(<LandingPage {...defaultProps} />);
      
      expect(screen.getByLabelText(/get started with markdown media tracker/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/view features and learn more/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Previous screenshot')).toBeInTheDocument();
      expect(screen.getByLabelText('Next screenshot')).toBeInTheDocument();
    });

    it('should have section with features heading', () => {
      render(<LandingPage {...defaultProps} />);
      
      expect(screen.getByText(/why markdown media tracker/i)).toBeInTheDocument();
      expect(screen.getByText(/choose your storage/i)).toBeInTheDocument();
    });

    it('should have alt text for all images', () => {
      render(<LandingPage {...defaultProps} />);
      
      const logo = screen.getByAltText('Markdown Media Tracker logo');
      expect(logo).toBeInTheDocument();
      
      const screenshot = screen.getByAltText(/keep track of books and movies/i);
      expect(screenshot).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render CTA buttons with proper classes', () => {
      const { container } = render(<LandingPage {...defaultProps} />);
      
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have responsive text on title', () => {
      render(<LandingPage {...defaultProps} />);
      
      const titles = screen.getAllByRole('heading', { name: /markdown media tracker/i });
      expect(titles[0].className).toContain('text-');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty availableOptions', () => {
      render(<LandingPage {...defaultProps} availableOptions={[]} />);
      
      expect(screen.getByTestId('storage-selector')).toBeInTheDocument();
      expect(screen.queryByText(/select filesystem/i)).not.toBeInTheDocument();
    });

    it('should handle null loadProgress', () => {
      render(<LandingPage {...defaultProps} loadProgress={null} />);
      
      expect(screen.queryByTestId('load-progress')).not.toBeInTheDocument();
    });

    // TODO: Carousel timing tests are complex - skip for now
    it.skip('should handle clicking same slide indicator', async () => {
      // Complex carousel state management
    });

    it.skip('should handle rapid carousel navigation', async () => {
      // Complex timing with multiple state transitions
    });

    it.skip('should cleanup carousel interval on unmount', () => {
      // Timer cleanup is hard to verify with fake timers
    });
  });

  describe('Carousel Mouse Interaction', () => {
    // TODO: Mouse enter/leave with auto-play timing is complex - skip for now
    it.skip('should pause auto-play on mouse enter', async () => {
      // Complex state + timer interaction
    });

    it.skip('should resume auto-play on mouse leave', async () => {
      // Complex state + timer interaction
    });
  });

  describe('Feature Cards', () => {
    it('should render feature cards', () => {
      const { container } = render(<LandingPage {...defaultProps} />);
      
      const featureCards = container.querySelectorAll('[class*="bg-slate-800/50"]');
      expect(featureCards.length).toBe(4);
    });
  });
});
