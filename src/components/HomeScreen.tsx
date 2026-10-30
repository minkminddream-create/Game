import React from 'react';
import { Camera, MousePointer, Play, HelpCircle, Trophy, Volume2, VolumeX, Sparkles, Zap } from 'lucide-react';
import { GameMode } from '../types/game';
import { sound } from '../utils/audio';

interface HomeScreenProps {
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onStartGame: () => void;
  onOpenHowToPlay: () => void;
  bestScore: number;
  isMuted: boolean;
  onToggleMute: () => void;
  isCameraReady: boolean;
  cameraError: string | null;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  selectedMode,
  onSelectMode,
  onStartGame,
  onOpenHowToPlay,
  bestScore,
  isMuted,
  onToggleMute,
  isCameraReady,
  cameraError,
}) => {
  return (
    <div className="relative z-30 min-h-screen flex flex-col items-center justify-between p-4 md:p-8 max-w-4xl mx-auto">
      {/* Top Bar: High Score & Sound Toggle */}
      <div className="w-full flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 border border-purple-500/30 backdrop-blur-md">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            All-Time High:
          </span>
          <span className="text-lg font-black arcade-font text-amber-300">
            {bestScore.toLocaleString()}
          </span>
        </div>

        <button
          onClick={onToggleMute}
          className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-all cursor-pointer backdrop-blur-md"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Title & Hero Branding */}
      <div className="flex flex-col items-center text-center my-auto py-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold tracking-[0.2em] uppercase mb-4 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Web AR Arcade Experience
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black arcade-font tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-500 neon-glow-cyan">
          AR CLICK & COLLECT
        </h1>

        <p className="mt-4 max-w-lg text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
          The next-gen Web AR arcade challenge. Track your hand with your webcam or click with laser precision to collect virtual targets in 60 seconds!
        </p>

        {/* Mode Selector Cards */}
        <div className="mt-8 w-full max-w-md grid grid-cols-2 gap-3.5">
          {/* Camera Mode */}
          <button
            onClick={() => {
              sound.playClick();
              onSelectMode('camera');
            }}
            className={`relative p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
              selectedMode === 'camera'
                ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] ring-2 ring-cyan-500/50'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`p-2.5 rounded-xl ${
                  selectedMode === 'camera' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Camera className="w-5 h-5" />
              </div>
              {selectedMode === 'camera' && (
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-ping" />
              )}
            </div>
            <div>
              <div className="font-bold text-white text-sm sm:text-base arcade-font">
                CAMERA MODE
              </div>
              <div className="text-[11px] text-cyan-200/70 mt-1">
                Hand Tracking via Webcam
              </div>
            </div>
          </button>

          {/* Mouse Mode */}
          <button
            onClick={() => {
              sound.playClick();
              onSelectMode('mouse');
            }}
            className={`relative p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
              selectedMode === 'mouse'
                ? 'bg-purple-950/70 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.4)] ring-2 ring-purple-500/50'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`p-2.5 rounded-xl ${
                  selectedMode === 'mouse' ? 'bg-purple-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <MousePointer className="w-5 h-5" />
              </div>
              {selectedMode === 'mouse' && (
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7] animate-ping" />
              )}
            </div>
            <div>
              <div className="font-bold text-white text-sm sm:text-base arcade-font">
                MOUSE MODE
              </div>
              <div className="text-[11px] text-purple-200/70 mt-1">
                Click & Touch Precision
              </div>
            </div>
          </button>
        </div>

        {/* Camera Notice if needed */}
        {selectedMode === 'camera' && cameraError && (
          <div className="mt-3 text-xs text-amber-300 bg-amber-950/60 border border-amber-600/40 rounded-xl px-4 py-2 max-w-md">
            ⚠️ {cameraError} (Mouse mode can be played instantly!)
          </div>
        )}

        {/* Start Game Action Button */}
        <div className="mt-8 w-full max-w-md space-y-3">
          <button
            onClick={() => {
              sound.playClick();
              onStartGame();
            }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:from-cyan-300 hover:via-purple-400 hover:to-pink-400 text-slate-950 font-black arcade-font text-lg tracking-widest uppercase shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:shadow-[0_0_40px_rgba(236,72,153,0.7)] transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3"
          >
            <Play className="w-6 h-6 fill-current" /> START GAME
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenHowToPlay();
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400 text-slate-300 hover:text-white font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 backdrop-blur-md"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" /> HOW TO PLAY
          </button>
        </div>
      </div>

      {/* Footer credits & badges */}
      <div className="w-full text-center pb-2 text-xs text-slate-500 flex items-center justify-center gap-4">
        <span className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-cyan-400" /> 60-Second Challenge
        </span>
        <span>•</span>
        <span>MediaPipe Real-Time Vision</span>
        <span>•</span>
        <span>Combo Multiplier System</span>
      </div>
    </div>
  );
};
