"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  OUIJA_LAYOUT,
  DEFAULT_PHRASE_CATEGORIES,
  type KeyDefinition,
  type Prediction,
} from "@skoporama/core";
import { predictFromPrefix, getCurrentWord } from "@skoporama/lang";
import { WebTTSEngine } from "@skoporama/speech";
import { useGaze } from "./use-gaze";

type AppScreen = "welcome" | "keyboard";

// ─── Status label map ───
const STATUS_LABELS: Record<string, string> = {
  idle: "Eye tracking inactivo",
  loading: "Cargando cámara…",
  ready: "Cámara lista — calibrar para comenzar",
  calibrating: "Calibrando…",
  tracking: "Eye tracking activo",
  error: "Error",
};

const STATUS_DOT_CLASS: Record<string, string> = {
  idle: "",
  loading: "calibrating",
  ready: "",
  calibrating: "calibrating",
  tracking: "active",
  error: "error",
};

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [text, setText] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showPhrases, setShowPhrases] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [dwellKeyId, setDwellKeyId] = useState<string | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef<number>(0);
  const ttsRef = useRef<WebTTSEngine | null>(null);
  const dwellRef = useRef<{ keyId: string | null; startTime: number; fired: boolean }>({
    keyId: null,
    startTime: 0,
    fired: false,
  });

  const DWELL_TIME_MS = 2000; // 2 seconds to select

  const gaze = useGaze();

  // Initialize TTS engine
  useEffect(() => {
    ttsRef.current = new WebTTSEngine();
  }, []);

  // Listen for spacebar during calibration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && gaze.calibration) {
        e.preventDefault();
        gaze.collectCalibrationSample();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gaze.calibration, gaze.collectCalibrationSample]);



  const handleKeyPress = useCallback(
    (key: KeyDefinition) => {
      switch (key.type) {
        case "letter":
          setText((t) => t + key.value);
          flashKey(key.id);
          break;
        case "space":
          setText((t) => t + " ");
          flashKey(key.id);
          break;
        case "backspace":
          setText((t) => t.slice(0, -1));
          flashKey(key.id);
          break;
        case "speak":
          handleSpeak();
          break;
        case "phrases":
          setShowPhrases(true);
          break;
        default:
          break;
      }
    },
    [text]
  );

  const handleSpeak = useCallback(async () => {
    if (!ttsRef.current || !text.trim()) return;
    setIsSpeaking(true);
    try {
      await ttsRef.current.speak(text, {
        language: "es-ES",
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch {
      setIsSpeaking(false);
    }
  }, [text]);

  const handleStopSpeaking = useCallback(() => {
    ttsRef.current?.stop();
    setIsSpeaking(false);
  }, []);

  const handleSelectPrediction = useCallback((pred: Prediction) => {
    setText((t) => {
      const words = t.split(" ");
      words[words.length - 1] = pred.word;
      return words.join(" ") + " ";
    });
    setPredictions([]);
  }, []);

  const handleSelectPhrase = useCallback((phrase: string) => {
    setText((t) => (t ? t + " " + phrase : phrase));
    setShowPhrases(false);
  }, []);

  const flashKey = (keyId: string) => {
    setActiveKey(keyId);
    setTimeout(() => setActiveKey(null), 200);
  };

  // ── Scroll Animation Loop ──
  useEffect(() => {
    let animationId: number;
    
    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;
      
      if (velocityRef.current !== 0) {
        setScrollOffset((prev) => {
          // Calculate bounds. Left boundary is easy (0 or slightly positive)
          // Right boundary depends on total width. OUIJA_LAYOUT length * 120px
          const BUTTON_WIDTH = 120;
          const totalWidth = OUIJA_LAYOUT.length * BUTTON_WIDTH;
          const maxScrollRight = window.innerWidth / 2; 
          const maxScrollLeft = -(totalWidth) + window.innerWidth / 2;
          
          let newOffset = prev + velocityRef.current * deltaTime * 0.05;
          // Clamp scroll to avoid disappearing
          if (newOffset > maxScrollRight) newOffset = maxScrollRight;
          if (newOffset < maxScrollLeft) newOffset = maxScrollLeft;
          
          return newOffset;
        });
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // ── Determine Velocity based on Gaze X ──
  useEffect(() => {
    if (gaze.status !== "tracking" || !gaze.gazePoint) {
      velocityRef.current = 0;
      return;
    }
    
    const x = gaze.gazePoint.x;
    const width = window.innerWidth;
    
    const ZONE_LEFT = width * 0.35;
    const ZONE_RIGHT = width * 0.65;
    
    if (x < ZONE_LEFT) {
      // Mirar izquierda -> Mover cinta a la derecha (scroll positivo)
      const intensity = (ZONE_LEFT - x) / ZONE_LEFT;
      velocityRef.current = intensity * 15; // Velocidad max
    } else if (x > ZONE_RIGHT) {
      // Mirar derecha -> Mover cinta a la izquierda (scroll negativo)
      const intensity = (x - ZONE_RIGHT) / (width - ZONE_RIGHT);
      velocityRef.current = -intensity * 15;
    } else {
      velocityRef.current = 0;
    }
  }, [gaze.gazePoint, gaze.status]);

  // ── Dwell detection: fixed central marker ──
  useEffect(() => {
    if (gaze.status !== "tracking" || !gaze.gazePoint) {
      setDwellKeyId(null);
      setDwellProgress(0);
      return;
    }

    // Only progress dwell if we are in the center zone (not scrolling)
    if (velocityRef.current !== 0) {
      setDwellKeyId(null);
      setDwellProgress(0);
      dwellRef.current.startTime = performance.now();
      return;
    }

    const now = performance.now();
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Detect what is strictly in the center of the screen
    let hoveredKeyId: string | null = null;
    
    // Y-coordinate of the keyboard row is generally lower half.
    // But since the marker is fixed in CSS, we can just use the exact center.
    const el = document.elementFromPoint(width / 2, height / 2 + 50); // +50 to hit the buttons
    const keyEl = el?.closest("[id^='key-'], [id^='phrase-'], [id^='btn-']") as HTMLElement | null;
    hoveredKeyId = keyEl?.id || null;

    const dwell = dwellRef.current;

    if (hoveredKeyId && hoveredKeyId === dwell.keyId) {
      const elapsed = now - dwell.startTime;
      const progress = Math.min(elapsed / DWELL_TIME_MS, 1);
      setDwellProgress(progress);
      setDwellKeyId(hoveredKeyId);

      if (progress >= 1 && !dwell.fired) {
        dwell.fired = true;

        if (hoveredKeyId.startsWith("phrase-")) {
          const phraseText = hoveredKeyId.replace("phrase-", "").replace(/-/g, " ");
          const realPhrase = DEFAULT_PHRASE_CATEGORIES.flatMap(c => c.phrases)
            .find(p => p.replace(/\s/g, "-").toLowerCase() === hoveredKeyId.replace("phrase-", ""));
          handleSelectPhrase(realPhrase || phraseText);
        } else if (hoveredKeyId === "btn-close-phrases") {
          setShowPhrases(false);
        } else {
          // Normal key
          const rawKeyId = hoveredKeyId.replace("key-", "");
          const keyDef = OUIJA_LAYOUT.find((k) => k.id === rawKeyId);
          if (keyDef) {
            handleKeyPress(keyDef);
          }
        }

        setTimeout(() => {
          dwellRef.current = { keyId: null, startTime: now + 500, fired: false };
          setDwellKeyId(null);
          setDwellProgress(0);
        }, 300);
      }
    } else {
      dwell.keyId = hoveredKeyId;
      dwell.startTime = now;
      dwell.fired = false;
      setDwellKeyId(hoveredKeyId);
      setDwellProgress(0);
    }
  }, [gaze.gazePoint, gaze.status, handleKeyPress, handleSelectPhrase, scrollOffset]);
  // ── Enter keyboard, optionally start calibration ──
  const enterKeyboard = useCallback(
    (startCalibrating: boolean) => {
      setScreen("keyboard");
      if (startCalibrating) {
        // Only start camera when user explicitly chose to calibrate
        setTimeout(async () => {
          if (gaze.status === "idle") {
            await gaze.startCamera();
            // Small delay for camera to stabilize before calibrating
            setTimeout(() => gaze.startCalibration(), 1500);
          }
        }, 100);
      }
      // Otherwise just show the keyboard — camera can be activated via ⚙️
    },
    [gaze]
  );

  // ─── Welcome Screen ───
  if (screen === "welcome") {
    return (
      <div className="welcome-screen">
        <div className="welcome-logo">👁️</div>
        <h1 className="welcome-title">Skoporama</h1>
        <p className="welcome-subtitle">
          Teclado virtual controlado por la mirada. Escribe y habla usando solo
          tus ojos — sin hardware especial, completamente gratis.
        </p>
        <div className="welcome-actions">
          <button
            className="btn-primary"
            onClick={() => enterKeyboard(false)}
            id="btn-start-keyboard"
          >
            ⌨️ Empezar a escribir
          </button>
          <button
            className="btn-secondary"
            onClick={() => enterKeyboard(true)}
            id="btn-start-calibrate"
          >
            👁️ Calibrar eye-tracking
          </button>
        </div>
        <p className="welcome-note">
          Solo necesitas una webcam estándar. Tu cámara nunca graba ni envía
          datos — todo se procesa localmente en tu dispositivo.
        </p>
      </div>
    );
  }

  // ─── Keyboard Screen ───
  return (
    <div className="app-container">
      {/* Hidden video for camera feed */}
      <video
        ref={gaze.videoRef}
        style={{ position: "fixed", top: -9999, left: -9999, width: 1, height: 1 }}
        playsInline
        muted
      />

      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <span className="logo-icon">👁️</span>
          Skoporama
        </div>
        <div className="header-status">
          <div className="status-indicator">
            <div className={`status-dot ${STATUS_DOT_CLASS[gaze.status] || ""}`} />
            <span>{gaze.error || STATUS_LABELS[gaze.status] || gaze.status}</span>
          </div>
          <button
            className="settings-btn"
            title="Configuración"
            id="btn-settings"
            onClick={() => setShowSettings((s) => !s)}
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Settings dropdown */}
      {showSettings && (
        <div className="settings-dropdown">
          {gaze.status === "idle" && (
            <button className="settings-item" onClick={() => { gaze.startCamera(); setShowSettings(false); }}>
              📷 Activar cámara
            </button>
          )}
          {(gaze.status === "ready" || gaze.status === "tracking") && (
            <button className="settings-item" onClick={() => { gaze.startCalibration(); setShowSettings(false); }}>
              🎯 {gaze.status === "tracking" ? "Recalibrar" : "Calibrar"}
            </button>
          )}
          {gaze.status === "tracking" && (
            <button className="settings-item" onClick={() => { localStorage.removeItem("skoporama_gaze_model"); gaze.stopCamera(); setShowSettings(false); }}>
              🗑️ Borrar calibración
            </button>
          )}
          {gaze.status !== "idle" && (
            <button className="settings-item" onClick={() => { gaze.stopCamera(); setShowSettings(false); }}>
              ⏹ Apagar cámara
            </button>
          )}
          <button className="settings-item" onClick={() => setShowSettings(false)}>
            ✕ Cerrar
          </button>
        </div>
      )}

      {/* Text Display */}
      <div className="text-display">
        <div className={`text-content ${!text ? "empty" : ""}`}>
          {text || "Empieza a escribir con el teclado..."}
          {text && <span className="cursor-blink" />}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
          {text && (
            <button
              className="clear-button"
              onClick={() => setText("")}
              id="btn-clear"
            >
              ✕
            </button>
          )}
          <button
            className={`speak-button ${isSpeaking ? "speaking" : ""}`}
            onClick={isSpeaking ? handleStopSpeaking : handleSpeak}
            disabled={!text.trim()}
            id="btn-speak"
          >
            {isSpeaking ? "⏹ Parar" : "🔊 Hablar"}
          </button>
        </div>
      </div>

      {/* Ouija Marker (Fixed Center) */}
      <div className="ouija-marker">
        <div className="ouija-marker-crosshair" />
      </div>

      {/* Keyboard Ribbon */}
      <div className="ouija-container">
        <div 
          className="ouija-strip"
          style={{ transform: `translateX(${scrollOffset}px)` }}
        >
          {OUIJA_LAYOUT.map((key) => {
            const keyId = `key-${key.id}`;
            const isGazed = dwellKeyId === keyId;
            return (
              <button
                key={key.id}
                className={`key key-giant ${getKeyClass(key)} ${activeKey === key.id ? "selected" : ""} ${isGazed ? "gaze-active" : ""}`}
                onClick={() => handleKeyPress(key as KeyDefinition)}
                style={key.width ? { width: `${key.width * 120}px` } : { width: '120px' }}
                id={keyId}
              >
                {/* Dwell fill bar */}
                {isGazed && dwellProgress > 0 && (
                  <div
                    className="dwell-fill"
                    style={{ width: `${dwellProgress * 100}%` }}
                  />
                )}
                {key.label}
              </button>
            );
          })}
        </div>
      </div>



      {/* Calibration overlay */}
      {gaze.calibration && (
        <div className="calibration-overlay" onClick={gaze.collectCalibrationSample}>
          <div className="calibration-instructions">
            <h2>Calibración</h2>
            <p>
              Mira fijamente al punto y haz clic (o presiona espacio) para
              capturar. Punto {gaze.calibration.currentIndex + 1} de{" "}
              {gaze.calibration.points.length}.
            </p>
          </div>

          {/* Current calibration target */}
          {gaze.calibration.currentIndex < gaze.calibration.points.length && (
            <div
              className="calibration-point"
              style={{
                left: gaze.calibration.points[gaze.calibration.currentIndex].x,
                top: gaze.calibration.points[gaze.calibration.currentIndex].y,
              }}
            >
              <div className="outer-ring" />
              <div className="inner-dot" />
            </div>
          )}

          {/* Progress dots */}
          <div className="calibration-progress">
            {gaze.calibration.points.map((_, i) => (
              <div
                key={i}
                className={`cal-progress-dot ${
                  i < gaze.calibration!.currentIndex
                    ? "done"
                    : i === gaze.calibration!.currentIndex
                    ? "current"
                    : ""
                }`}
              />
            ))}
          </div>

          <button
            className="btn-secondary"
            style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", width: "auto", padding: "10px 24px" }}
            onClick={gaze.cancelCalibration}
          >
            ✕ Cancelar calibración
          </button>
        </div>
      )}

      {/* Phrases Panel */}
      {showPhrases && (
        <div
          className="phrases-overlay"
          onClick={() => setShowPhrases(false)}
        >
          <div
            className="phrases-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>💬 Frases Rápidas</h2>
            <div className="phrases-ribbon-container">
              <div className="offscreen-hint left" id="offscreen-left">⬅️</div>
              <div className="phrases-ribbon">
                {DEFAULT_PHRASE_CATEGORIES.flatMap(c => c.phrases).map((phrase) => {
                  const phraseId = `phrase-${phrase.replace(/\s/g, "-").toLowerCase()}`;
                  const isGazed = dwellKeyId === phraseId;
                  
                  return (
                    <button
                      key={phrase}
                      className={`phrase-btn ${isGazed ? "gaze-active" : ""}`}
                      onClick={() => handleSelectPhrase(phrase)}
                      id={phraseId}
                    >
                      {/* Dwell fill bar */}
                      {isGazed && dwellProgress > 0 && (
                        <div
                          className="dwell-fill"
                          style={{ width: `${dwellProgress * 100}%` }}
                        />
                      )}
                      {phrase}
                    </button>
                  );
                })}
              </div>
              <div className="offscreen-hint right" id="offscreen-right">➡️</div>
            </div>
            <button
              className="phrases-close"
              onClick={() => setShowPhrases(false)}
              id="btn-close-phrases"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Get CSS class for special key types */
function getKeyClass(key: KeyDefinition): string {
  switch (key.type) {
    case "backspace":
      return "key-backspace";
    case "space":
      return "key-space key-wide";
    case "speak":
      return "key-speak key-wide";
    case "phrases":
      return "key-phrases key-wide";
    case "group":
      return "key-group key-wide";
    case "back":
      return "key-back key-wide";
    default:
      return "";
  }
}
