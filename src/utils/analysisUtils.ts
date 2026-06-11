import wordleData from '../../wordle.json';
import { getGuessStatuses } from './gameLogic';

/**
 * Filters the solution list based on a set of guesses and their results.
 */
export const TOTAL_SOLUTIONS = (wordleData as string[]).length;

/**
 * Counts how many words in `pool` would remain if `candidateGuess` were played
 * against `solution` — i.e. the size of the pool filtered to words producing
 * the same feedback pattern as `candidateGuess` vs `solution`.
 */
export const countRemainingForGuess = (
    candidateGuess: string,
    solution: string,
    pool: string[]
): number => {
    const targetStatuses = getGuessStatuses(candidateGuess, solution).join(',');
    let count = 0;
    for (const poolWord of pool) {
        if (getGuessStatuses(candidateGuess, poolWord).join(',') === targetStatuses) {
            count++;
        }
    }
    return count;
};

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
 * Ranks each guess against every other guess the player could have made from the
 * current solution pool, by how much each one would have narrowed the pool given
 * the actual solution. Rank 1 = fewest remaining words. Ties share the best rank.
 * Returns { rank, total } per guess; luck is conceptually rank / total — lower is
 * luckier (e.g. 1 / 10 means the player picked the best of 10 candidates).
 */
export type LuckScore = { rank: number; total: number };

export const calculateLuck = (
    guesses: string[],
    solution: string
): LuckScore[] => {
    const allSolutions = wordleData as string[];
    let currentPool = [...allSolutions];
    const scores: LuckScore[] = [];

    guesses.forEach((guess) => {
        const myRemaining = countRemainingForGuess(guess, solution, currentPool);

        let strictlyBetter = 0;
        for (const candidateGuess of currentPool) {
            if (countRemainingForGuess(candidateGuess, solution, currentPool) < myRemaining) {
                strictlyBetter++;
            }
        }

        scores.push({ rank: strictlyBetter + 1, total: currentPool.length });

        currentPool = currentPool.filter((candidate) => {
            const myStatuses = getGuessStatuses(guess, solution).join(',');
            const candidateStatuses = getGuessStatuses(guess, candidate).join(',');
            return myStatuses === candidateStatuses;
        });
    });

    return scores;
};
