import wordsData from '../../words.json';
import wordleData from '../../wordle.json';

export const getWordOfTheDay = () => {
    const solutions = wordleData as string[];
    const startDate = new Date('2026-01-01T00:00:00').getTime();
    const now = new Date().getTime();
    const diff = now - startDate;
    const index = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Use modulo in case the days exceed the list length
    return solutions[index % solutions.length].toLowerCase();
};

export const isValidWord = (word: string) => {
    return (wordsData as string[]).includes(word.toLowerCase());
};

