import React from 'react';
import Tile from './Tile';
import { LetterState } from '../hooks/useGameState';

interface Props {
    guess?: string;
    currentGuess?: string;
    solution?: string;
    isRevealed?: boolean;
}

const Row: React.FC<Props> = ({ guess, currentGuess, solution, isRevealed }) => {
    const getLetterStatus = (letter: string, index: number): LetterState => {
        if (!solution || !guess) return 'empty';
        if (solution[index] === letter) return 'correct';
        if (solution.includes(letter)) return 'present';
        return 'absent';
    };

    const tiles = Array(5).fill('');

    if (guess) {
        return (
            <div className="row">
                {guess.split('').map((letter, i) => (
                    <Tile
                        key={i}
                        value={letter}
                        status={getLetterStatus(letter, i)}
                        delay={i * 300}
                    />
                ))}
            </div>
        );
    }

    if (currentGuess) {
        const letters = currentGuess.split('');
        return (
            <div className="row">
                {tiles.map((_, i) => (
                    <Tile key={i} value={letters[i]} />
                ))}
            </div>
        );
    }

    return (
        <div className="row">
            {tiles.map((_, i) => (
                <Tile key={i} />
            ))}
        </div>
    );
};

export default Row;
