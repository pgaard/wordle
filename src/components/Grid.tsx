import React from 'react';
import Row from './Row';
import { MAX_GUESSES } from '../utils/wordUtils';

interface Props {
    guesses: string[];
    currentGuess: string;
    solution: string;
    wordLength: number;
}

const Grid: React.FC<Props> = ({ guesses, currentGuess, solution, wordLength }) => {
    const usedRows = guesses.length + (guesses.length < MAX_GUESSES ? 1 : 0);
    const empties = Array(Math.max(0, MAX_GUESSES - usedRows)).fill('');

    return (
        <div className={`grid len-${wordLength}`}>
            {guesses.map((guess, i) => (
                <Row key={i} guess={guess} solution={solution} isRevealed={true} wordLength={wordLength} />
            ))}
            {guesses.length < MAX_GUESSES && (
                <Row currentGuess={currentGuess} wordLength={wordLength} />
            )}
            {empties.map((_, i) => (
                <Row key={i} wordLength={wordLength} />
            ))}
        </div>
    );
};

export default Grid;
