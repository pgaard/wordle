import React from 'react';
import { WordLength, WORD_LENGTHS } from '../utils/wordUtils';

interface Props {
    wordLength: WordLength;
    onSelect: (wordLength: WordLength) => void;
}

const ModeToggle: React.FC<Props> = ({ wordLength, onSelect }) => (
    <div className="mode-toggle" role="group" aria-label="Word length">
        {WORD_LENGTHS.map((length) => (
            <button
                key={length}
                type="button"
                className={`mode-toggle-option ${length === wordLength ? 'active' : ''}`}
                aria-pressed={length === wordLength}
                title={`${length}-letter game`}
                onClick={() => onSelect(length)}
            >
                {length}
            </button>
        ))}
    </div>
);

export default ModeToggle;
