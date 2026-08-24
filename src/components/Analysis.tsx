import React, { useMemo, useState, useEffect } from 'react';
import Row from './Row';
import { filterPossibleWords, calculateLuck, countRemainingForPool, guessWasStillPossible, isPossibleSolutionWord, getTotalSolutions, LuckScore } from '../utils/analysisUtils';
import { WordLength } from '../utils/wordUtils';

interface Props {
    guesses: string[];
    solution: string;
    wordLength: WordLength;
    onBack: () => void;
}

const Analysis: React.FC<Props> = ({ guesses, solution, wordLength, onBack }) => {
    const analysisResults = useMemo(() => {
        return filterPossibleWords(guesses, solution, wordLength);
    }, [guesses, solution, wordLength]);

    const stillPossible = useMemo(() => {
        return guessWasStillPossible(guesses, solution, wordLength);
    }, [guesses, solution, wordLength]);

    const [luckResults, setLuckResults] = useState<LuckScore[]>([]);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const wordListCache = useMemo(
        () => new Map<number, { word: string; count: number }[]>(),
        [analysisResults, solution]
    );

    const getSortedWordList = (i: number, remaining: string[]) => {
        const cached = wordListCache.get(i);
        if (cached) return cached;
        const counts = countRemainingForPool(remaining, solution);
        const computed = remaining
            .map((word, idx) => ({ word, count: counts[idx] }))
            .sort((a, b) => a.count - b.count);
        wordListCache.set(i, computed);
        return computed;
    };

    const formatLuck = (rank: number, total: number): string => {
        const denom = total / rank;
        const rounded = Math.round(denom * 10) / 10;
        const display = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
        return `1 in ${display}`;
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
            const results = calculateLuck(guesses, solution, wordLength);
            setLuckResults(results);
        }, 100);
        return () => clearTimeout(timer);
    }, [guesses, solution, wordLength]);

    return (
        <div className={`analysis-container len-${wordLength}`}>
            <div className="analysis-header">
                <button className="back-button" onClick={onBack}>
                    ← Back to Game
                </button>
                <h2>Game Analysis</h2>
                <span className="analysis-mode">{wordLength} letters</span>
            </div>

            <div className="analysis-content">
                <table className="analysis-table">
                    <thead>
                        <tr>
                            <th>Guess</th>
                            <th>Words Left</th>
                            <th>Probability</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><em>Start</em></td>
                            <td>{getTotalSolutions(wordLength)}</td>
                            <td></td>
                        </tr>
                        {guesses.map((guess, i) => {
                            const remaining = analysisResults[i];
                            const luck = luckResults[i];
                            const isExpandable = remaining.length >= 20 && guess !== solution;
                            const showList = (remaining.length < 20 && guess !== solution) || expandedRows.has(i);
                            const wasPossible = stillPossible[i];
                            const notInAnswerList = !isPossibleSolutionWord(guess, wordLength);
                            const nextGuess = guesses[i + 1]?.toLowerCase();
                            return (
                                <tr key={i}>
                                    <td>
                                        <Row guess={guess} solution={solution} isRevealed={false} wordLength={wordLength} />
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
                                        {notInAnswerList && (
                                            <div className="not-in-answer-list">
                                                Not in Wordle list
                                            </div>
                                        )}
                                        {showList && (
                                            <div className="possible-words">
                                                {getSortedWordList(i, remaining).map(({ word, count }) => (
                                                    <div
                                                        key={word}
                                                        className={word === nextGuess ? 'next-guess-word' : undefined}
                                                        style={{ whiteSpace: 'nowrap' }}
                                                    >
                                                        {word} ({word === solution ? 'solution' : `${count} left`})
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        {!wasPossible && !notInAnswerList ? (
                                            <span className="ruled-out">Ruled out</span>
                                        ) : luck !== undefined ? (
                                            formatLuck(luck.rank, luck.total)
                                        ) : null}
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
