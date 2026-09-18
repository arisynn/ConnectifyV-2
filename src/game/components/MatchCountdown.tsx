import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const MatchCountdown = ({ startAt, onFinished }: { startAt: number, onFinished: () => void }) => {
    const [count, setCount] = useState<string | null>(null);

    useEffect(() => {
        const checkTime = () => {
            const now = Date.now();
            const diff = startAt - now;
            
            if (diff > 3000) setCount('3');
            else if (diff > 2000) setCount('2');
            else if (diff > 1000) setCount('1');
            else if (diff > 0) setCount('GO!');
            else {
                setCount(null);
                onFinished();
            }
        };

        checkTime();
        const interval = setInterval(checkTime, 50);
        return () => clearInterval(interval);
    }, [startAt, onFinished]);

    if (!count) return null;

    return (
        <div className="absolute inset-0 z-[200] flex items-center justify-center pointer-events-auto bg-black/40 backdrop-blur-sm">
            <AnimatePresence mode="wait">
                <motion.div 
                    key={count}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20, duration: 0.3 }}
                    className="flex items-center justify-center"
                >
                    <span className="text-8xl md:text-9xl font-black italic tracking-tighter text-theme-surface-card-white drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)]"
                          style={{
                              WebkitTextStroke: '3px var(--theme-text-primary)'
                          }}
                    >
                        {count}
                    </span>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
