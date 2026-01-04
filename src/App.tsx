import React, { useEffect, useState } from 'react';
import Grid from './components/Grid';
import Keyboard from './components/Keyboard';
import Analysis from './components/Analysis';
import { useGameState } from './hooks/useGameState';
import confetti from 'canvas-confetti';

const App: React.FC = () => {
    const [view, setView] = useState<'game' | 'analysis'>('game');
    const {
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
    } = useGameState();

    useEffect(() => {
        if (isWon) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6aaa64', '#c9b458', '#787c7e']
            });
        }
    }, [isWon]);

    useEffect(() => {
        if (view !== 'game') return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            if (e.key === 'Enter') {
                onEnter();
            } else if (e.key === 'Backspace') {
                onDelete();
            } else if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
                onChar(e.key);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onEnter, onDelete, onChar, view]);

    if (view === 'analysis') {
        return (
            <Analysis
                guesses={guesses}
                solution={solution}
                onBack={() => setView('game')}
            />
        );
    }

    return (
        <>
            <header>
                <h1>Wordle</h1>
            </header>

            <div className="game-container">
                <div style={{ minHeight: '40px', textAlign: 'center', paddingTop: '10px' }}>
                    {message && (
                        <div style={{
                            background: 'white',
                            color: 'black',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            display: 'inline-block',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            zIndex: 100
                        }}>
                            {message}
                        </div>
                    )}
                    {isGameOver && !message && (
                        <button
                            className="analysis-link"
                            onClick={() => setView('analysis')}
                        >
                            View Game Analysis →
                        </button>
                    )}
                </div>

                <Grid guesses={guesses} currentGuess={currentGuess} solution={solution} />

                <Keyboard
                    onChar={onChar}
                    onDelete={onDelete}
                    onEnter={onEnter}
                    statuses={getStatuses()}
                />
            </div>
        </>
    );
};

export default App;
