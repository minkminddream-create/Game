import React, { useEffect, useState } from 'react';
import { sound } from '../utils/audio';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onComplete }) => {
  const [count, setCount] = useState<number | string>(3);

  useEffect(() => {
    // 3
    sound.playCountdownTick();

    const t1 = setTimeout(() => {
      setCount(2);
      sound.playCountdownTick();
    }, 900);

    const t2 = setTimeout(() => {
      setCount(1);
      sound.playCountdownTick();
    }, 1800);

    const t3 = setTimeout(() => {
      setCount('GO!');
      sound.playCountdownGo();
    }, 2700);

    const t4 = setTimeout(() => {
      onComplete();
    }, 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm pointer-events-none">
      <div className="flex flex-col items-center">
        <span className="text-cyan-400 text-sm md:text-base uppercase tracking-[0.3em] font-semibold mb-2 animate-pulse">
          Get Ready
        </span>
        <div
          key={String(count)}
          className={`arcade-font text-8xl md:text-9xl font-black tracking-widest animate-bounce ${
            count === 'GO!'
              ? 'text-emerald-400 neon-glow-cyan scale-125'
              : 'text-white neon-glow-purple'
          }`}
        >
          {count}
        </div>
      </div>
    </div>
  );
};
