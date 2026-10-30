import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Target, Flame, Zap, Award } from 'lucide-react';
import { GameStats } from '../types/game';
import { sound } from '../utils/audio';

interface GameOverModalProps {
  isOpen: boolean;
  stats: GameStats;
  isNewBest: boolean;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  stats,
  isNewBest,
  onPlayAgain,
  onMainMenu,
}) => {
  useEffect(() => {
    if (isOpen) {
      sound.playGameOver();

      // Confetti burst for high achievement
      if (stats.score > 0) {
        try {
          confetti({
            particleCount: isNewBest ? 120 : 60,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#06b6d4', '#ec4899', '#eab308', '#a855f7'],
          });
        } catch {
          // ignore if canvas-confetti is not loaded
        }
      }
    }
  }, [isOpen, isNewBest, stats.score]);

  if (!isOpen) return null;

  const accuracy =
    stats.totalHits + stats.totalMisses > 0
      ? Math.round((stats.totalHits / (stats.totalHits + stats.totalMisses)) * 100)
      : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/50 rounded-3xl p-6 md:p-8 text-white shadow-[0_0_50px_rgba(6,182,212,0.35)]">
        {/* New Best Score Badge */}
        {isNewBest && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 font-black text-xs uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.7)] animate-bounce">
            <Trophy className="w-4 h-4 fill-current" /> New High Score!
          </div>
        )}

        {/* Header */}
        <div className="text-center mt-2 mb-6">
          <span className="text-xs uppercase font-bold tracking-[0.3em] text-cyan-400">
            Mission Debrief
          </span>
          <h2 className="text-3xl md:text-4xl font-black arcade-font text-white tracking-widest mt-1 neon-glow-cyan">
            GAME OVER
          </h2>
        </div>

        {/* Score Display Card */}
        <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-5 text-center mb-6 neon-box-cyan">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-1">
            Final Score
          </span>
          <div className="text-4xl md:text-5xl font-black arcade-font text-cyan-300 tracking-wider neon-glow-cyan">
            {stats.score.toLocaleString()}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-purple-300 font-medium">
            <Award className="w-3.5 h-3.5 text-purple-400" />
            <span>All-time Best: {stats.bestScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Performance Statistics Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Targets Collected */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center text-cyan-400 mb-1">
              <Target className="w-4 h-4" />
            </div>
            <span className="text-lg md:text-xl font-bold arcade-font text-white">
              {stats.targetsCollected}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block mt-0.5">
              Collected
            </span>
          </div>

          {/* Max Combo */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center text-amber-400 mb-1">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-lg md:text-xl font-bold arcade-font text-amber-300">
              x{stats.maxCombo}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block mt-0.5">
              Max Combo
            </span>
          </div>

          {/* Accuracy */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center text-emerald-400 mb-1">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-lg md:text-xl font-bold arcade-font text-emerald-300">
              {accuracy}%
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block mt-0.5">
              Accuracy
            </span>
          </div>
        </div>

        {/* Target Types Breakdown */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 mb-6 text-xs text-slate-300">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
            Target Collection Breakdown:
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-cyan-400 font-medium">Standard (+10):</span>
            <span className="font-bold text-white">{stats.hitsByType.standard}</span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1">
            <span className="text-pink-400 font-medium">Special (+25):</span>
            <span className="font-bold text-white">{stats.hitsByType.special}</span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1">
            <span className="text-amber-400 font-medium">Bonus Core (+50):</span>
            <span className="font-bold text-white">{stats.hitsByType.bonus}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onPlayAgain();
            }}
            className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-black tracking-wider uppercase text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Play Again
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onMainMenu();
            }}
            className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold tracking-wider uppercase text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Home className="w-4 h-4" /> Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
