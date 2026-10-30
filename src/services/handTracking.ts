import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandLandmarkPoint } from '../types/game';

// MediaPipe hand landmark connections for skeleton rendering
export const HAND_CONNECTIONS: [number, number][] = [
  // Palm
  [0, 1], [0, 5], [5, 9], [9, 13], [13, 17], [0, 17],
  // Thumb
  [1, 2], [2, 3], [3, 4],
  // Index
  [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [17, 18], [18, 19], [19, 20]
];

export interface HandDetectionResult {
  cursorX: number; // 0 to 1, mirrored for player perspective
  cursorY: number; // 0 to 1
  isDetected: boolean;
  landmarks: HandLandmarkPoint[] | null;
  rawIndexTip: HandLandmarkPoint | null;
  pinchDistance: number; // distance between index tip and thumb tip
}

class HandTrackingService {
  private landmarker: HandLandmarker | null = null;
  private isInitializing: boolean = false;
  private initPromise: Promise<boolean> | null = null;
  private stream: MediaStream | null = null;
  private lastSmoothedX: number = 0.5;
  private lastSmoothedY: number = 0.5;
  private hasPreviousPosition: boolean = false;
  private smoothingFactor: number = 0.42; // balance between responsiveness and smoothness

  public async initialize(): Promise<boolean> {
    if (this.landmarker) return true;
    if (this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        this.isInitializing = false;
        return true;
      } catch (err) {
        console.warn('Failed to load MediaPipe HandLandmarker with GPU, retrying CPU delegate:', err);
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );
          this.landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          this.isInitializing = false;
          return true;
        } catch (innerErr) {
          console.error('HandLandmarker initialization failed:', innerErr);
          this.isInitializing = false;
          return false;
        }
      }
    })();

    return this.initPromise;
  }

  public async startCamera(videoElement: HTMLVideoElement, facingMode: 'user' | 'environment' = 'user'): Promise<MediaStream> {
    this.stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access API is not supported in this browser.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    this.stream = stream;
    videoElement.srcObject = stream;
    videoElement.setAttribute('playsinline', 'true');
    videoElement.muted = true;

    await new Promise<void>((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play().then(() => resolve()).catch(() => resolve());
      };
    });

    return stream;
  }

  public stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  public detect(videoElement: HTMLVideoElement, timestamp: number): HandDetectionResult {
    const defaultResult: HandDetectionResult = {
      cursorX: this.lastSmoothedX,
      cursorY: this.lastSmoothedY,
      isDetected: false,
      landmarks: null,
      rawIndexTip: null,
      pinchDistance: 1.0,
    };

    if (!this.landmarker || !videoElement || videoElement.readyState < 2) {
      return defaultResult;
    }

    try {
      const results = this.landmarker.detectForVideo(videoElement, timestamp);

      if (results.landmarks && results.landmarks.length > 0 && results.landmarks[0].length > 8) {
        const rawLandmarks = results.landmarks[0];
        const indexTip = rawLandmarks[8];
        const thumbTip = rawLandmarks[4];

        // Mirrored X for intuitive user experience (mirror view)
        const targetX = 1 - indexTip.x;
        const targetY = indexTip.y;

        // Exponential smoothing filter (LERP)
        if (!this.hasPreviousPosition) {
          this.lastSmoothedX = targetX;
          this.lastSmoothedY = targetY;
          this.hasPreviousPosition = true;
        } else {
          this.lastSmoothedX = this.lastSmoothedX + (targetX - this.lastSmoothedX) * this.smoothingFactor;
          this.lastSmoothedY = this.lastSmoothedY + (targetY - this.lastSmoothedY) * this.smoothingFactor;
        }

        // Calculate pinch distance between thumb tip and index tip (mirrored coords)
        const dx = (1 - thumbTip.x) - (1 - indexTip.x);
        const dy = thumbTip.y - indexTip.y;
        const dz = (thumbTip.z || 0) - (indexTip.z || 0);
        const pinchDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Convert landmarks to mirrored format for overlay rendering
        const mirroredLandmarks: HandLandmarkPoint[] = rawLandmarks.map((lm) => ({
          x: 1 - lm.x, // mirror horizontally
          y: lm.y,
          z: lm.z || 0,
        }));

        return {
          cursorX: Math.max(0, Math.min(1, this.lastSmoothedX)),
          cursorY: Math.max(0, Math.min(1, this.lastSmoothedY)),
          isDetected: true,
          landmarks: mirroredLandmarks,
          rawIndexTip: {
            x: 1 - indexTip.x,
            y: indexTip.y,
            z: indexTip.z || 0,
          },
          pinchDistance,
        };
      }
    } catch {
      // Ignore transient frame detection errors
    }

    return defaultResult;
  }

  public resetSmoothing() {
    this.hasPreviousPosition = false;
  }

  public getIsReady(): boolean {
    return this.landmarker !== null;
  }
}

export const handTracker = new HandTrackingService();
