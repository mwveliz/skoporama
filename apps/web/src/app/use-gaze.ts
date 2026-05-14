"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  extractIrisFeatures,
  featuresToArray,
  GazeRegressionModel,
  generateCalibrationPoints,
  GazeFilter,
} from "@skoporama/gaze";
import type { Point, CalibrationPoint } from "@skoporama/core";

/**
 * Generates 13 calibration points with emphasis on lateral ranges
 */
const generateEnhancedCalibrationPoints = (width: number, height: number): Point[] => {
  const x = [0.1, 0.25, 0.5, 0.75, 0.9];
  const y = [0.1, 0.5, 0.9];
  
  const points: Point[] = [
    // Top Row (5 points)
    { x: width * 0.1, y: height * 0.1 },
    { x: width * 0.25, y: height * 0.1 },
    { x: width * 0.5, y: height * 0.1 },
    { x: width * 0.75, y: height * 0.1 },
    { x: width * 0.9, y: height * 0.1 },
    
    // Middle Row (3 points)
    { x: width * 0.1, y: height * 0.5 },
    { x: width * 0.5, y: height * 0.5 },
    { x: width * 0.9, y: height * 0.5 },
    
    // Bottom Row (5 points)
    { x: width * 0.1, y: height * 0.9 },
    { x: width * 0.25, y: height * 0.9 },
    { x: width * 0.5, y: height * 0.9 },
    { x: width * 0.75, y: height * 0.9 },
    { x: width * 0.9, y: height * 0.9 },
  ];
  
  return points;
};

// ─── Types ───

export type GazeStatus = "idle" | "loading" | "ready" | "calibrating" | "tracking" | "error";

export interface CalibrationState {
  points: Point[];
  currentIndex: number;
  samples: CalibrationPoint[];
  collecting: boolean;
}

export interface UseGazeReturn {
  status: GazeStatus;
  error: string | null;
  gazePoint: Point | null;
  calibration: CalibrationState | null;

  startCamera: () => Promise<void>;
  stopCamera: () => void;
  startCalibration: () => void;
  collectCalibrationSample: () => void;
  cancelCalibration: () => void;

  videoRef: React.RefObject<HTMLVideoElement | null>;
}

// ─── Hook ───

export function useGaze(): UseGazeReturn {
  const [status, setStatus] = useState<GazeStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [gazePoint, setGazePoint] = useState<Point | null>(null);
  const [calibration, setCalibration] = useState<CalibrationState | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<any>(null);
  const modelRef = useRef(new GazeRegressionModel());
  const filterRef = useRef(new GazeFilter(30, { minCutoff: 1.0, beta: 0.1 }));
  const rafRef = useRef<number>(0);
  const samplesRef = useRef<CalibrationPoint[]>([]);
  const collectingRef = useRef(false);
  const calPointsRef = useRef<Point[]>([]);
  const calIndexRef = useRef(0);

  // ── Start camera + load FaceMesh ──
  const startCamera = useCallback(async () => {
    try {
      setStatus("loading");
      setError(null);

      // Request camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Load MediaPipe FaceLandmarker
      const vision = await import("@mediapipe/tasks-vision");
      const { FaceLandmarker, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });

      faceMeshRef.current = faceLandmarker;
      setStatus("ready");
    } catch (err: any) {
      console.error("Camera/FaceMesh error:", err);
      setError(err.message || "No se pudo acceder a la cámara");
      setStatus("error");
    }
  }, []);

  // ── Stop camera ──
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    faceMeshRef.current?.close();
    faceMeshRef.current = null;
    setStatus("idle");
    setGazePoint(null);
    setCalibration(null);
  }, []);

  // ── Tracking loop ──
  const startTrackingLoop = useCallback(() => {
    const tick = () => {
      if (!faceMeshRef.current || !videoRef.current) return;
      const video = videoRef.current;
      if (video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (faceMeshRef.current && typeof faceMeshRef.current.detectForVideo === 'function') {
        try {
          const result = faceMeshRef.current.detectForVideo(video, performance.now());
          if (result.faceLandmarks && result.faceLandmarks.length > 0) {
            const landmarks = result.faceLandmarks[0];
            const features = extractIrisFeatures(landmarks);
            if (features && modelRef.current.isTrained()) {
              const raw = modelRef.current.predict(features);
              if (raw) {
                const filtered = filterRef.current.filter(raw.x, raw.y);
                setGazePoint(filtered);
              }
            }
          }
        } catch (err) {
          console.error("Tracking loop detection error:", err);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Start calibration ──
  const startCalibration = useCallback(() => {
    const points = generateEnhancedCalibrationPoints(window.innerWidth, window.innerHeight);
    calPointsRef.current = points;
    calIndexRef.current = 0;
    samplesRef.current = [];
    collectingRef.current = false;
    setCalibration({ points, currentIndex: 0, samples: [], collecting: false });
    setStatus("calibrating");
    cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Collect samples at current calibration point ──
  const collectCalibrationSample = useCallback(() => {
    if (!faceMeshRef.current || !videoRef.current) return;
    const idx = calIndexRef.current;
    const target = calPointsRef.current[idx];
    if (!target) return;
    if (collectingRef.current) return;

    collectingRef.current = true;
    setCalibration((prev) => prev ? { ...prev, collecting: true } : prev);

    let count = 0;
    const maxSamples = 20;

    const collect = () => {
      if (count >= maxSamples || !faceMeshRef.current || !videoRef.current) {
        // Done with this point — advance
        collectingRef.current = false;
        const nextIdx = idx + 1;
        calIndexRef.current = nextIdx;

        if (nextIdx >= calPointsRef.current.length) {
          // All done — train
          try {
            modelRef.current = new GazeRegressionModel();
            modelRef.current.train(samplesRef.current);
            localStorage.setItem(
              "skoporama_gaze_model",
              modelRef.current.exportWeights()!
            );
            filterRef.current.reset();
            setCalibration(null);
            setStatus("tracking");
            startTrackingLoop();
          } catch (err: any) {
            setError(err.message);
            setStatus("error");
          }
        } else {
          setCalibration((prev) =>
            prev ? { ...prev, currentIndex: nextIdx, collecting: false, samples: [...samplesRef.current] } : prev
          );
        }
        return;
      }

      const video = videoRef.current!;
      if (video.readyState >= 2 && faceMeshRef.current && typeof faceMeshRef.current.detectForVideo === 'function') {
        try {
          const result = faceMeshRef.current.detectForVideo(video, performance.now());
          if (result.faceLandmarks && result.faceLandmarks.length > 0) {
            const features = extractIrisFeatures(result.faceLandmarks[0]);
            if (features) {
              samplesRef.current.push({
                screenPosition: target,
                irisFeatures: featuresToArray(features),
                timestamp: Date.now(),
              });
              count++;
            }
          }
        } catch (err) {
          console.error("Error during face detection:", err);
        }
      }
      requestAnimationFrame(collect);
    };

    requestAnimationFrame(collect);
  }, [startTrackingLoop]);

  // ── Cancel calibration ──
  const cancelCalibration = useCallback(() => {
    collectingRef.current = false;
    setCalibration(null);
    if (modelRef.current.isTrained()) {
      setStatus("tracking");
      startTrackingLoop();
    } else {
      setStatus("ready");
    }
  }, [startTrackingLoop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      faceMeshRef.current?.close();
    };
  }, []);

  return {
    status,
    error,
    gazePoint,
    calibration,
    startCamera,
    stopCamera,
    startCalibration,
    collectCalibrationSample,
    cancelCalibration,
    videoRef,
  };
}
