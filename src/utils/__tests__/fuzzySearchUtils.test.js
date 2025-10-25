import { describe, it, expect } from 'vitest';
import { generateFuzzyAlternatives, shouldTryFuzzySearch, fuzzySearch } from '../fuzzySearchUtils.js';

describe('Fuzzy Search Utils', () => {
    describe('generateFuzzyAlternatives', () => {
        it('should return empty array for short queries', () => {
            expect(generateFuzzyAlternatives('hi')).toEqual([]);
            expect(generateFuzzyAlternatives('')).toEqual([]);
        });

        it('should generate spelling corrections', () => {
            const alternatives = generateFuzzyAlternatives('recieve');
            expect(alternatives).toContain('receive');
        });

        it('should generate partial matches for long queries', () => {
            const alternatives = generateFuzzyAlternatives('harry potter and the chamber of secrets');
            expect(alternatives.length).toBeGreaterThan(0);
            expect(alternatives.some(alt => alt.includes('harry potter'))).toBe(true);
        });

        it('should not include the original query in alternatives', () => {
            const alternatives = generateFuzzyAlternatives('test query');
            expect(alternatives).not.toContain('test query');
        });
    });

    describe('shouldTryFuzzySearch', () => {
        it('should return true for empty results', () => {
            expect(shouldTryFuzzySearch([])).toBe(true);
            expect(shouldTryFuzzySearch(null)).toBe(true);
        });

        it('should return false for sufficient results', () => {
            expect(shouldTryFuzzySearch([1, 2, 3])).toBe(false);
        });
    });

    describe('fuzzySearch', () => {
        const mockItems = [
            { title: 'Harry Potter', author: 'J.K. Rowling' },
            { title: 'The Hobbit', author: 'J.R.R. Tolkien' },
            { title: '1984', author: 'George Orwell' }
        ];

        it('should return empty array for empty inputs', () => {
            expect(fuzzySearch('', mockItems)).toEqual([]);
            expect(fuzzySearch('test', [])).toEqual([]);
        });

        it('should find exact matches', () => {
            const results = fuzzySearch('Harry Potter', mockItems);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].title).toBe('Harry Potter');
        });

        it('should find fuzzy matches', () => {
            const results = fuzzySearch('Hary Potter', mockItems); // misspelled
            expect(results.length).toBeGreaterThan(0);
        });
    });
});
