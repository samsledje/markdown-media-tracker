import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterModal from '../FilterModal.jsx';
import { STATUS_LABELS, STATUS_ICONS } from '../../../constants';

describe('FilterModal', () => {
    const defaultProps = {
        showFilters: true,
        filterRating: 0,
        filterMaxRating: 0,
        filterHasReview: { withReview: true, withoutReview: true },
        filterHasCover: { withCover: true, withoutCover: true },
        filterTags: [],
        filterStatuses: [],
        filterRecent: 'any',
        allTags: ['Fiction', 'Sci-Fi', 'Drama'],
        allStatuses: ['to-read', 'reading', 'read', 'to-watch', 'watching', 'watched'],
        setFilterRating: vi.fn(),
        setFilterMaxRating: vi.fn(),
        setFilterHasReview: vi.fn(),
        setFilterHasCover: vi.fn(),
        setFilterRecent: vi.fn(),
        toggleTagFilter: vi.fn(),
        toggleStatusFilter: vi.fn(),
        clearFilters: vi.fn(),
    };

    const renderFilterModal = (props = {}) => {
        return render(<FilterModal {...defaultProps} {...props} />);
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Conditional Rendering', () => {
        it('does not render when showFilters is false', () => {
            renderFilterModal({ showFilters: false });
            expect(screen.queryByText('Status')).not.toBeInTheDocument();
            expect(screen.queryByText('Rating range')).not.toBeInTheDocument();
            expect(screen.queryByText('Recently read / watched')).not.toBeInTheDocument();
            expect(screen.queryByText('Tags')).not.toBeInTheDocument();
        });

        it('renders filter interface when showFilters is true', () => {
            renderFilterModal();
            expect(screen.getByText('Status')).toBeInTheDocument();
            expect(screen.getByText('Rating range')).toBeInTheDocument();
            expect(screen.getByText('Recently read / watched')).toBeInTheDocument();
            expect(screen.getByText('Tags')).toBeInTheDocument();
        });
    });

    describe('Status Filter', () => {
        it('renders all status buttons', () => {
            renderFilterModal();
            defaultProps.allStatuses.forEach(status => {
                expect(screen.getByText(STATUS_LABELS[status])).toBeInTheDocument();
            });
        });

        it('shows correct icons for each status', () => {
            renderFilterModal();
            // Check that icons are rendered (we can't easily test specific icons in RTL)
            const statusButtons = screen.getAllByRole('button').filter(btn =>
                defaultProps.allStatuses.some(status => btn.textContent.includes(STATUS_LABELS[status]))
            );
            expect(statusButtons.length).toBe(defaultProps.allStatuses.length);
        });

        it('applies active styling to selected statuses', () => {
            renderFilterModal({ filterStatuses: ['read', 'watched'] });
            const readButton = screen.getByText(STATUS_LABELS['read']);
            const watchedButton = screen.getByText(STATUS_LABELS['watched']);
            const readingButton = screen.getByText(STATUS_LABELS['reading']);

            // Check that active buttons have the highlight style applied
            expect(readButton).toHaveAttribute('style', expect.stringContaining('var(--mt-highlight)'));
            expect(watchedButton).toHaveAttribute('style', expect.stringContaining('var(--mt-highlight)'));
            expect(readingButton).not.toHaveAttribute('style', expect.stringContaining('var(--mt-highlight)'));
        });

        it('calls toggleStatusFilter when status button is clicked', async () => {
            const user = userEvent.setup();
            renderFilterModal();
            const readButton = screen.getByText(STATUS_LABELS['read']);

            await user.click(readButton);
            expect(defaultProps.toggleStatusFilter).toHaveBeenCalledWith('read');
        });

        it('shows "No status data available" when allStatuses is empty', () => {
            renderFilterModal({ allStatuses: [] });
            expect(screen.getByText('No status data available')).toBeInTheDocument();
        });
    });

    describe('Rating Filter', () => {
        it('renders rating buttons from 1 to 5 plus Any', () => {
            renderFilterModal();
            // Find the minimum rating section (under "Min:" label)
            const minLabel = screen.getByText('Min:');
            const minSection = minLabel.parentElement;
            const anyButton = minSection.querySelector('button');
            expect(anyButton).toHaveTextContent('Any');

            for (let i = 1; i <= 5; i++) {
                expect(screen.getAllByTitle(`Minimum ${i} star${i > 1 ? 's' : ''}`)[0]).toBeInTheDocument();
            }
        });

        it('applies active styling to selected rating', () => {
            renderFilterModal({ filterRating: 3 });
            const rating3Button = screen.getAllByTitle('Minimum 3 stars')[0];
            const minLabel = screen.getByText('Min:');
            const minSection = minLabel.parentElement;
            const anyButton = minSection.querySelector('button');

            expect(rating3Button).toHaveAttribute('style', expect.stringContaining('var(--mt-highlight)'));
            expect(anyButton).not.toHaveAttribute('style', expect.stringContaining('var(--mt-highlight)'));
        });

        it('calls setFilterRating when rating button is clicked', async () => {
            const user = userEvent.setup();
            renderFilterModal();
            const rating4Button = screen.getAllByTitle('Minimum 4 stars')[0];

            await user.click(rating4Button);
            expect(defaultProps.setFilterRating).toHaveBeenCalledWith(4);
        });

        it('calls setFilterRating with 0 when Any is clicked', async () => {
            const user = userEvent.setup();
            renderFilterModal({ filterRating: 3 });
            const minLabel = screen.getByText('Min:');
            const minSection = minLabel.parentElement;
            const anyButton = minSection.querySelector('button');

            await user.click(anyButton);
            expect(defaultProps.setFilterRating).toHaveBeenCalledWith(0);
        });
    });

    describe('Recent Filter', () => {
        it('renders all recent filter options', () => {
            renderFilterModal();
            // Find the recent section and get Any button within it
            const recentSection = screen.getByText('Recently read / watched').parentElement;
            const anyButton = recentSection.querySelector('button');
            expect(anyButton).toHaveTextContent('Any');

            expect(screen.getByText('7d')).toBeInTheDocument();
            expect(screen.getByText('30d')).toBeInTheDocument();
            expect(screen.getByText('90d')).toBeInTheDocument();
        });

        it('applies active styling to selected recent filter', () => {
            renderFilterModal({ filterRecent: 'last30' });
            const last30Button = screen.getByText('30d');
            const recentSection = screen.getByText('Recently read / watched').parentElement;
            const anyButton = recentSection.querySelector('button');

            expect(last30Button).toHaveAttribute('style', expect.stringContaining('var(--mt-highlight)'));
            expect(anyButton).not.toHaveAttribute('style', expect.stringContaining('var(--mt-highlight)'));
        });

        it('calls setFilterRecent when recent filter button is clicked', async () => {
            const user = userEvent.setup();
            renderFilterModal();
            const last7Button = screen.getByText('7d');

            await user.click(last7Button);
            expect(defaultProps.setFilterRecent).toHaveBeenCalledWith('last7');
        });
    });

    describe('Tags Filter', () => {
        it('renders all tag buttons', () => {
            renderFilterModal();
            defaultProps.allTags.forEach(tag => {
                expect(screen.getByText(tag)).toBeInTheDocument();
            });
        });

        it('applies active styling to selected tags', () => {
            renderFilterModal({ filterTags: ['Fiction', 'Sci-Fi'] });
            const fictionButton = screen.getByText('Fiction');
            const sciFiButton = screen.getByText('Sci-Fi');
            const dramaButton = screen.getByText('Drama');

            expect(fictionButton).toHaveAttribute('style', expect.stringContaining('var(--mt-highlight)'));
            expect(sciFiButton).toHaveAttribute('style', expect.stringContaining('var(--mt-highlight)'));
            expect(dramaButton).not.toHaveAttribute('style', expect.stringContaining('var(--mt-highlight)'));
        });

        it('calls toggleTagFilter when tag button is clicked', async () => {
            const user = userEvent.setup();
            renderFilterModal();
            const fictionButton = screen.getByText('Fiction');

            await user.click(fictionButton);
            expect(defaultProps.toggleTagFilter).toHaveBeenCalledWith('Fiction');
        });

        it('shows "No tags available" when allTags is empty', () => {
            renderFilterModal({ allTags: [] });
            expect(screen.getByText('No tags available')).toBeInTheDocument();
        });
    });

    describe('Clear Filters Button', () => {
        it('renders clear filters button', () => {
            renderFilterModal();
            expect(screen.getByText('Clear Filters')).toBeInTheDocument();
        });

        it('calls clearFilters when clear button is clicked', async () => {
            const user = userEvent.setup();
            renderFilterModal();
            const clearButton = screen.getByText('Clear Filters');

            await user.click(clearButton);
            expect(defaultProps.clearFilters).toHaveBeenCalledTimes(1);
        });

        it('has correct title attribute', () => {
            renderFilterModal();
            const clearButton = screen.getByText('Clear Filters');
            expect(clearButton).toHaveAttribute('title', 'Clear all filters');
        });
    });

    describe('Accessibility', () => {
        it('has proper data attribute for testing', () => {
            renderFilterModal();
            expect(screen.getByTestId('filter-modal')).toBeInTheDocument();
        });

        it('has data-filter-modal attribute for click-outside detection', () => {
            renderFilterModal();
            const modal = screen.getByTestId('filter-modal');
            expect(modal).toHaveAttribute('data-filter-modal', '1');
        });

        it('rating buttons have descriptive titles', () => {
            renderFilterModal();
            expect(screen.getAllByTitle('Minimum 1 star')[0]).toBeInTheDocument();
            expect(screen.getAllByTitle('Minimum 2 stars')[0]).toBeInTheDocument();
        });
    });

    describe('Content Filters', () => {
        it('renders review and cover checkboxes', () => {
            renderFilterModal();
            expect(screen.getByText('With review')).toBeInTheDocument();
            expect(screen.getByText('Without review')).toBeInTheDocument();
            expect(screen.getByText('With cover')).toBeInTheDocument();
            expect(screen.getByText('Without cover')).toBeInTheDocument();
        });

        it('shows checkboxes as checked when filters are enabled', () => {
            renderFilterModal({
                filterHasReview: { withReview: true, withoutReview: false },
                filterHasCover: { withCover: false, withoutCover: true }
            });

            const withReviewCheckbox = screen.getByLabelText('With review');
            const withoutReviewCheckbox = screen.getByLabelText('Without review');
            const withCoverCheckbox = screen.getByLabelText('With cover');
            const withoutCoverCheckbox = screen.getByLabelText('Without cover');

            expect(withReviewCheckbox).toBeChecked();
            expect(withoutReviewCheckbox).not.toBeChecked();
            expect(withCoverCheckbox).not.toBeChecked();
            expect(withoutCoverCheckbox).toBeChecked();
        });

        it('calls setFilterHasReview when review checkboxes are changed', async () => {
            const user = userEvent.setup();
            renderFilterModal();

            const withReviewCheckbox = screen.getByLabelText('With review');
            const withoutReviewCheckbox = screen.getByLabelText('Without review');

            await user.click(withReviewCheckbox);
            expect(defaultProps.setFilterHasReview).toHaveBeenCalledWith({
                withReview: false,
                withoutReview: true
            });

            await user.click(withoutReviewCheckbox);
            expect(defaultProps.setFilterHasReview).toHaveBeenCalledWith({
                withReview: true,
                withoutReview: false
            });
        });

        it('calls setFilterHasCover when cover checkboxes are changed', async () => {
            const user = userEvent.setup();
            renderFilterModal();

            const withCoverCheckbox = screen.getByLabelText('With cover');
            const withoutCoverCheckbox = screen.getByLabelText('Without cover');

            await user.click(withCoverCheckbox);
            expect(defaultProps.setFilterHasCover).toHaveBeenCalledWith({
                withCover: false,
                withoutCover: true
            });

            await user.click(withoutCoverCheckbox);
            expect(defaultProps.setFilterHasCover).toHaveBeenCalledWith({
                withCover: true,
                withoutCover: false
            });
        });
    });

    describe('Styling and Layout', () => {
        it('applies correct CSS classes for layout', () => {
            renderFilterModal();
            const container = screen.getByTestId('filter-modal');
            expect(container).toHaveClass('mb-6', 'p-4', 'bg-slate-800/40', 'border', 'border-slate-700', 'rounded-lg');
        });

        it('uses responsive grid layout', () => {
            renderFilterModal();
            const grid = screen.getByTestId('filter-modal').querySelector('.grid');
            expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2');
        });
    });
});
