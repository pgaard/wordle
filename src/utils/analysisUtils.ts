import wordleData from '../../wordle.json';
import { getGuessStatuses, LetterState } from './gameLogic';

/**
 * Filters the solution list based on a set of guesses and their results.
 */
export const filterPossibleWords = (
    guesses: string[],
    solution: string
): string[][] => {
    const allSolutions = wordleData as string[];
    const results: string[][] = [];

    let currentPool = allSolutions;

    guesses.forEach((guess) => {
        const statuses = getGuessStatuses(guess, solution);

        // For each guess, find words in the current pool that would produce 
        // the SAME feedback if they were the actual solution.
        currentPool = currentPool.filter((candidate) => {
            const candidateStatuses = getGuessStatuses(guess, candidate);
            return JSON.stringify(statuses) === JSON.stringify(candidateStatuses);
        });

        results.push([...currentPool]);
    });

    return results;
};
