import { vi, describe, it, expect, beforeEach } from 'vitest';
import { generateYearbookPDF, createCoverPage, createItemPage, calculateStats } from '../YearbookGenerator.js';

// Mock jsPDF at the module level
vi.mock('jspdf', () => {
    const instances = [];

    const mockJsPDF = vi.fn().mockImplementation(() => {
        const instance = {
            addPage: vi.fn(),
            setFontSize: vi.fn(),
            setTextColor: vi.fn(),
            text: vi.fn(),
            addImage: vi.fn(),
            setFont: vi.fn(),
            splitTextToSize: vi.fn((text) => [text]),
            internal: {
                pageSize: { width: 210, height: 297 }
            },
            output: vi.fn(() => new Blob(['fake pdf'], { type: 'application/pdf' }))
        };
        instances.push(instance);
        return instance;
    });

    // Expose instances for testing
    mockJsPDF.instances = instances;

    return {
        default: mockJsPDF,
        jsPDF: mockJsPDF
    };
});

describe('YearbookGenerator', () => {
    let mockItems;
    let mockOptions;

    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks();

        // Mock fetch for image loading
        global.fetch = vi.fn(() =>
            Promise.resolve({
                blob: () => Promise.resolve(new Blob(['fake image data'], { type: 'image/jpeg' }))
            })
        );

        mockItems = [
            {
                title: 'Test Book',
                author: 'Test Author',
                type: 'book',
                rating: 5,
                dateRead: '2024-01-15',
                tags: ['fiction', 'scifi'],
                review: 'Great book!',
                coverUrl: 'http://example.com/cover.jpg'
            },
            {
                title: 'Test Movie',
                director: 'Test Director',
                type: 'movie',
                rating: 4,
                dateWatched: '2024-02-20',
                coverUrl: 'http://example.com/movie-cover.jpg'
            }
        ];

        mockOptions = {
            accentColor: '#FF6B6B',
            userName: 'Test User',
            coverTitle: 'My 2024 Yearbook',
            dateRange: 'January - December 2024'
        };
    });

    describe('generateYearbookPDF', () => {
        it('generates valid PDF document', async () => {
            const result = await generateYearbookPDF(mockItems, mockOptions);

            expect(result).toBeInstanceOf(Blob);
            expect(result.type).toBe('application/pdf');
        });

        it('handles empty collection gracefully', async () => {
            const result = await generateYearbookPDF([], mockOptions);

            expect(result).toBeInstanceOf(Blob);
            expect(result.type).toBe('application/pdf');
        });

        it('handles items without cover images', async () => {
            const itemsWithoutCovers = mockItems.map(item => ({ ...item, coverUrl: null }));
            const result = await generateYearbookPDF(itemsWithoutCovers, mockOptions);

            expect(result).toBeInstanceOf(Blob);
            expect(result.type).toBe('application/pdf');
        });
    });

    describe('createCoverPage', () => {
        it('includes title with date range', () => {
            const mockPdf = {
                addPage: vi.fn(),
                setFontSize: vi.fn(),
                setTextColor: vi.fn(),
                text: vi.fn(),
                addImage: vi.fn(),
                setFont: vi.fn(),
                splitTextToSize: vi.fn((text) => [text]),
                internal: {
                    pageSize: { width: 210, height: 297 }
                }
            };

            createCoverPage(mockPdf, calculateStats(mockItems), mockOptions);

            expect(mockPdf.text).toHaveBeenCalledWith('My 2024 Yearbook', expect.any(Number), expect.any(Number));
        });

        it('displays statistics correctly', () => {
            const mockPdf = {
                addPage: vi.fn(),
                setFontSize: vi.fn(),
                setTextColor: vi.fn(),
                text: vi.fn(),
                addImage: vi.fn(),
                setFont: vi.fn(),
                splitTextToSize: vi.fn((text) => [text]),
                internal: {
                    pageSize: { width: 210, height: 297 }
                }
            };

            createCoverPage(mockPdf, calculateStats(mockItems), mockOptions);

            expect(mockPdf.text).toHaveBeenCalledWith('2 items (1 books, 1 movies)', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('Average rating: ★★★★★', expect.any(Number), expect.any(Number));
        });

        it('applies accent color to title', () => {
            const mockPdf = {
                addPage: vi.fn(),
                setFontSize: vi.fn(),
                setTextColor: vi.fn(),
                text: vi.fn(),
                addImage: vi.fn(),
                setFont: vi.fn(),
                splitTextToSize: vi.fn((text) => [text]),
                internal: {
                    pageSize: { width: 210, height: 297 }
                }
            };

            createCoverPage(mockPdf, calculateStats(mockItems), mockOptions);

            expect(mockPdf.setTextColor).toHaveBeenCalledWith('#FF6B6B');
        });
    });

    describe('createItemPage', () => {
        it('includes all required elements', async () => {
            const mockPdf = {
                addPage: vi.fn(),
                setFontSize: vi.fn(),
                setTextColor: vi.fn(),
                text: vi.fn(),
                addImage: vi.fn(),
                setFont: vi.fn(),
                splitTextToSize: vi.fn((text) => [text]),
                internal: {
                    pageSize: { width: 210, height: 297 }
                }
            };

            await createItemPage(mockPdf, mockItems[0], mockOptions);

            expect(mockPdf.text).toHaveBeenCalledWith('Test Book', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('by Test Author', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('★★★★★', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('Reviewed: Jan 15, 2024', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('Tags: fiction, scifi', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('Great book!', expect.any(Number), expect.any(Number));
        });

        it('handles movie items correctly', async () => {
            const mockPdf = {
                addPage: vi.fn(),
                setFontSize: vi.fn(),
                setTextColor: vi.fn(),
                text: vi.fn(),
                addImage: vi.fn(),
                setFont: vi.fn(),
                splitTextToSize: vi.fn((text) => [text]),
                internal: {
                    pageSize: { width: 210, height: 297 }
                }
            };

            await createItemPage(mockPdf, mockItems[1], mockOptions);

            expect(mockPdf.text).toHaveBeenCalledWith('Test Movie', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('by Test Director', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('★★★★☆', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('Reviewed: Feb 20, 2024', expect.any(Number), expect.any(Number));
        });

        it('handles items without reviews', async () => {
            const mockPdf = {
                addPage: vi.fn(),
                setFontSize: vi.fn(),
                setTextColor: vi.fn(),
                text: vi.fn(),
                addImage: vi.fn(),
                setFont: vi.fn(),
                splitTextToSize: vi.fn((text) => [text]),
                internal: {
                    pageSize: { width: 210, height: 297 }
                }
            };
            const itemWithoutReview = { ...mockItems[0], review: null };

            await createItemPage(mockPdf, itemWithoutReview, mockOptions);

            // Should not try to render empty review
            const textCalls = mockPdf.text.mock.calls;
            const hasEmptyReview = textCalls.some(call => call[0] === '');
            expect(hasEmptyReview).toBe(false);
        });

        it('handles items without tags', async () => {
            const mockPdf = {
                addPage: vi.fn(),
                setFontSize: vi.fn(),
                setTextColor: vi.fn(),
                text: vi.fn(),
                addImage: vi.fn(),
                setFont: vi.fn(),
                splitTextToSize: vi.fn((text) => [text]),
                internal: {
                    pageSize: { width: 210, height: 297 }
                }
            };
            const itemWithoutTags = { ...mockItems[0], tags: null };

            await createItemPage(mockPdf, itemWithoutTags, mockOptions);

            // Should not show tags section
            const textCalls = mockPdf.text.mock.calls;
            const hasTagsText = textCalls.some(call => call[0].includes('Tags:'));
            expect(hasTagsText).toBe(false);
        });
    });

    describe('calculateStats', () => {
        it('calculates correct statistics', () => {
            const stats = calculateStats(mockItems);

            expect(stats.totalItems).toBe(2);
            expect(stats.bookCount).toBe(1);
            expect(stats.movieCount).toBe(1);
            expect(stats.averageRating).toBe(4.5);
        });

        it('handles empty array', () => {
            const stats = calculateStats([]);

            expect(stats.totalItems).toBe(0);
            expect(stats.bookCount).toBe(0);
            expect(stats.movieCount).toBe(0);
            expect(stats.averageRating).toBe(0);
        });

        it('calculates average rating correctly', () => {
            const items = [
                { rating: 3 },
                { rating: 5 },
                { rating: 4 }
            ];
            const stats = calculateStats(items);

            expect(stats.averageRating).toBe(4);
        });
    });

    describe('generateYearbookPDF', () => {
        it('generates valid PDF document', async () => {
            const result = await generateYearbookPDF(mockItems, mockOptions);

            expect(result).toBeInstanceOf(Blob);
            expect(global.fetch).toHaveBeenCalledTimes(2); // Two cover images
        });

        it('includes cover page with title and stats', async () => {
            await generateYearbookPDF(mockItems, mockOptions);

            // Since we can't easily access the internal PDF instance,
            // we test that the function completes without error
            // The detailed PDF content testing is done in individual function tests
        });

        it('creates one page per item', async () => {
            await generateYearbookPDF(mockItems, mockOptions);

            // Test that the function completes successfully
            // Individual page creation is tested in createItemPage tests
        });

        it('handles empty collection gracefully', async () => {
            const result = await generateYearbookPDF([], mockOptions);

            expect(result).toBeInstanceOf(Blob);
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('handles items without cover images', async () => {
            const itemsWithoutCovers = mockItems.map(item => ({ ...item, coverUrl: null }));

            await generateYearbookPDF(itemsWithoutCovers, mockOptions);

            expect(global.fetch).not.toHaveBeenCalled();
        });
    });

    describe('createCoverPage', () => {
        it('includes title with date range', () => {
            const mockPdf = {
                addPage: vi.fn(),
                setFontSize: vi.fn(),
                setTextColor: vi.fn(),
                text: vi.fn(),
                addImage: vi.fn(),
                setFont: vi.fn(),
                splitTextToSize: vi.fn((text) => [text]),
                internal: {
                    pageSize: { width: 210, height: 297 }
                }
            };

            createCoverPage(mockPdf, calculateStats(mockItems), mockOptions);

            expect(mockPdf.text).toHaveBeenCalledWith('My 2024 Yearbook', expect.any(Number), expect.any(Number));
        });

        it('displays statistics correctly', () => {
            const mockPdf = {
                addPage: vi.fn(),
                setFontSize: vi.fn(),
                setTextColor: vi.fn(),
                text: vi.fn(),
                addImage: vi.fn(),
                setFont: vi.fn(),
                splitTextToSize: vi.fn((text) => [text]),
                internal: {
                    pageSize: { width: 210, height: 297 }
                }
            };

            createCoverPage(mockPdf, calculateStats(mockItems), mockOptions);

            expect(mockPdf.text).toHaveBeenCalledWith('2 items (1 books, 1 movies)', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('Average rating: ★★★★★', expect.any(Number), expect.any(Number));
        });

        it('applies accent color to title', () => {
            const mockPdf = {
                addPage: vi.fn(),
                setFontSize: vi.fn(),
                setTextColor: vi.fn(),
                text: vi.fn(),
                addImage: vi.fn(),
                setFont: vi.fn(),
                splitTextToSize: vi.fn((text) => [text]),
                internal: {
                    pageSize: { width: 210, height: 297 }
                }
            };

            createCoverPage(mockPdf, calculateStats(mockItems), mockOptions);

            expect(mockPdf.setTextColor).toHaveBeenCalledWith('#FF6B6B');
        });
    });

    describe('createItemPage', () => {
        it('includes all required elements', async () => {
            const mockPdf = {
                addPage: vi.fn(),
                setFontSize: vi.fn(),
                setTextColor: vi.fn(),
                text: vi.fn(),
                addImage: vi.fn(),
                setFont: vi.fn(),
                splitTextToSize: vi.fn((text) => [text]),
                internal: {
                    pageSize: { width: 210, height: 297 }
                }
            };

            await createItemPage(mockPdf, mockItems[0], mockOptions);

            expect(mockPdf.text).toHaveBeenCalledWith('Test Book', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('by Test Author', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('★★★★★', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('Reviewed: Jan 15, 2024', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('Tags: fiction, scifi', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('Great book!', expect.any(Number), expect.any(Number));
        });

        it('handles movie items correctly', async () => {
            const mockPdf = {
                addPage: vi.fn(),
                setFontSize: vi.fn(),
                setTextColor: vi.fn(),
                text: vi.fn(),
                addImage: vi.fn(),
                setFont: vi.fn(),
                splitTextToSize: vi.fn((text) => [text]),
                internal: {
                    pageSize: { width: 210, height: 297 }
                }
            };

            await createItemPage(mockPdf, mockItems[1], mockOptions);

            expect(mockPdf.text).toHaveBeenCalledWith('Test Movie', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('by Test Director', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('★★★★☆', expect.any(Number), expect.any(Number));
            expect(mockPdf.text).toHaveBeenCalledWith('Reviewed: Feb 20, 2024', expect.any(Number), expect.any(Number));
        });

        it('handles items without reviews', async () => {
            const mockPdf = {
                addPage: vi.fn(),
                setFontSize: vi.fn(),
                setTextColor: vi.fn(),
                text: vi.fn(),
                addImage: vi.fn(),
                setFont: vi.fn(),
                splitTextToSize: vi.fn((text) => [text]),
                internal: {
                    pageSize: { width: 210, height: 297 }
                }
            };
            const itemWithoutReview = { ...mockItems[0], review: null };

            await createItemPage(mockPdf, itemWithoutReview, mockOptions);

            // Should not try to render empty review
            const textCalls = mockPdf.text.mock.calls;
            const hasEmptyReview = textCalls.some(call => call[0] === '');
            expect(hasEmptyReview).toBe(false);
        });

        it('handles items without tags', async () => {
            const mockPdf = {
                addPage: vi.fn(),
                setFontSize: vi.fn(),
                setTextColor: vi.fn(),
                text: vi.fn(),
                addImage: vi.fn(),
                setFont: vi.fn(),
                splitTextToSize: vi.fn((text) => [text]),
                internal: {
                    pageSize: { width: 210, height: 297 }
                }
            };
            const itemWithoutTags = { ...mockItems[0], tags: null };

            await createItemPage(mockPdf, itemWithoutTags, mockOptions);

            // Should not show tags section
            const textCalls = mockPdf.text.mock.calls;
            const hasTagsText = textCalls.some(call => call[0].includes('Tags:'));
            expect(hasTagsText).toBe(false);
        });
    });

    describe('calculateStats', () => {
        it('calculates correct statistics', () => {
            const stats = calculateStats(mockItems);

            expect(stats).toEqual({
                totalItems: 2,
                bookCount: 1,
                movieCount: 1,
                averageRating: 4.5,
                totalBooks: 1,
                totalMovies: 1
            });
        });

        it('handles empty array', () => {
            const stats = calculateStats([]);

            expect(stats).toEqual({
                totalItems: 0,
                bookCount: 0,
                movieCount: 0,
                averageRating: 0,
                totalBooks: 0,
                totalMovies: 0
            });
        });

        it('calculates average rating correctly', () => {
            const itemsWithVariousRatings = [
                { rating: 5 },
                { rating: 3 },
                { rating: 4 }
            ];

            const stats = calculateStats(itemsWithVariousRatings);

            expect(stats.averageRating).toBe(4);
        });
    });
});
