export type LetterState = 'correct' | 'present' | 'absent' | 'empty';

/**
 * Calculates the state of each letter in a guess relative to the solution.
 * Handles duplicate letters correctly (Wordle rules).
 */
export const getGuessStatuses = (guess: string, solution: string): LetterState[] => {
    const splitSolution = solution.toLowerCase().split('');
    const splitGuess = guess.toLowerCase().split('');

    const statuses: LetterState[] = Array(5).fill('absent');
    const solutionMatched = Array(5).fill(false);

    // First pass: Find all correct matches
    splitGuess.forEach((letter, i) => {
        if (letter === splitSolution[i]) {
            statuses[i] = 'correct';
            solutionMatched[i] = true;
        }
    });

    // Second pass: Find all present matches
    splitGuess.forEach((letter, i) => {
        if (statuses[i] === 'correct') return;

        const targetIndex = splitSolution.findIndex((solLetter, solIdx) => {
            return solLetter === letter && !solutionMatched[solIdx];
        });

        if (targetIndex !== -1) {
            statuses[i] = 'present';
            solutionMatched[targetIndex] = true;
        }
    });

    return statuses;
};
