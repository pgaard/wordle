import wordleData from '../../wordle.json';
import { getGuessStatuses, LetterState } from './gameLogic';

/**
 * Filters the solution list based on a set of guesses and their results.
 */
export const TOTAL_SOLUTIONS = (wordleData as string[]).length;

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

/**
 * Calculates the "luck" of each guess.
 * Luck is defined as the percentile of how well the guess narrowed down the pool
 * compared to all other possible guesses (from the solution list).
 */
export const calculateLuck = (
    guesses: string[],
    solution: string
): number[] => {
    const allSolutions = wordleData as string[];
    let currentPool = [...allSolutions];
    const luckScores: number[] = [];

    guesses.forEach((guess) => {
        // 1. Calculate how many words remain after our guess
        const myStatuses = getGuessStatuses(guess, solution);
        const myRemainingDetails = currentPool.filter((candidate) => {
            const candidateStatuses = getGuessStatuses(guess, candidate);
            return JSON.stringify(myStatuses) === JSON.stringify(candidateStatuses);
        });
        const myRemainingCount = myRemainingDetails.length;

        // 2. Compare against all other possible guesses (using current pool)
        let worseOutcomeCount = 0;

        // We compare our guess against all other *currently possible* solutions
        // to see how well we did relative to the available options.
        for (const candidateGuess of currentPool) {
            const candidateStatuses = getGuessStatuses(candidateGuess, solution);

            let candidateRemainingCount = 0;
            for (const poolWord of currentPool) {
                const s = getGuessStatuses(candidateGuess, poolWord);
                if (JSON.stringify(candidateStatuses) === JSON.stringify(s)) {
                    candidateRemainingCount++;
                }
            }

            if (candidateRemainingCount > myRemainingCount) {
                worseOutcomeCount++;
            }
        }

        const percentile = Math.round((worseOutcomeCount / currentPool.length) * 100);
        luckScores.push(percentile);

        // Update pool for next iteration
        currentPool = myRemainingDetails;
    });

    return luckScores;
};
