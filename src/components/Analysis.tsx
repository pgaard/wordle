import React, { useMemo, useState, useEffect } from 'react';
import Row from './Row';
import { filterPossibleWords, calculateLuck, countRemainingForGuess, TOTAL_SOLUTIONS } from '../utils/analysisUtils';

interface Props {
    guesses: string[];
    solution: string;
    onBack: () => void;
}

const Analysis: React.FC<Props> = ({ guesses, solution, onBack }) => {
    const analysisResults = useMemo(() => {
        return filterPossibleWords(guesses, solution);
    }, [guesses, solution]);

    const [luckResults, setLuckResults] = useState<number[]>([]);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const wordListCache = useMemo(
        () => new Map<number, { word: string; count: number }[]>(),
        [analysisResults, solution]
    );

    const getSortedWordList = (i: number, remaining: string[]) => {
        const cached = wordListCache.get(i);
        if (cached) return cached;
        const computed = remaining
            .map((word) => ({
                word,
                count: countRemainingForGuess(word, solution, remaining),
            }))
            .sort((a, b) => a.count - b.count);
        wordListCache.set(i, computed);
        return computed;
    };

    const toggleRow = (i: number) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(i)) next.delete(i);
            else next.add(i);
            return next;
        });
    };

    useEffect(() => {
        // Calculate luck in a timeout to allow UI to render first
        const timer = setTimeout(() => {
            const results = calculateLuck(guesses, solution);
            setLuckResults(results);
        }, 100);
        return () => clearTimeout(timer);
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
                            <th>Skill</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><em>Start</em></td>
                            <td>{TOTAL_SOLUTIONS}</td>
                            <td></td>
                        </tr>
                        {guesses.map((guess, i) => {
                            const remaining = analysisResults[i];
                            const luck = luckResults[i];
                            const isExpandable = remaining.length >= 20 && guess !== solution;
                            const showList = (remaining.length < 20 && guess !== solution) || expandedRows.has(i);
                            return (
                                <tr key={i}>
                                    <td>
                                        <Row guess={guess} solution={solution} isRevealed={false} />
                                    </td>
                                    <td>
                                        {isExpandable ? (
                                            <button
                                                type="button"
                                                className="remaining-count remaining-count-button"
                                                onClick={() => toggleRow(i)}
                                                aria-expanded={expandedRows.has(i)}
                                            >
                                                {remaining.length} {expandedRows.has(i) ? '▾' : '▸'}
                                            </button>
                                        ) : (
                                            <div className="remaining-count">{remaining.length}</div>
                                        )}
                                        {showList && (
                                            <div className="possible-words">
                                                {getSortedWordList(i, remaining).map(({ word, count }) => (
                                                    <div key={word} style={{ whiteSpace: 'nowrap' }}>
                                                        {word} ({word === solution ? 'solution' : `${count} left`})
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {guess !== solution && luck !== undefined ? `${luck}%` : null}
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
