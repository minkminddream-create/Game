import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../utils/audio';

interface PauseModalProps {
  isOpen: boolean;
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  isMuted,
  onResume,
  onRestart,
  onMainMenu,
  onToggleMute,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-amber-500/50 rounded-2xl p-6 text-center shadow-[0_0_35px_rgba(245,158,11,0.25)]">
        <span className="text-xs uppercase font-bold tracking-[0.3em] text-amber-400">
          Match Paused
        </span>
        <h2 className="text-3xl font-black arcade-font text-white tracking-wider mt-1 mb-6 neon-glow-gold">
          PAUSED
        </h2>

        <div className="space-y-3">
          {/* Resume */}
          <button
            onClick={() => {
              sound.playClick();
              onResume();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black tracking-wider uppercase text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Play className="w-4 h-4 fill-current" /> Resume Game
          </button>

          {/* Restart */}
          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Restart Match
          </button>

          {/* Toggle Mute */}
          <button
            onClick={() => {
              onToggleMute();
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" /> Sound: Off
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-cyan-400" /> Sound: On
              </>
            )}
          </button>

          {/* Main Menu */}
          <button
            onClick={() => {
              sound.playClick();
              onMainMenu();
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-300 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Home className="w-4 h-4" /> Exit to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
