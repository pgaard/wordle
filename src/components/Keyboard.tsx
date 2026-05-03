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
        ['ENTER', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'BLANK', 'DEL'],
    ];

    const onClick = (key: string) => {
        if (key === 'ENTER') onEnter();
        else if (key === 'DEL') onDelete();
        else if (key === 'BLANK') onChar(' ');
        else onChar(key);
    };

    return (
        <div className="keyboard">
            {rows.map((row, i) => (
                <div key={i} className="key-row">
                    {row.map((key) => {
                        const isLarge = key.length > 1 && key !== 'BLANK';
                        const label = key === 'BLANK' ? '_' : key;
                        const status = key.length === 1 ? (statuses[key.toLowerCase()] || '') : '';
                        return (
                            <button
                                key={key}
                                className={`key ${isLarge ? 'large' : ''} ${status}`}
                                onClick={() => onClick(key)}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default Keyboard;
