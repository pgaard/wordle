import React from 'react';
import { LetterState } from '../hooks/useGameState';

interface Props {
    value?: string;
    status?: LetterState;
    delay?: number;
}

const Tile: React.FC<Props> = ({ value, status, delay = 0 }) => {
    const className = [
        'tile',
        value ? 'filled' : '',
        status ? status : '',
    ].join(' ');

    return (
        <div
            className={className}
            style={{ animationDelay: `${delay}ms` }}
        >
            {value}
        </div>
    );
};

export default Tile;
