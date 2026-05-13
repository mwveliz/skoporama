"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  HIERARCHICAL_LAYOUT,
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
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [dwellKeyId, setDwellKeyId] = useState<string | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0);
  const ttsRef = useRef<WebTTSEngine | null>(null);
  const dwellRef = useRef<{ keyId: string | null; startTime: number; fired: boolean }>({
    keyId: null,
    startTime: 0,
    fired: false,
  });

  const DWELL_TIME_MS = 1500; // 1.5 seconds to select

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

  // Update predictions when text changes
  useEffect(() => {
    const currentWord = getCurrentWord(text);
    if (currentWord.length >= 1) {
      const preds = predictFromPrefix(currentWord, {
        maxResults: 5,
        language: "es",
      });
      setPredictions(preds);
    } else {
      setPredictions([]);
    }
  }, [text]);

  const handleKeyPress = useCallback(
    (key: KeyDefinition) => {
      let isAction = false;
      switch (key.type) {
        case "group":
          setActiveGroupId(key.id);
          flashKey(key.id);
          return; // Stay in keyboard
        case "back":
          setActiveGroupId(null);
          flashKey(key.id);
          return; // Stay in keyboard
        case "letter":
          setText((t) => t + key.value);
          flashKey(key.id);
          isAction = true;
          break;
        case "space":
          setText((t) => t + " ");
          flashKey(key.id);
          isAction = true;
          break;
        case "backspace":
          setText((t) => t.slice(0, -1));
          flashKey(key.id);
          isAction = true;
          break;
        case "speak":
          handleSpeak();
          isAction = true;
          break;
        case "phrases":
          setShowPhrases(true);
          isAction = true;
          break;
        default:
          break;
      }
      
      // Auto-return to main groups after picking a letter/action
      if (isAction && activeGroupId) {
        setActiveGroupId(null);
      }
    },
    [text, activeGroupId]
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

  // ── Dwell detection: gaze stays on a key → select it ──
  useEffect(() => {
    if (gaze.status !== "tracking" || !gaze.gazePoint) {
      setDwellKeyId(null);
      setDwellProgress(0);
      return;
    }

    // Find which key element is under the gaze point
    const el = document.elementFromPoint(gaze.gazePoint.x, gaze.gazePoint.y);
    const keyEl = el?.closest("[id^='key-']") as HTMLElement | null;
    const hoveredKeyId = keyEl?.id?.replace("key-", "") || null;

    const dwell = dwellRef.current;
    const now = performance.now();

    if (hoveredKeyId && hoveredKeyId === dwell.keyId) {
      // Same key — accumulate time
      const elapsed = now - dwell.startTime;
      const progress = Math.min(elapsed / DWELL_TIME_MS, 1);
      setDwellProgress(progress);
      setDwellKeyId(hoveredKeyId);

      if (progress >= 1 && !dwell.fired) {
        // FIRE! Find the key definition and press it
        dwell.fired = true;
        const currentLayout = activeGroupId 
          ? HIERARCHICAL_LAYOUT.groups[activeGroupId as keyof typeof HIERARCHICAL_LAYOUT.groups]
          : HIERARCHICAL_LAYOUT.main;

        for (const row of currentLayout) {
          const keyDef = row.find((k) => k.id === hoveredKeyId);
          if (keyDef) {
            handleKeyPress(keyDef);
            break;
          }
        }
        // Reset after firing
        setTimeout(() => {
          dwellRef.current = { keyId: null, startTime: 0, fired: false };
          setDwellKeyId(null);
          setDwellProgress(0);
        }, 300);
      }
    } else {
      // Different key or no key — reset
      dwell.keyId = hoveredKeyId;
      dwell.startTime = now;
      dwell.fired = false;
      setDwellKeyId(hoveredKeyId);
      setDwellProgress(0);
    }
  }, [gaze.gazePoint, gaze.status, handleKeyPress]);

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

      {/* Prediction Bar */}
      <div className="prediction-bar">
        {Array.from({ length: 5 }).map((_, i) => {
          const pred = predictions[i];
          return (
            <button
              key={i}
              className={`prediction-chip ${!pred ? "empty" : ""}`}
              onClick={() => pred && handleSelectPrediction(pred)}
              disabled={!pred}
              id={`prediction-${i}`}
            >
              <span>{pred?.word ?? "·"}</span>
              {pred && (
                <span className="prediction-source">{pred.source}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Keyboard */}
      <div className="keyboard">
        {(activeGroupId 
          ? HIERARCHICAL_LAYOUT.groups[activeGroupId as keyof typeof HIERARCHICAL_LAYOUT.groups]
          : HIERARCHICAL_LAYOUT.main
        ).map((row, rowIndex) => (
          <div className="keyboard-row" key={`row-${rowIndex}`}>
            {row.map((key) => {
              const isGazed = dwellKeyId === key.id;
              return (
                <button
                  key={key.id}
                  className={`key key-giant ${getKeyClass(key)} ${activeKey === key.id ? "selected" : ""} ${isGazed ? "gaze-active" : ""}`}
                  onClick={() => handleKeyPress(key as KeyDefinition)}
                  style={key.width ? { flex: key.width } : undefined}
                  id={`key-${key.id}`}
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
        ))}
      </div>

      {/* Gaze indicator */}
      {gaze.gazePoint && gaze.status === "tracking" && (
        <div
          className="gaze-indicator"
          style={{ left: gaze.gazePoint.x, top: gaze.gazePoint.y }}
        >
          <div className="gaze-dot" />
          <div className="gaze-ring" />
        </div>
      )}

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
            {DEFAULT_PHRASE_CATEGORIES.map((category) => (
              <div className="phrase-category" key={category.id}>
                <div className="phrase-category-title">
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </div>
                <div className="phrase-grid">
                  {category.phrases.map((phrase) => (
                    <button
                      key={phrase}
                      className="phrase-btn"
                      onClick={() => handleSelectPhrase(phrase)}
                      id={`phrase-${phrase.replace(/\s/g, "-").toLowerCase()}`}
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>
            ))}
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
