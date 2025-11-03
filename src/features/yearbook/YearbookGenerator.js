import jsPDF from 'jspdf';

/**
 * Render markdown text with basic formatting in PDF
 * @param {jsPDF} pdf - PDF document
 * @param {string} markdown - Markdown text
 * @param {number} x - X position
 * @param {number} y - Y Position
 * @param {number} maxWidth - Maximum width for text
 * @param {object} styles - Style options
 * @returns {number} New Y position after rendering
 */
function renderMarkdownToPDF(pdf, markdown, x, y, maxWidth, styles) {
    if (!markdown) return y;

    const lines = markdown.split('\n');
    let currentY = y;

    for (const line of lines) {
        // Handle different markdown elements
        if (line.startsWith('# ')) {
            // Header
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(styles.fonts.subtitle.size);
            pdf.setTextColor(styles.colors.text[0], styles.colors.text[1], styles.colors.text[2]);
            const headerText = line.substring(2).trim();
            const wrappedHeader = pdf.splitTextToSize(headerText, maxWidth);
            pdf.text(wrappedHeader, x, currentY);
            currentY += (wrappedHeader.length || 1) * styles.fonts.subtitle.size * 0.4;
        } else if (line.startsWith('## ')) {
            // Subheader
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(styles.fonts.body.size + 2);
            pdf.setTextColor(styles.colors.text[0], styles.colors.text[1], styles.colors.text[2]);
            const subheaderText = line.substring(3).trim();
            const wrappedSubheader = pdf.splitTextToSize(subheaderText, maxWidth);
            pdf.text(wrappedSubheader, x, currentY);
            currentY += (wrappedSubheader.length || 1) * (styles.fonts.body.size + 2) * 0.4;
        } else if (line.match(/^[\s]*[-*+]\s+/)) {
            // List item
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(styles.fonts.body.size);
            pdf.setTextColor(styles.colors.text[0], styles.colors.text[1], styles.colors.text[2]);
            const listText = '• ' + line.replace(/^[\s]*[-*+]\s+/, '');
            const wrappedList = pdf.splitTextToSize(listText, maxWidth);
            pdf.text(wrappedList, x, currentY);
            currentY += (wrappedList.length || 1) * styles.fonts.body.size * 0.4;
        } else if (line.match(/^[\s]*\d+\.\s+/)) {
            // Numbered list
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(styles.fonts.body.size);
            pdf.setTextColor(styles.colors.text[0], styles.colors.text[1], styles.colors.text[2]);
            const wrappedNumbered = pdf.splitTextToSize(line, maxWidth);
            pdf.text(wrappedNumbered, x, currentY);
            currentY += (wrappedNumbered.length || 1) * styles.fonts.body.size * 0.4;
        } else if (line.trim() === '') {
            // Empty line
            currentY += styles.fonts.body.size * 0.4;
        } else {
            // Regular paragraph with inline formatting
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(styles.fonts.body.size);
            pdf.setTextColor(styles.colors.text[0], styles.colors.text[1], styles.colors.text[2]);

            // Handle inline formatting
            let processedLine = line;
            let boldSegments = [];
            let italicSegments = [];

            // Extract bold text (**text** or __text__)
            processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, (match, text) => {
                boldSegments.push(text);
                return `__BOLD_${boldSegments.length - 1}__`;
            });
            processedLine = processedLine.replace(/__(.*?)__/g, (match, text) => {
                boldSegments.push(text);
                return `__BOLD_${boldSegments.length - 1}__`;
            });

            // Extract italic text (*text* or _text_)
            processedLine = processedLine.replace(/\*(.*?)\*/g, (match, text) => {
                italicSegments.push(text);
                return `__ITALIC_${italicSegments.length - 1}__`;
            });
            processedLine = processedLine.replace(/_(.*?)_/g, (match, text) => {
                italicSegments.push(text);
                return `__ITALIC_${italicSegments.length - 1}__`;
            });

            // Handle links [text](url)
            processedLine = processedLine.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

            // Handle inline code `text`
            processedLine = processedLine.replace(/`(.*?)`/g, '"$1"');

            // Split into segments and render
            const segments = processedLine.split(/(__BOLD_\d+__|__ITALIC_\d+__)/);
            let currentX = x;

            for (const segment of segments) {
                if (segment.match(/__BOLD_(\d+)__/)) {
                    const index = parseInt(segment.match(/__BOLD_(\d+)__/)[1]);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(styles.colors.text[0], styles.colors.text[1], styles.colors.text[2]);
                    const text = boldSegments[index];
                    const textWidth = pdf.getTextWidth(text);
                    if (currentX + textWidth > x + maxWidth) {
                        currentY += styles.fonts.body.size * 0.4;
                        currentX = x;
                    }
                    pdf.text(text, currentX, currentY);
                    currentX += textWidth;
                } else if (segment.match(/__ITALIC_(\d+)__/)) {
                    const index = parseInt(segment.match(/__ITALIC_(\d+)__/)[1]);
                    pdf.setFont('helvetica', 'italic');
                    pdf.setTextColor(styles.colors.text[0], styles.colors.text[1], styles.colors.text[2]);
                    const text = italicSegments[index];
                    const textWidth = pdf.getTextWidth(text);
                    if (currentX + textWidth > x + maxWidth) {
                        currentY += styles.fonts.body.size * 0.4;
                        currentX = x;
                    }
                    pdf.text(text, currentX, currentY);
                    currentX += textWidth;
                } else if (segment.trim()) {
                    pdf.setFont('helvetica', 'normal');
                    pdf.setTextColor(styles.colors.text[0], styles.colors.text[1], styles.colors.text[2]);
                    const words = segment.split(' ');
                    for (const word of words) {
                        const wordWidth = pdf.getTextWidth(word + ' ');
                        if (currentX + wordWidth > x + maxWidth && currentX > x) {
                            currentY += styles.fonts.body.size * 0.4;
                            currentX = x;
                        }
                        pdf.text(word + ' ', currentX, currentY);
                        currentX += wordWidth;
                    }
                }
            }

            currentY += styles.fonts.body.size * 0.4;
        }
    }

    return currentY;
}

/**
 * PDF generation styles and constants
 */
const YEARBOOK_STYLES = {
    fonts: {
        title: { size: 24, weight: 'bold' },
        subtitle: { size: 16, weight: 'normal' },
        body: { size: 11, weight: 'normal' },
        small: { size: 9, weight: 'normal' }
    },
    spacing: {
        pageMargin: 40,
        sectionGap: 20,
        elementGap: 10
    },
    colors: {
        text: [26, 26, 26], // #1a1a1a
        textLight: [102, 102, 102], // #666666
        divider: [224, 224, 224], // #e0e0e0
        accent: null // set from user preferences
    },
    images: {
        maxWidth: 300,
        maxHeight: 400
    },
    page: {
        width: 595, // A4 width in points
        height: 842 // A4 height in points
    }
};

/**
 * Generate a yearbook PDF from filtered items
 * @param {object[]} items - Array of filtered items
 * @param {object} options - PDF generation options
 * @returns {Promise<Blob>} PDF blob
 */
export async function generateYearbookPDF(items, options) {
    console.log('generateYearbookPDF called with', items?.length || 0, 'items');
    console.log('Options:', options);

    const pdf = new jsPDF();
    console.log('Created jsPDF instance');

    // Add a test text to ensure PDF is not blank
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0); // Black text
    pdf.text('PDF Generation Test - If you see this, PDF is working!', 20, 20);
    console.log('Added test text to PDF');

    // Set accent color - convert hex to RGB for jsPDF
    let accentColor = [124, 58, 237]; // Default purple
    if (options.accentColor && options.accentColor.startsWith('#')) {
        // Convert hex to RGB
        const hex = options.accentColor.slice(1);
        accentColor = [
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16)
        ];
    }
    YEARBOOK_STYLES.colors.accent = accentColor;
    console.log('Set accent color to:', accentColor);

    // Create cover page
    const stats = calculateStats(items);
    console.log('Calculated stats:', stats);
    createCoverPage(pdf, stats, options);
    console.log('Created cover page');

    // Create individual item pages
    console.log('Starting to create', items.length, 'item pages');
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log(`Creating page ${i + 1} for item:`, item.title);
        pdf.addPage();
        await createItemPage(pdf, item);
        console.log(`Completed page ${i + 1}`);
    }

    console.log('All pages created, generating blob...');
    // Return PDF as blob
    const blob = pdf.output('blob');
    console.log('Generated blob with size:', blob.size);

    return blob;
}/**
 * Create the cover page with title and statistics
 * @param {jsPDF} pdf - PDF document
 * @param {object} stats - Collection statistics
 * @param {object} options - PDF options
 */
export function createCoverPage(pdf, stats, options) {
    console.log('Creating cover page with stats:', stats, 'and options:', options);
    const { pageMargin, sectionGap } = YEARBOOK_STYLES.spacing;
    let yPosition = pageMargin;

    // Title
    pdf.setFontSize(YEARBOOK_STYLES.fonts.title.size);
    pdf.setTextColor(YEARBOOK_STYLES.colors.accent[0], YEARBOOK_STYLES.colors.accent[1], YEARBOOK_STYLES.colors.accent[2]);
    pdf.text(options.coverTitle, pageMargin, yPosition);
    console.log('Added title:', options.coverTitle);
    yPosition += sectionGap * 2;

    // Subtitle/date range
    pdf.setFontSize(YEARBOOK_STYLES.fonts.subtitle.size);
    pdf.setTextColor(YEARBOOK_STYLES.colors.text[0], YEARBOOK_STYLES.colors.text[1], YEARBOOK_STYLES.colors.text[2]);
    pdf.text(options.dateRange, pageMargin, yPosition);
    console.log('Added date range:', options.dateRange);
    yPosition += sectionGap * 2;

    // Statistics
    pdf.setFontSize(YEARBOOK_STYLES.fonts.body.size);

    const statLines = [
        `${stats.totalItems} items (${stats.bookCount} books, ${stats.movieCount} movies)`,
        `Average rating: ${stats.averageRating > 0 ? '★'.repeat(Math.min(Math.max(Math.round(stats.averageRating), 0), 5)) + '☆'.repeat(Math.max(5 - Math.min(Math.max(Math.round(stats.averageRating), 0), 5), 0)) + ` (${stats.averageRating.toFixed(1)})` : 'N/A'}`
    ];

    console.log('Adding stat lines:', statLines);
    statLines.forEach(line => {
        pdf.setTextColor(YEARBOOK_STYLES.colors.text[0], YEARBOOK_STYLES.colors.text[1], YEARBOOK_STYLES.colors.text[2]);
        pdf.text(line, pageMargin, yPosition);
        yPosition += YEARBOOK_STYLES.spacing.elementGap;
    });

    console.log('Cover page creation completed');
}/**
 * Create a page for an individual item
 * @param {jsPDF} pdf - PDF document
 * @param {object} item - Item data
 */
export async function createItemPage(pdf, item) {
    const { pageMargin, sectionGap, elementGap } = YEARBOOK_STYLES.spacing;
    let yPosition = pageMargin;

    // Cover image (if available)
    if (item.coverUrl && item.coverUrl.trim()) {
        try {
            console.log('Loading cover image for:', item.title, 'URL starts with:', item.coverUrl.substring(0, 50) + '...');

            // Check if it's already a data URL
            if (item.coverUrl.startsWith('data:image/')) {
                console.log('Using data URL directly for:', item.title);
                const imgWidth = 120;
                const imgHeight = 180;
                const centerX = (YEARBOOK_STYLES.page.width - imgWidth) / 2;

                // Determine image format from data URL (jsPDF supports JPEG, PNG, GIF)
                let imageFormat = 'JPEG';
                if (item.coverUrl.includes('data:image/png')) {
                    imageFormat = 'PNG';
                } else if (item.coverUrl.includes('data:image/gif')) {
                    imageFormat = 'GIF';
                }
                // WebP and other formats default to JPEG

                try {
                    pdf.addImage(item.coverUrl, imageFormat, centerX, yPosition, imgWidth, imgHeight);
                    yPosition += imgHeight + sectionGap;
                    console.log('Successfully added data URL image to PDF');
                } catch (pdfError) {
                    console.warn('PDF addImage failed for data URL:', pdfError);
                    pdf.setFontSize(YEARBOOK_STYLES.fonts.small.size);
                    pdf.setTextColor(YEARBOOK_STYLES.colors.textLight[0], YEARBOOK_STYLES.colors.textLight[1], YEARBOOK_STYLES.colors.textLight[2]);
                    pdf.text('[Cover image format not supported]', pageMargin, yPosition + 20);
                    yPosition += sectionGap;
                }
            } else {
                // Try to load from external URL
                console.log('Loading external image for:', item.title, 'URL:', item.coverUrl);
                const imageData = await loadImageAsBase64(item.coverUrl);
                const imgWidth = 120;
                const imgHeight = 180;
                const centerX = (YEARBOOK_STYLES.page.width - imgWidth) / 2;

                // Determine image format from data URL (jsPDF supports JPEG, PNG, GIF)
                let imageFormat = 'JPEG';
                if (imageData.includes('data:image/png')) {
                    imageFormat = 'PNG';
                } else if (imageData.includes('data:image/gif')) {
                    imageFormat = 'GIF';
                }
                // WebP and other formats default to JPEG

                try {
                    pdf.addImage(imageData, imageFormat, centerX, yPosition, imgWidth, imgHeight);
                    yPosition += imgHeight + sectionGap;
                    console.log('Successfully added external image to PDF');
                } catch (pdfError) {
                    console.warn('PDF addImage failed for external image:', pdfError);
                    pdf.setFontSize(YEARBOOK_STYLES.fonts.small.size);
                    pdf.setTextColor(YEARBOOK_STYLES.colors.textLight[0], YEARBOOK_STYLES.colors.textLight[1], YEARBOOK_STYLES.colors.textLight[2]);
                    pdf.text('[Cover image format not supported]', pageMargin, yPosition + 20);
                    yPosition += sectionGap;
                }
            }
        } catch (error) {
            console.warn('Failed to load cover image for PDF:', item.title, error);
            // Add a placeholder text instead
            pdf.setFontSize(YEARBOOK_STYLES.fonts.small.size);
            pdf.setTextColor(YEARBOOK_STYLES.colors.textLight[0], YEARBOOK_STYLES.colors.textLight[1], YEARBOOK_STYLES.colors.textLight[2]);
            pdf.text('[Cover image not available]', pageMargin, yPosition + 20);
            yPosition += sectionGap;
        }
    } else {
        console.log('No cover URL for:', item.title, 'coverUrl value:', item.coverUrl);
        yPosition += sectionGap;
    }

    // Title (with text wrapping)
    pdf.setFontSize(YEARBOOK_STYLES.fonts.title.size);
    pdf.setTextColor(YEARBOOK_STYLES.colors.accent[0], YEARBOOK_STYLES.colors.accent[1], YEARBOOK_STYLES.colors.accent[2]);
    const maxTitleWidth = YEARBOOK_STYLES.page.width - (pageMargin * 2);
    const wrappedTitle = pdf.splitTextToSize(item.title, maxTitleWidth);
    pdf.text(wrappedTitle, pageMargin, yPosition);
    yPosition += (wrappedTitle.length || 1) * YEARBOOK_STYLES.fonts.title.size * 0.4 + elementGap;

    // Author/Director
    pdf.setFontSize(YEARBOOK_STYLES.fonts.body.size);
    pdf.setTextColor(YEARBOOK_STYLES.colors.text[0], YEARBOOK_STYLES.colors.text[1], YEARBOOK_STYLES.colors.text[2]);
    const creator = item.type === 'book' ? item.author : item.director;
    if (creator) {
        pdf.text(`by ${creator}`, pageMargin, yPosition);
        yPosition += elementGap;
    }

    // Rating stars (using Unicode stars)
    pdf.setTextColor(YEARBOOK_STYLES.colors.accent[0], YEARBOOK_STYLES.colors.accent[1], YEARBOOK_STYLES.colors.accent[2]);
    pdf.setFont('helvetica', 'normal');
    const rating = Math.min(Math.max(item.rating || 0, 0), 5);
    const filledStars = '★'.repeat(rating);
    const emptyStars = '☆'.repeat(5 - rating);
    pdf.text(`${filledStars}${emptyStars} (${rating}/5)`, pageMargin, yPosition);
    yPosition += elementGap;

    // Date reviewed
    pdf.setTextColor(YEARBOOK_STYLES.colors.textLight[0], YEARBOOK_STYLES.colors.textLight[1], YEARBOOK_STYLES.colors.textLight[2]);
    const dateField = item.type === 'book' ? item.dateRead : item.dateWatched;
    if (dateField) {
        // Parse date as local date (not UTC) to avoid timezone shifts
        const date = new Date(dateField + 'T00:00:00');
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        pdf.text(`Reviewed: ${formattedDate}`, pageMargin, yPosition);
        yPosition += elementGap;
    }

    // Tags
    if (item.tags && item.tags.length > 0) {
        pdf.text(`Tags: ${item.tags.join(', ')}`, pageMargin, yPosition);
        yPosition += elementGap;
    }

    // Review text with markdown rendering
    if (item.review && item.review.trim()) {
        yPosition += elementGap;
        const maxWidth = YEARBOOK_STYLES.page.width - (pageMargin * 2);
        yPosition = renderMarkdownToPDF(pdf, item.review, pageMargin, yPosition, maxWidth, YEARBOOK_STYLES);
    }
}

/**
 * Calculate statistics for the item collection
 * @param {object[]} items - Array of items
 * @returns {object} Statistics object
 */
export function calculateStats(items) {
    if (!items || items.length === 0) {
        return {
            totalItems: 0,
            bookCount: 0,
            movieCount: 0,
            averageRating: 0,
            totalBooks: 0,
            totalMovies: 0
        };
    }

    const totalItems = items.length;
    const bookCount = items.filter(item => item.type === 'book').length;
    const movieCount = items.filter(item => item.type === 'movie').length;
    const averageRating = items.reduce((sum, item) => sum + Math.min(Math.max(item.rating || 0, 0), 5), 0) / totalItems;

    return {
        totalItems,
        bookCount,
        movieCount,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalBooks: bookCount,
        totalMovies: movieCount
    };
}

/**
 * Load an image from URL and convert to base64 for PDF embedding
 * @param {string} url - Image URL
 * @returns {Promise<string>} Base64 encoded image data
 */
async function loadImageAsBase64(url) {
    // Try different loading strategies
    const strategies = [
        // Strategy 1: Direct fetch (may work for same-origin or CORS-enabled images)
        async () => {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) throw new Error(`Invalid image type: ${blob.type}`);
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        },
        // Strategy 2: CORS mode
        async () => {
            const response = await fetch(url, {
                mode: 'cors',
                headers: { 'Accept': 'image/*' }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) throw new Error(`Invalid image type: ${blob.type}`);
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
    ];

    for (const strategy of strategies) {
        try {
            console.log(`Attempting to load image: ${url}`);
            const result = await strategy();
            console.log(`Successfully loaded image: ${url}`);
            return result;
        } catch (error) {
            console.warn(`Strategy failed for ${url}:`, error.message);
            continue;
        }
    }

    throw new Error(`All strategies failed to load image: ${url}`);
}
