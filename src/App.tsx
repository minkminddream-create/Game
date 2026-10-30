import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameMode, GameState, TargetType, HandLandmarkPoint, GameStats } from './types/game';
import { CyberBackground } from './components/CyberBackground';
import { HomeScreen } from './components/HomeScreen';
import { HUD } from './components/HUD';
import { GameCanvas } from './components/GameCanvas';
import { CountdownOverlay } from './components/CountdownOverlay';
import { HowToPlayModal } from './components/HowToPlayModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { handTracker } from './services/handTracking';
import { sound } from './utils/audio';

export default function App() {
  // Game Flow State
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('mouse'); // default to mouse for instant usability
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [maxCombo, setMaxCombo] = useState<number>(1);
  const [targetsCollected, setTargetsCollected] = useState<number>(0);
  const [totalHits, setTotalHits] = useState<number>(0);
  const [totalMisses, setTotalMisses] = useState<number>(0);
  const [hitsByType, setHitsByType] = useState<{ standard: number; special: number; bonus: number }>({
    standard: 0,
    special: 0,
    bonus: 0,
  });
  const [isNewBest, setIsNewBest] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getIsMuted());

  // UI Modals
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);

  // Camera & Hand Tracking State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isHandDetected, setIsHandDetected] = useState<boolean>(false);
  const [handCursor, setHandCursor] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [handLandmarks, setHandLandmarks] = useState<HandLandmarkPoint[] | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load high score from LocalStorage on mount
  useEffect(() => {
    const savedBest = localStorage.getItem('ar_game_best_score');
    if (savedBest) {
      setBestScore(parseInt(savedBest, 10) || 0);
    }
  }, []);

  // Show transient toast notification
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  }, []);

  // Start Webcam & MediaPipe
  const startCameraSystem = useCallback(async () => {
    if (!videoRef.current) return false;
    setCameraError(null);

    try {
      // 1. Start browser webcam stream
      await handTracker.startCamera(videoRef.current);
      setIsCameraReady(true);

      // 2. Initialize MediaPipe Task
      const loaded = await handTracker.initialize();
      if (!loaded) {
        throw new Error('Hand tracking engine failed to load.');
      }
      return true;
    } catch (err: unknown) {
      const errString = err instanceof Error ? err.message : 'Camera access failed';
      console.warn('Camera initiation issue:', errString);
      setCameraError(errString);
      setIsCameraReady(false);
      // Fallback automatically to Mouse Mode
      setGameMode('mouse');
      showToast('⚠️ Camera access unavailable. Switched to Mouse Mode automatically!');
      return false;
    }
  }, [showToast]);

  // Stop Webcam
  const stopCameraSystem = useCallback(() => {
    handTracker.stopCamera();
    setIsCameraReady(false);
    setIsHandDetected(false);
    setHandLandmarks(null);
  }, []);

  // Hand tracking frame loop (runs when in Camera Mode and Video is active)
  useEffect(() => {
    let animId: number;

    const trackLoop = (timestamp: number) => {
      if (gameMode === 'camera' && videoRef.current && videoRef.current.readyState >= 2) {
        const result = handTracker.detect(videoRef.current, timestamp);
        setIsHandDetected(result.isDetected);
        if (result.isDetected) {
          setHandCursor({ x: result.cursorX, y: result.cursorY });
          setHandLandmarks(result.landmarks);
        } else {
          setHandLandmarks(null);
        }
      }
      animId = requestAnimationFrame(trackLoop);
    };

    if (gameMode === 'camera' && (gameState === 'playing' || gameState === 'countdown')) {
      animId = requestAnimationFrame(trackLoop);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gameMode, gameState]);

  // Start / Reset match
  const startNewGame = useCallback(async () => {
    setScore(0);
    setTimeLeft(60);
    setCombo(1);
    setMaxCombo(1);
    setTargetsCollected(0);
    setTotalHits(0);
    setTotalMisses(0);
    setHitsByType({ standard: 0, special: 0, bonus: 0 });
    setIsNewBest(false);

    if (gameMode === 'camera') {
      const success = await startCameraSystem();
      if (!success) {
        setGameMode('mouse');
      }
    }

    setGameState('countdown');
  }, [gameMode, startCameraSystem]);

  // Toggle Game Mode
  const handleToggleMode = useCallback(async () => {
    sound.playClick();
    if (gameMode === 'mouse') {
      const success = await startCameraSystem();
      if (success) {
        setGameMode('camera');
        showToast('📷 Camera Mode Activated! Use your Index Finger.');
      }
    } else {
      stopCameraSystem();
      setGameMode('mouse');
      showToast('🖱️ Mouse Mode Activated! Click or tap to collect.');
    }
  }, [gameMode, startCameraSystem, stopCameraSystem, showToast]);

  // 60-Second Match Countdown Timer
  useEffect(() => {
    let interval: ReturnJSInterval | null = null;

    if (gameState === 'playing') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Match Finished!
            setGameState('gameover');
            return 0;
          }

          // Sound alarm for last 5 seconds
          if (prev <= 6) {
            sound.playHurryTick();
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState]);

  // Check Game Over & update High Score
  useEffect(() => {
    if (gameState === 'gameover') {
      if (score > bestScore) {
        setBestScore(score);
        setIsNewBest(true);
        localStorage.setItem('ar_game_best_score', String(score));
      } else {
        setIsNewBest(false);
      }
      stopCameraSystem();
    }
  }, [gameState, score, bestScore, stopCameraSystem]);

  // Target Hit Handler
  const handleTargetHit = useCallback(
    (points: number, type: TargetType) => {
      setCombo((prevCombo) => {
        const nextCombo = prevCombo + 1;
        setMaxCombo((max) => Math.max(max, nextCombo));

        // Combo Multiplier calculation (x1 up to x10)
        const currentMultiplier = Math.min(1 + Math.floor(nextCombo / 3), 10);
        const previousMultiplier = Math.min(1 + Math.floor(prevCombo / 3), 10);

        if (currentMultiplier > previousMultiplier) {
          sound.playComboUp(currentMultiplier);
        }

        const earned = points * currentMultiplier;
        setScore((s) => s + earned);
        return nextCombo;
      });

      setTargetsCollected((c) => c + 1);
      setTotalHits((h) => h + 1);
      setHitsByType((prev) => ({
        ...prev,
        [type]: prev[type] + 1,
      }));
    },
    []
  );

  // Target Miss Handler (clicked empty space in Mouse Mode)
  const handleTargetMiss = useCallback(() => {
    setTotalMisses((m) => m + 1);
    // Reset combo streak on click miss
    setCombo(1);
  }, []);

  // Sound Mute Toggle
  const handleToggleMute = useCallback(() => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  // Keyboard shortcut to Pause (Escape or Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Space') {
        if (gameState === 'playing') {
          e.preventDefault();
          sound.playClick();
          setGameState('paused');
        } else if (gameState === 'paused') {
          e.preventDefault();
          sound.playClick();
          setGameState('playing');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Current stats object for modals
  const currentStats: GameStats = {
    score,
    bestScore,
    targetsCollected,
    maxCombo,
    currentCombo: combo,
    totalHits,
    totalMisses,
    hitsByType,
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Hidden Video element for Camera stream */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
        autoPlay
      />

      {/* Cyber Grid Background (displayed always or dimmed under camera feed) */}
      <CyberBackground dimmed={gameMode === 'camera' && gameState === 'playing'} />

      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-slate-900/95 border border-cyan-400 text-cyan-200 text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(6,182,212,0.4)] backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none text-center max-w-md">
          {toastMessage}
        </div>
      )}

      {/* HOME / MENU SCREEN */}
      {gameState === 'menu' && (
        <HomeScreen
          selectedMode={gameMode}
          onSelectMode={(mode) => setGameMode(mode)}
          onStartGame={startNewGame}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          bestScore={bestScore}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isCameraReady={isCameraReady}
          cameraError={cameraError}
        />
      )}

      {/* COUNTDOWN SCREEN */}
      {gameState === 'countdown' && (
        <CountdownOverlay onComplete={() => setGameState('playing')} />
      )}

      {/* ACTIVE GAME CANVAS (Playing, Paused, or Countdown) */}
      {(gameState === 'playing' || gameState === 'paused' || gameState === 'countdown') && (
        <>
          <HUD
            score={score}
            bestScore={bestScore}
            timeLeft={timeLeft}
            combo={combo}
            targetsCollected={targetsCollected}
            mode={gameMode}
            isMuted={isMuted}
            isHandDetected={isHandDetected}
            onToggleMute={handleToggleMute}
            onPause={() => {
              sound.playClick();
              setGameState('paused');
            }}
            onExit={() => {
              sound.playClick();
              stopCameraSystem();
              setGameState('menu');
            }}
            onSwitchMode={handleToggleMode}
          />

          <GameCanvas
            mode={gameMode}
            isPlaying={gameState === 'playing'}
            timeLeft={timeLeft}
            onTargetHit={handleTargetHit}
            onTargetMiss={handleTargetMiss}
            cursorPos={handCursor}
            isHandDetected={isHandDetected}
            landmarks={handLandmarks}
            videoElement={videoRef.current}
          />
        </>
      )}

      {/* PAUSE MODAL */}
      <PauseModal
        isOpen={gameState === 'paused'}
        isMuted={isMuted}
        onResume={() => setGameState('playing')}
        onRestart={startNewGame}
        onMainMenu={() => {
          stopCameraSystem();
          setGameState('menu');
        }}
        onToggleMute={handleToggleMute}
      />

      {/* GAME OVER MODAL */}
      <GameOverModal
        isOpen={gameState === 'gameover'}
        stats={currentStats}
        isNewBest={isNewBest}
        onPlayAgain={startNewGame}
        onMainMenu={() => setGameState('menu')}
      />

      {/* HOW TO PLAY MODAL */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
type ReturnJSInterval = ReturnType<typeof setInterval>;
