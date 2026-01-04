import React from 'react';
import Tile from './Tile';
import { LetterState, getGuessStatuses } from '../utils/gameLogic';

interface Props {
    guess?: string;
    currentGuess?: string;
    solution?: string;
    isRevealed?: boolean;
}

const Row: React.FC<Props> = ({ guess, currentGuess, solution, isRevealed }) => {
    const guessStatuses = guess && solution ? getGuessStatuses(guess, solution) : [];

    const tiles = Array(5).fill('');

    if (guess) {
        return (
            <div className="row">
                {guess.split('').map((letter, i) => (
                    <Tile
                        key={i}
                        value={letter}
                        status={guessStatuses[i]}
                        delay={i * 300}
                        isRevealing={isRevealed}
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
