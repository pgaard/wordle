import React, { useState } from 'react';
import Game from './components/Game';
import { WordLength, WORD_LENGTHS } from './utils/wordUtils';

const LENGTH_KEY = 'wordle-word-length';

const parseWordLength = (value: string | null): WordLength | null => {
    const parsed = parseInt(value ?? '', 10);
    return WORD_LENGTHS.includes(parsed as WordLength) ? (parsed as WordLength) : null;
};

const getInitialWordLength = (): WordLength => {
    const fromUrl = parseWordLength(new URLSearchParams(window.location.search).get('length'));
    if (fromUrl) return fromUrl;
    return parseWordLength(localStorage.getItem(LENGTH_KEY)) ?? 5;
};

const App: React.FC = () => {
    const [wordLength, setWordLength] = useState<WordLength>(getInitialWordLength);

    const selectLength = (length: WordLength) => {
        localStorage.setItem(LENGTH_KEY, String(length));
        setWordLength(length);
    };

    // Keying on wordLength remounts the game, so each length loads its own
    // daily puzzle and its own saved progress.
    return <Game key={wordLength} wordLength={wordLength} onSelectLength={selectLength} />;
};

export default App;
