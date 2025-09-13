import React from 'react';

const Fireworks = () => {
    const createBoxShadow = (n: number) => {
        let value = '';
        const colors = ['#FFD700', '#FDE047', '#EC4899', '#FFFFFF', '#F5970B'];
        for (let i = 0; i < n; i++) {
            const x = Math.round(Math.random() * 200 - 100);
            const y = Math.round(Math.random() * 200 - 100);
            const color = colors[Math.floor(Math.random() * colors.length)];
            value += `${x}px ${y}px 0 -2px ${color}${i === n - 1 ? '' : ','}`;
        }
        return value;
    };

    const explosions = Array.from({ length: 12 }).map((_, i) => {
        const size = `${Math.random() * 3 + 1}px`;
        return (
            <div
                key={i}
                className="absolute animate-firework-boom"
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    boxShadow: createBoxShadow(20),
                    top: `${Math.random() * 80 + 10}%`,
                    left: `${Math.random() * 80 + 10}%`,
                    animationDelay: `${i * 0.1}s`,
                }}
            />
        );
    });

    return <div className="absolute inset-0 pointer-events-none">{explosions}</div>;
};

export default Fireworks;