import React from 'react';
import Row from './Row';

interface Props {
    guesses: string[];
    currentGuess: string;
    solution: string;
}

const Grid: React.FC<Props> = ({ guesses, currentGuess, solution }) => {
    const empties = guesses.length < 5
        ? Array(5 - guesses.length).fill('')
        : [];

    return (
        <div className="grid">
            {guesses.map((guess, i) => (
                <Row key={i} guess={guess} solution={solution} isRevealed={true} />
            ))}
            {guesses.length < 6 && (
                <Row currentGuess={currentGuess} />
            )}
            {empties.map((_, i) => (
                <Row key={i} />
            ))}
        </div>
    );
};

export default Grid;
