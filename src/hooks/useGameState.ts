import { useState, useEffect } from 'react';
import { getWordOfTheDay, isValidWord } from '../utils/wordUtils';
import { getGuessStatuses, LetterState } from '../utils/gameLogic';

export const useGameState = () => {
    const [solution] = useState(getWordOfTheDay());
    const [guesses, setGuesses] = useState<string[]>([]);
    const [revealedGuessesCount, setRevealedGuessesCount] = useState(0);
    const [currentGuess, setCurrentGuess] = useState('');
    const [isGameOver, setIsGameOver] = useState(false);
    const [isRevealing, setIsRevealing] = useState(false);
    const [isWon, setIsWon] = useState(false);
    const [message, setMessage] = useState('');

    const onChar = (char: string) => {
        if (currentGuess.length < 5 && !isGameOver && !isRevealing) {
            setCurrentGuess((prev) => prev + char.toLowerCase());
        }
    };

    const onDelete = () => {
        if (!isRevealing) {
            setCurrentGuess((prev) => prev.slice(0, -1));
        }
    };

    const onEnter = () => {
        if (isGameOver || isRevealing) return;

        if (currentGuess.length !== 5) {
            setMessage('Not enough letters');
            setTimeout(() => setMessage(''), 1500);
            return;
        }

        if (!isValidWord(currentGuess)) {
            setMessage('Not in word list');
            setTimeout(() => setMessage(''), 1500);
            return;
        }

        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);
        setCurrentGuess('');
        setIsRevealing(true);

        // Delay updating the keyboard and win/loss state until tiles reveal
        setTimeout(() => {
            setRevealedGuessesCount(newGuesses.length);
            setIsRevealing(false);

            if (currentGuess === solution) {
                setIsWon(true);
                setIsGameOver(true);
                setMessage('Splendid!');
                setTimeout(() => setMessage(''), 2500);
            } else if (newGuesses.length === 6) {
                setIsGameOver(true);
                setMessage(solution.toUpperCase());
            }
        }, 2000);
    };

    const getStatuses = () => {
        const statuses: { [key: string]: LetterState } = {};

        // Only use guesses that have finished their reveal animation for keyboard statuses
        guesses.slice(0, revealedGuessesCount).forEach((guess) => {
            const guessStatuses = getGuessStatuses(guess, solution);
            guess.split('').forEach((letter, i) => {
                const status = guessStatuses[i];
                if (status === 'correct') {
                    statuses[letter] = 'correct';
                } else if (status === 'present' && statuses[letter] !== 'correct') {
                    statuses[letter] = 'present';
                } else if (status === 'absent' && !statuses[letter]) {
                    statuses[letter] = 'absent';
                }
            });
        });

        return statuses;
    };

    return {
        guesses,
        currentGuess,
        solution,
        isGameOver,
        isWon,
        message,
        onChar,
        onDelete,
        onEnter,
        getStatuses,
    };
};
