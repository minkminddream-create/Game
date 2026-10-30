import React from 'react';
import { Volume2, VolumeX, Pause, LogOut, Camera, MousePointer, Flame } from 'lucide-react';
import { GameMode } from '../types/game';

interface HUDProps {
  score: number;
  bestScore: number;
  timeLeft: number;
  combo: number;
  targetsCollected: number;
  mode: GameMode;
  isMuted: boolean;
  isHandDetected: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onExit: () => void;
  onSwitchMode: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  bestScore,
  timeLeft,
  combo,
  targetsCollected,
  mode,
  isMuted,
  isHandDetected,
  onToggleMute,
  onPause,
  onExit,
  onSwitchMode,
}) => {
  // Format seconds to mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const isTimeCritical = timeLeft <= 10;

  // Combo meter percent (0 to 100%)
  const comboProgress = Math.min((combo / 10) * 100, 100);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 p-3 md:p-5 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left Side: Score & High Score */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 rounded-xl px-4 py-2 pointer-events-auto neon-box-cyan">
            <span className="text-xs uppercase tracking-wider text-cyan-400 font-bold block">
              Score
            </span>
            <span className="text-2xl md:text-3xl font-black arcade-font text-white tracking-wider neon-glow-cyan">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="hidden sm:block bg-slate-900/60 backdrop-blur-md border border-purple-500/30 rounded-xl px-3 py-2 pointer-events-auto">
            <span className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold block">
              Best
            </span>
            <span className="text-lg md:text-xl font-bold arcade-font text-purple-200">
              {bestScore.toLocaleString()}
            </span>
          </div>

          {/* Collected Counter */}
          <div className="hidden md:flex flex-col bg-slate-900/60 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-2 pointer-events-auto">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Targets
            </span>
            <span className="text-lg font-bold arcade-font text-emerald-400">
              {targetsCollected}
            </span>
          </div>
        </div>

        {/* Center: Time Remaining Counter */}
        <div className="flex flex-col items-center">
          <div
            className={`px-5 py-2 rounded-2xl border backdrop-blur-md transition-all duration-300 pointer-events-auto ${
              isTimeCritical
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse'
                : 'bg-slate-900/80 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
            }`}
          >
            <div className="text-[10px] uppercase tracking-widest text-center font-bold opacity-80">
              Time Left
            </div>
            <div
              className={`text-2xl md:text-4xl font-black arcade-font text-center tracking-widest ${
                isTimeCritical ? 'text-rose-400' : 'text-white'
              }`}
            >
              {timeFormatted}
            </div>
          </div>

          {/* Combo Multiplier Bar */}
          {combo > 1 && (
            <div className="mt-2 flex items-center gap-1.5 bg-slate-950/90 border border-amber-500/50 rounded-full px-3 py-0.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-bounce pointer-events-auto">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs md:text-sm font-black arcade-font text-amber-300 neon-glow-gold">
                COMBO x{combo}
              </span>
              <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-1">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all duration-150"
                  style={{ width: `${comboProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Mode status & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Mode Switch Badge */}
          <button
            onClick={onSwitchMode}
            title={`Switch to ${mode === 'camera' ? 'Mouse' : 'Camera'} Mode`}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500 text-xs font-semibold text-slate-200 transition-all pointer-events-auto cursor-pointer"
          >
            {mode === 'camera' ? (
              <>
                <Camera className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Camera AR</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isHandDetected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                  }`}
                  title={isHandDetected ? 'Hand Tracked' : 'Searching Hand...'}
                />
              </>
            ) : (
              <>
                <MousePointer className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Mouse Mode</span>
              </>
            )}
          </button>

          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-all pointer-events-auto cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 transition-all pointer-events-auto cursor-pointer"
            title="Pause Game"
          >
            <Pause className="w-5 h-5" />
          </button>

          {/* Quit Button */}
          <button
            onClick={onExit}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-rose-400 transition-all pointer-events-auto cursor-pointer"
            title="Quit to Main Menu"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
