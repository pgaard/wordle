import React, { useMemo } from 'react';
import Row from './Row';
import { filterPossibleWords } from '../utils/analysisUtils';

interface Props {
    guesses: string[];
    solution: string;
    onBack: () => void;
}

const Analysis: React.FC<Props> = ({ guesses, solution, onBack }) => {
    const analysisResults = useMemo(() => {
        return filterPossibleWords(guesses, solution);
    }, [guesses, solution]);

    return (
        <div className="analysis-container">
            <div className="analysis-header">
                <button className="back-button" onClick={onBack}>
                    ← Back to Game
                </button>
                <h2>Game Analysis</h2>
            </div>

            <div className="analysis-content">
                <table className="analysis-table">
                    <thead>
                        <tr>
                            <th>Guess</th>
                            <th>Remaining Solutions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><em>Start</em></td>
                            <td>2315</td>
                        </tr>
                        {guesses.map((guess, i) => {
                            const remaining = analysisResults[i];
                            return (
                                <tr key={i}>
                                    <td>
                                        <Row guess={guess} solution={solution} isRevealed={false} />
                                    </td>
                                    <td>
                                        <div className="remaining-count-container">
                                            <div className="remaining-count">
                                                {remaining.length}
                                            </div>
                                            {guess !== solution && (
                                                <div className="remaining-tooltip">
                                                    {remaining.map((word) => (
                                                        <div key={word}>{word}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {remaining.length < 20 && guess !== solution && (
                                            <div className="possible-words">
                                                {remaining.map((word) => (
                                                    <div key={word}>{word}</div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Analysis;
