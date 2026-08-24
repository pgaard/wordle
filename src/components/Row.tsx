import React from 'react';
import Tile from './Tile';
import { getGuessStatuses } from '../utils/gameLogic';

interface Props {
    guess?: string;
    currentGuess?: string;
    solution?: string;
    isRevealed?: boolean;
    wordLength: number;
}

const Row: React.FC<Props> = ({ guess, currentGuess, solution, isRevealed, wordLength }) => {
    const guessStatuses = guess && solution ? getGuessStatuses(guess, solution) : [];

    const tiles = Array(wordLength).fill('');
    const style = { gridTemplateColumns: `repeat(${wordLength}, 1fr)` };

    if (guess) {
        return (
            <div className="row" style={style}>
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
            <div className="row" style={style}>
                {tiles.map((_, i) => {
                    const letter = letters[i];
                    return <Tile key={i} value={letter === ' ' ? '_' : letter} />;
                })}
            </div>
        );
    }

    return (
        <div className="row" style={style}>
            {tiles.map((_, i) => (
                <Tile key={i} />
            ))}
        </div>
    );
};

export default Row;
