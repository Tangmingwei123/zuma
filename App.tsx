
import React, { useState } from 'react';
import ZumaGame from './components/ZumaGame';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [finalScore, setFinalScore] = useState(0);

  const startGame = () => setGameState('playing');
  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setGameState('gameover');
  };

  return (
    <div className="w-full h-screen bg-[#050810] flex items-center justify-center overflow-hidden font-['Inter']">
      {gameState === 'menu' && (
        <div className="relative text-center z-10 max-w-xl px-4 animate-in fade-in zoom-in duration-1000">
          {/* Background decoration */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
          
          <div className="space-y-4 mb-12">
            <h1 className="text-8xl font-black tracking-tighter italic text-white leading-none">
              ZUMA<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                ARCHITECT
              </span>
            </h1>
            <p className="text-slate-400 text-lg font-medium tracking-widest uppercase">
              Behavior-Driven Engine v2.0
            </p>
          </div>
          
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl space-y-8">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-emerald-400 font-bold text-xs mb-1 uppercase">Chain Logic</p>
                <p className="text-slate-300 text-sm leading-relaxed">Advanced pathing and physical collision behaviors.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-cyan-400 font-bold text-xs mb-1 uppercase">Visuals</p>
                <p className="text-slate-300 text-sm leading-relaxed">Dynamic particles, 3D spheres, and smooth animations.</p>
              </div>
            </div>

            <button
              onClick={startGame}
              className="group relative w-full overflow-hidden bg-gradient-to-r from-emerald-500 to-cyan-600 p-px rounded-2xl transition-all hover:scale-105 active:scale-95"
            >
              <div className="relative bg-[#050810]/80 group-hover:bg-transparent transition-colors py-4 px-8 rounded-2xl">
                <span className="text-white font-black text-xl tracking-widest">INITIALIZE ENGINE</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <ZumaGame onGameOver={handleGameOver} />
      )}

      {gameState === 'gameover' && (
        <div className="text-center space-y-12 animate-in slide-in-from-bottom-20 duration-700">
          <div className="space-y-2">
            <h2 className="text-8xl font-black text-white tracking-tighter italic">TERMINATED</h2>
            <p className="text-emerald-400 font-bold tracking-[0.5em] uppercase">Sector Defended</p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-12 rounded-[3rem] shadow-2xl min-w-[320px]">
            <p className="text-slate-400 font-bold text-sm uppercase mb-2">Final Data Score</p>
            <p className="text-8xl font-black text-white tabular-nums tracking-tighter">
              {finalScore.toLocaleString()}
            </p>
          </div>
          
          <button
            onClick={startGame}
            className="px-12 py-5 bg-white text-black font-black text-xl rounded-2xl transition-all hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            REBOOT SYSTEM
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
