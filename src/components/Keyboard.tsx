import React from 'react';
import { LetterState } from '../utils/gameLogic';

interface Props {
    onChar: (char: string) => void;
    onDelete: () => void;
    onEnter: () => void;
    statuses: { [key: string]: LetterState };
}

const Keyboard: React.FC<Props> = ({ onChar, onDelete, onEnter, statuses }) => {
    const rows = [
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
        ['ENTER', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'DEL'],
    ];

    const onClick = (key: string) => {
        if (key === 'ENTER') onEnter();
        else if (key === 'DEL') onDelete();
        else onChar(key);
    };

    return (
        <div className="keyboard">
            {rows.map((row, i) => (
                <div key={i} className="key-row">
                    {row.map((key) => (
                        <button
                            key={key}
                            className={`key ${key.length > 1 ? 'large' : ''} ${statuses[key.toLowerCase()] || ''}`}
                            onClick={() => onClick(key)}
                        >
                            {key}
                        </button>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default Keyboard;
