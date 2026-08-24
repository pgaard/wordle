import wordsData from '../../words.json';
import wordleData from '../../wordle.json';
import words6Data from '../../words6.json';
import wordle6Data from '../../wordle6.json';

export type WordLength = 5 | 6;

export const WORD_LENGTHS: WordLength[] = [5, 6];
export const MAX_GUESSES = 6;

const lower = (words: string[]) => words.map((w) => w.toLowerCase());

const solutionLists: Record<WordLength, string[]> = {
    5: lower(wordleData as string[]),
    6: lower(wordle6Data as string[]),
};

// Both lengths split guesses from answers: every word in the big dictionary is
// legal to type, but only the curated list can be the answer. words6.json is a
// raw scraped list carrying ~17% plurals plus outright non-words (fourty,
// doesnt), so wordle6.json holds the filtered subset. It is generated,
// not hand-edited -- see scripts/README.md.
const validWordSets: Record<WordLength, Set<string>> = {
    5: new Set([...lower(wordsData as string[]), ...solutionLists[5]]),
    6: new Set([...lower(words6Data as string[]), ...solutionLists[6]]),
};

export const getSolutionList = (wordLength: WordLength): string[] => solutionLists[wordLength];

export const getWordOfTheDay = (wordLength: WordLength) => {
    const solutions = solutionLists[wordLength];

    // Check for "word" query parameter to override date-based selection
    const urlParams = new URLSearchParams(window.location.search);
    const wordParam = urlParams.get('word');

    let index: number;

    if (wordParam !== null && !isNaN(parseInt(wordParam))) {
        index = parseInt(wordParam);
    } else {
        const startDate = new Date('2026-01-01T00:00:00').getTime();
        const now = new Date().getTime();
        const diff = now - startDate;
        index = Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    // Use modulo in case the days or provided index exceed the list length
    return solutions[index % solutions.length];
};

export const isValidWord = (word: string, wordLength: WordLength) => {
    return validWordSets[wordLength].has(word.toLowerCase());
};
