import React from 'react';
import { X, Hand, MousePointer, Sparkles, Flame, ShieldCheck, Zap } from 'lucide-react';
import { sound } from '../utils/audio';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    sound.playClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/50 rounded-2xl p-6 md:p-8 text-white shadow-[0_0_35px_rgba(6,182,212,0.3)] max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <span className="text-xs uppercase font-bold tracking-[0.25em] text-cyan-400">
            Operation Manual
          </span>
          <h2 className="text-2xl md:text-3xl font-black arcade-font text-white tracking-wider mt-1 neon-glow-cyan">
            HOW TO PLAY
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Collect as many virtual targets as you can before the 60-second timer expires!
          </p>
        </div>

        {/* Target Points Breakdown */}
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Target Classifications & Scoring
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Standard Target */}
            <div className="bg-slate-950/70 border border-cyan-500/40 rounded-xl p-3 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.6)] mb-2">
                <span className="text-sm font-black text-cyan-300 arcade-font">+10</span>
              </div>
              <span className="font-bold text-cyan-300 text-sm">Standard</span>
              <p className="text-xs text-slate-400 mt-1">
                Cyan orb or diamond. Frequent spawn, reliable points.
              </p>
            </div>

            {/* Special Target */}
            <div className="bg-slate-950/70 border border-pink-500/40 rounded-xl p-3 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-pink-500/20 border-2 border-pink-400 flex items-center justify-center shadow-[0_0_12px_rgba(236,72,153,0.6)] mb-2 rotate-12">
                <span className="text-sm font-black text-pink-300 arcade-font -rotate-12">+25</span>
              </div>
              <span className="font-bold text-pink-300 text-sm">Special</span>
              <p className="text-xs text-slate-400 mt-1">
                Pink hexagon. Floats gently, provides 2.5x base score.
              </p>
            </div>

            {/* Bonus Target */}
            <div className="bg-slate-950/70 border border-amber-500/40 rounded-xl p-3 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.7)] mb-2 animate-pulse">
                <span className="text-sm font-black text-amber-300 arcade-font">+50</span>
              </div>
              <span className="font-bold text-amber-300 text-sm">Bonus Core</span>
              <p className="text-xs text-slate-400 mt-1">
                Golden star. High speed & rare, gives massive points!
              </p>
            </div>
          </div>
        </div>

        {/* Combo Multiplier System */}
        <div className="mb-6 bg-slate-950/70 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
              Combo Multiplier Streak
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Every consecutive target collected increases your Combo Multiplier (up to x10!).
              Hitting targets with high combo yields exponential scores. Keep moving and don't let targets expire!
            </p>
          </div>
        </div>

        {/* 2 Game Modes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-950/60 border border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold text-sm">
              <Hand className="w-5 h-5" /> Camera AR Mode
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
              <li>Allow webcam permission when prompted.</li>
              <li>Position your hand ~1-2 feet in front of the lens.</li>
              <li>Point with your <strong className="text-cyan-300">Index Finger</strong>.</li>
              <li>Move your fingertip into targets to collect them.</li>
            </ul>
          </div>

          <div className="bg-slate-950/60 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-purple-400 font-bold text-sm">
              <MousePointer className="w-5 h-5" /> Mouse / Touch Mode
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
              <li>Ideal for laptop trackpads, gaming mice, or touchscreen tablets.</li>
              <li>Click or tap directly on targets as they appear.</li>
              <li>Fast response with zero camera requirement.</li>
            </ul>
          </div>
        </div>

        {/* Automatic Fallback info */}
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex items-center gap-2.5 text-xs text-cyan-300 mb-6">
          <ShieldCheck className="w-5 h-5 shrink-0 text-cyan-400" />
          <span>
            If camera permission is denied or hand tracking is not supported, the game automatically switches to Mouse Mode without interrupting gameplay!
          </span>
        </div>

        {/* Got it Button */}
        <button
          onClick={handleClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-black text-sm tracking-widest uppercase shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4 fill-current" /> Ready to Play
        </button>
      </div>
    </div>
  );
};
