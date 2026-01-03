import { useState, useEffect } from 'react';
import { getWordOfTheDay, isValidWord } from '../utils/wordUtils';

export type LetterState = 'correct' | 'present' | 'absent' | 'empty';

export const useGameState = () => {
    const [solution] = useState(getWordOfTheDay());
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [isGameOver, setIsGameOver] = useState(false);
    const [isWon, setIsWon] = useState(false);
    const [message, setMessage] = useState('');

    const onChar = (char: string) => {
        if (currentGuess.length < 5 && !isGameOver) {
            setCurrentGuess((prev) => prev + char.toLowerCase());
        }
    };

    const onDelete = () => {
        setCurrentGuess((prev) => prev.slice(0, -1));
    };

    const onEnter = () => {
        if (isGameOver) return;

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

        if (currentGuess === solution) {
            setIsWon(true);
            setIsGameOver(true);
            setMessage('Splendid!');
        } else if (newGuesses.length === 6) {
            setIsGameOver(true);
            setMessage(solution.toUpperCase());
        }
    };

    const getStatuses = () => {
        const statuses: { [key: string]: LetterState } = {};

        guesses.forEach((guess) => {
            const splitGuess = guess.split('');
            const splitSolution = solution.split('');

            splitGuess.forEach((letter, i) => {
                if (!splitSolution.includes(letter)) {
                    if (!statuses[letter]) statuses[letter] = 'absent';
                    return;
                }

                if (letter === splitSolution[i]) {
                    statuses[letter] = 'correct';
                    return;
                }

                if (statuses[letter] !== 'correct') {
                    statuses[letter] = 'present';
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
