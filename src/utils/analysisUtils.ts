import { getSolutionList, WordLength } from './wordUtils';

/* ------------------------------------------------------------------ *
 * Fast feedback-pattern encoding
 *
 * The analysis is O(pool^2) pattern comparisons, and the 6-letter pool is
 * ~5100 words (vs ~2300 for 5), so the naive string version is too slow.
 * Words are encoded once as letter indices and a guess/solution pair is
 * reduced to a single base-3 integer (0=absent, 1=present, 2=correct).
 * ------------------------------------------------------------------ */

const encodeWord = (word: string): Uint8Array => {
    const codes = new Uint8Array(word.length);
    for (let i = 0; i < word.length; i++) {
        codes[i] = word.charCodeAt(i) - 97; // 'a'
    }
    return codes;
};

const encodePool = (pool: string[]): Uint8Array[] => pool.map(encodeWord);

// Scratch buffers reused across calls; patternCode is strictly synchronous.
const letterCounts = new Int8Array(26);
const patternDigits = new Uint8Array(8);

const patternCode = (guess: Uint8Array, solution: Uint8Array): number => {
    const n = guess.length;

    for (let i = 0; i < n; i++) letterCounts[solution[i]]++;

    for (let i = 0; i < n; i++) {
        if (guess[i] === solution[i]) {
            patternDigits[i] = 2;
            letterCounts[guess[i]]--;
        } else {
            patternDigits[i] = 0;
        }
    }

    for (let i = 0; i < n; i++) {
        if (patternDigits[i] === 2) continue;
        if (letterCounts[guess[i]] > 0) {
            patternDigits[i] = 1;
            letterCounts[guess[i]]--;
        }
    }

    let code = 0;
    for (let i = n - 1; i >= 0; i--) code = code * 3 + patternDigits[i];

    for (let i = 0; i < n; i++) letterCounts[solution[i]] = 0;

    return code;
};

/* ------------------------------------------------------------------ */

export const getTotalSolutions = (wordLength: WordLength): number =>
    getSolutionList(wordLength).length;

const solutionSets: Partial<Record<WordLength, Set<string>>> = {};

const getSolutionSet = (wordLength: WordLength): Set<string> => {
    let set = solutionSets[wordLength];
    if (!set) {
        set = new Set(getSolutionList(wordLength));
        solutionSets[wordLength] = set;
    }
    return set;
};

/**
 * Whether a word is in the solution list at all (i.e. could ever be an answer).
 * A valid guess can be absent from this list — it's accepted but never the answer.
 */
export const isPossibleSolutionWord = (word: string, wordLength: WordLength): boolean =>
    getSolutionSet(wordLength).has(word.toLowerCase());

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
    const encodedGuess = encodeWord(candidateGuess.toLowerCase());
    const encodedSolution = encodeWord(solution.toLowerCase());
    const target = patternCode(encodedGuess, encodedSolution);

    let count = 0;
    for (const poolWord of pool) {
        if (patternCode(encodedGuess, encodeWord(poolWord.toLowerCase())) === target) count++;
    }
    return count;
};

/**
 * `countRemainingForGuess` for every word in the pool at once, sharing a single
 * encoding pass. Returns counts parallel to `pool`.
 */
export const countRemainingForPool = (pool: string[], solution: string): number[] => {
    const encodedPool = encodePool(pool.map((w) => w.toLowerCase()));
    const encodedSolution = encodeWord(solution.toLowerCase());

    return encodedPool.map((candidate) => {
        const target = patternCode(candidate, encodedSolution);
        let count = 0;
        for (const poolWord of encodedPool) {
            if (patternCode(candidate, poolWord) === target) count++;
        }
        return count;
    });
};

/**
 * Filters the solution list based on a set of guesses and their results.
 * Returns the remaining pool after each guess.
 */
export const filterPossibleWords = (
    guesses: string[],
    solution: string,
    wordLength: WordLength
): string[][] => {
    const encodedSolution = encodeWord(solution.toLowerCase());
    let currentPool = getSolutionList(wordLength);
    let encodedCurrentPool = encodePool(currentPool);
    const results: string[][] = [];

    guesses.forEach((guess) => {
        const encodedGuess = encodeWord(guess.toLowerCase());
        const target = patternCode(encodedGuess, encodedSolution);

        // Keep the words in the current pool that would produce the SAME
        // feedback if they were the actual solution.
        const nextPool: string[] = [];
        const nextEncoded: Uint8Array[] = [];
        for (let i = 0; i < currentPool.length; i++) {
            if (patternCode(encodedGuess, encodedCurrentPool[i]) === target) {
                nextPool.push(currentPool[i]);
                nextEncoded.push(encodedCurrentPool[i]);
            }
        }
        currentPool = nextPool;
        encodedCurrentPool = nextEncoded;

        results.push([...currentPool]);
    });

    return results;
};

/**
 * For each guess, returns whether it was still a possible solution given the
 * feedback from all PREVIOUS guesses. A guess that was already ruled out cannot
 * be the answer, so reporting a probability for it is misleading.
 */
export const guessWasStillPossible = (
    guesses: string[],
    solution: string,
    wordLength: WordLength
): boolean[] => {
    const pools = filterPossibleWords(guesses, solution, wordLength);
    const startingPool = getSolutionList(wordLength);

    return guesses.map((guess, i) => {
        const poolBefore = i === 0 ? startingPool : pools[i - 1];
        return poolBefore.includes(guess.toLowerCase());
    });
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
    solution: string,
    wordLength: WordLength
): LuckScore[] => {
    const encodedSolution = encodeWord(solution.toLowerCase());
    let encodedPool = encodePool(getSolutionList(wordLength));
    const scores: LuckScore[] = [];

    guesses.forEach((guess) => {
        const encodedGuess = encodeWord(guess.toLowerCase());
        const guessTarget = patternCode(encodedGuess, encodedSolution);

        // How many words the player's actual guess leaves behind.
        let myRemaining = 0;
        for (const poolWord of encodedPool) {
            if (patternCode(encodedGuess, poolWord) === guessTarget) myRemaining++;
        }

        // How many candidate guesses would have left strictly fewer.
        let strictlyBetter = 0;
        for (const candidate of encodedPool) {
            const target = patternCode(candidate, encodedSolution);
            let remaining = 0;
            for (const poolWord of encodedPool) {
                if (patternCode(candidate, poolWord) === target) remaining++;
            }
            if (remaining < myRemaining) strictlyBetter++;
        }

        scores.push({ rank: strictlyBetter + 1, total: encodedPool.length });

        encodedPool = encodedPool.filter(
            (candidate) => patternCode(encodedGuess, candidate) === guessTarget
        );
    });

    return scores;
};
