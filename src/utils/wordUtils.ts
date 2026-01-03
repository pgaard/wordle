import wordsData from '../../words.json';
import wordleData from '../../wordle.json';

export const getWordOfTheDay = () => {
    const solutions = wordleData as string[];

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
    return solutions[index % solutions.length].toLowerCase();
};

export const isValidWord = (word: string) => {
    return (wordsData as string[]).includes(word.toLowerCase());
};

