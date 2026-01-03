import React from 'react';
import { LetterState } from '../hooks/useGameState';

interface Props {
    value?: string;
    status?: LetterState;
    delay?: number;
    isRevealing?: boolean;
}

const Tile: React.FC<Props> = ({ value, status, delay = 0, isRevealing }) => {
    const className = [
        'tile',
        value ? 'filled' : '',
        isRevealing ? 'reveal' : '',
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
