
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GameChallenge, GameState, Biome } from '../types';
import { GeminiService } from '../services/geminiService';
import NatureCard from './NatureCard';

const GameContainer: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [challenge, setChallenge] = useState<GameChallenge | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("ESTABLISHING UPLINK...");
  const [zoom, setZoom] = useState(1);
  const [thermalActive, setThermalActive] = useState(false);
  const [thermalCharge, setThermalCharge] = useState(100);
  const [currentHintIdx, setCurrentHintIdx] = useState(-1);
  const [startTime, setStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [signalStrength, setSignalStrength] = useState(0);
  const [ghilliePassActive, setGhilliePassActive] = useState(false);
  
  const imgRef = useRef<HTMLDivElement>(null);

  // Live timer
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, startTime]);

  const resetGame = useCallback(() => {
    setChallenge(null);
    setZoom(1);
    setThermalActive(false);
    setThermalCharge(100);
    setCurrentHintIdx(-1);
    setStartTime(0);
    setElapsedTime(0);
    setSignalStrength(0);
    setGameState(GameState.START);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (gameState !== GameState.PLAYING || !challenge || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const targetX = challenge.boundingBox.left + (challenge.boundingBox.width / 2);
    const targetY = challenge.boundingBox.top + (challenge.boundingBox.height / 2);
    
    const dist = Math.sqrt(Math.pow(x - targetX, 2) + Math.pow(y - targetY, 2));
    const strength = Math.max(0, 100 - (dist * 2.5));
    setSignalStrength(strength);
  };

  const startExpedition = async (biome: Biome) => {
    setGameState(GameState.LOADING);
    setLoadingMsg(ghilliePassActive ? "INITIALIZING 8K NEURAL RENDER..." : "RENDERING BIOME TILESET...");
    try {
      const data = await GeminiService.generateExpedition(biome, ghilliePassActive);
      setChallenge(data);
      setGameState(GameState.BRIEFING);
    } catch (e: any) {
      console.error("Expedition failed:", e);
      setGameState(GameState.START);
      alert("UPLINK FAILED. RETRY.");
    }
  };

  const toggleThermal = () => {
    if (thermalCharge > 0 && !thermalActive) {
      setThermalActive(true);
      const timer = setInterval(() => {
        setThermalCharge(c => {
          if (c <= 0) {
            clearInterval(timer);
            setThermalActive(false);
            return 0;
          }
          return c - 10;
        });
      }, 500);
    }
  };

  const checkDiscovery = (e: React.MouseEvent) => {
    if (gameState !== GameState.PLAYING) return;
    if (signalStrength > 85) {
      setGameState(GameState.FOUND);
    }
  };

  if (gameState === GameState.START) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#020202]">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-7xl font-black tracking-tighter text-white font-['Orbitron'] italic glitch-text">CRYPSIS</h1>
            <p className="text-emerald-500 font-bold tracking-[0.5em] text-xs">ADVANCED BIOMETRIC TRACKER v2.5</p>
          </div>

          <div className="flex items-center justify-center gap-6 py-4">
            <button 
              onClick={() => setGhilliePassActive(!ghilliePassActive)}
              className={`flex items-center gap-4 px-6 py-3 border rounded-sm transition-all ${
                ghilliePassActive 
                  ? 'bg-emerald-950/40 border-emerald-400 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.2)]' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ghilliePassActive ? 'bg-emerald-500 text-black' : 'bg-zinc-800'}`}>
                <i className="fa-solid fa-crown text-sm"></i>
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-widest">Ghillie Pass</div>
                <div className="text-xs font-bold">{ghilliePassActive ? '8K RENDER ACTIVE' : 'STANDARD RESOLUTION'}</div>
              </div>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(Biome).map(b => (
              <button 
                key={b} 
                onClick={() => startExpedition(b)}
                className="group relative h-40 bg-zinc-900/50 border border-emerald-900/50 p-6 rounded-sm text-left hover:border-emerald-400 transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="text-[10px] text-emerald-700 font-bold mb-1">LOCATION_SECTOR</div>
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400">{b}</h3>
                </div>
                <div className="text-[10px] text-zinc-600 group-hover:text-emerald-800 transition-colors">INITIATE EXPEDITION {'>'}</div>
                <div className="absolute inset-0 bg-emerald-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === GameState.LOADING) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="w-64 h-1 bg-zinc-900 overflow-hidden rounded-full">
            <div className={`h-full animate-[loading_2s_ease-in-out_infinite] ${ghilliePassActive ? 'bg-emerald-400' : 'bg-emerald-700'}`}></div>
          </div>
          <p className="text-xs text-emerald-500 tracking-widest animate-pulse">{loadingMsg}</p>
          {ghilliePassActive && (
            <p className="text-[10px] text-emerald-900 font-black animate-pulse">UPGRADING TEXTURE FIDELITY TO 8K...</p>
          )}
        </div>
        <style>{`@keyframes loading { 0% { width: 0%; transform: translateX(-100%); } 100% { width: 100%; transform: translateX(100%); } }`}</style>
      </div>
    );
  }

  if (gameState === GameState.BRIEFING && challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black">
        <div className="max-w-2xl w-full hud-border p-10 bg-zinc-900/20 space-y-6 relative overflow-hidden">
          {challenge.isUltraHD && (
            <div className="absolute top-0 right-0 p-2 bg-emerald-500 text-black text-[8px] font-black uppercase -rotate-45 translate-x-4 -translate-y-1">
              8K-ULTRA
            </div>
          )}
          <div className="flex justify-between items-start border-b border-emerald-900/50 pb-4">
            <div>
              <div className="text-xs text-emerald-700">MISSION_OBJECTIVE</div>
              <h2 className="text-3xl font-bold text-white uppercase">{challenge.animal}</h2>
            </div>
            <div className="text-right">
              <div className="text-xs text-emerald-700">BIOME</div>
              <div className="text-white font-bold">{challenge.biome}</div>
            </div>
          </div>
          <p className="text-emerald-400/80 leading-relaxed font-medium italic">"{challenge.fieldBrief}"</p>
          <button 
            onClick={() => { setGameState(GameState.PLAYING); setStartTime(Date.now()); }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-black py-4 uppercase tracking-[0.2em] transition-all"
          >
            Begin Tracking Sequence
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden select-none">
      {/* HUD HEADER */}
      <div className="h-20 flex items-center justify-between px-8 border-b border-emerald-900/20 bg-black/50 z-50">
        <div className="flex items-center gap-8">
          <div className="space-y-1">
            <div className="text-[10px] text-emerald-700 font-bold">BIO_SIGNAL_INTENSITY</div>
            <div className="w-48 h-2 bg-zinc-900 flex">
              <div 
                className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" 
                style={{ width: `${signalStrength}%` }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-emerald-700 font-bold">CHRONO_LOG</div>
            <div className="text-xl text-white font-mono">{elapsedTime}s</div>
          </div>
          {challenge?.isUltraHD && (
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-400/30 rounded-full flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">8K RECON ACTIVE</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right mr-4">
            <div className="text-[10px] text-emerald-700 font-bold">THERMAL_CHARGE</div>
            <div className="text-sm font-bold text-white">{thermalCharge}%</div>
          </div>
          <button 
            onClick={toggleThermal}
            disabled={thermalCharge <= 0}
            className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${
              thermalActive ? 'bg-orange-500 border-orange-400 text-black animate-pulse' : 'bg-zinc-900 border-emerald-900 text-emerald-500 hover:border-emerald-400'
            }`}
          >
            <i className="fa-solid fa-fire"></i>
          </button>
        </div>
      </div>

      {/* FIELD VIEWPORT */}
      <div 
        ref={imgRef}
        onMouseMove={handleMouseMove}
        onClick={checkDiscovery}
        className="flex-1 relative overflow-hidden bg-zinc-950 flex items-center justify-center"
      >
        {challenge && (
          <img 
            src={challenge.imageUrl} 
            className={`w-full h-full object-cover transition-all duration-700 ${
              thermalActive ? 'brightness-[1.5] sepia hue-rotate-[280deg] saturate-[2]' : 'grayscale-[0.2]'
            }`}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
          />
        )}

        {/* Dynamic HUD Overlays */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-10 left-10 w-40 h-40 border-l border-t border-emerald-500"></div>
            <div className="absolute top-10 right-10 w-40 h-40 border-r border-t border-emerald-500"></div>
            <div className="absolute bottom-10 left-10 w-40 h-40 border-l border-b border-emerald-500"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 border-r border-b border-emerald-500"></div>
        </div>

        {gameState === GameState.FOUND && (
            <div className="absolute inset-0 bg-emerald-500/20 flex flex-col items-center justify-center backdrop-blur-sm z-[100] animate-in fade-in duration-1000">
                <div className="hud-border p-12 bg-black/90 text-center space-y-6 max-w-lg">
                    <h2 className="text-5xl font-black italic tracking-tighter text-emerald-400 underline decoration-emerald-900">LOCK ACQUIRED</h2>
                    <p className="text-zinc-400 font-mono">SPECIMEN DATA EXTRACTED IN {elapsedTime}s</p>
                    <button 
                        onClick={() => setGameState(GameState.FACTS)}
                        className="w-full bg-white text-black font-black py-4 uppercase hover:bg-emerald-400 transition-colors"
                    >
                        Access Field Data
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* HUD FOOTER / CONTROLS */}
      <div className="h-24 bg-black/80 border-t border-emerald-900/20 px-8 flex items-center justify-between z-50">
        <div className="flex gap-4">
            <button 
                onMouseDown={() => setZoom(z => Math.min(z + (ghilliePassActive ? 1 : 0.5), 8))}
                className="w-12 h-12 bg-zinc-900 border border-emerald-900 text-emerald-500 flex items-center justify-center hover:border-emerald-400 active:scale-95"
            >
                <i className="fa-solid fa-magnifying-glass-plus"></i>
            </button>
            <button 
                onMouseDown={() => setZoom(z => Math.max(z - (ghilliePassActive ? 1 : 0.5), 1))}
                className="w-12 h-12 bg-zinc-900 border border-emerald-900 text-emerald-500 flex items-center justify-center hover:border-emerald-400 active:scale-95"
            >
                <i className="fa-solid fa-magnifying-glass-minus"></i>
            </button>
        </div>

        <div className="flex-1 mx-12">
            <div className="flex justify-between text-[10px] font-bold text-emerald-800 mb-1">
                <span>SECTOR_ANALYSIS</span>
                <span>HINT_READY_FOR_UPLINK</span>
            </div>
            <div className="h-1 bg-zinc-900 w-full relative">
                <div className="absolute h-full bg-emerald-900/30 w-full"></div>
            </div>
        </div>

        <button 
            onClick={() => setCurrentHintIdx(i => i + 1)}
            className="px-8 h-12 bg-emerald-950/20 border border-emerald-500 text-emerald-500 font-bold text-xs tracking-widest hover:bg-emerald-500 hover:text-black transition-all"
        >
            REQUEST INTEL
        </button>
      </div>

      {/* HINT OVERLAY */}
      {currentHintIdx >= 0 && challenge && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 pointer-events-none">
              <div className="bg-black/80 border-l-4 border-emerald-500 p-4 backdrop-blur-xl animate-in slide-in-from-left-4 duration-300">
                <div className="text-[10px] text-emerald-500 mb-1 font-bold">SATELLITE_HINT_{currentHintIdx + 1}</div>
                <p className="text-sm text-white">{challenge.hints[currentHintIdx % challenge.hints.length]}</p>
              </div>
          </div>
      )}

      {gameState === GameState.FACTS && challenge && (
        <NatureCard challenge={challenge} onClose={resetGame} />
      )}
    </div>
  );
};

export default GameContainer;
