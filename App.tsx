
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
    <div className="w-full h-[100dvh] bg-[#050810] flex items-center justify-center overflow-hidden font-sans">
      {gameState === 'menu' && (
        <div className="relative text-center z-10 max-w-xl px-4 fade-in-ready">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
          
          <div className="space-y-4 mb-12">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic text-white leading-none">
              ZUMA<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                ARCHITECT
              </span>
            </h1>
            <p className="text-slate-400 text-xs md:text-lg font-medium tracking-widest uppercase">
              Behavior-Driven Engine v2.0
            </p>
          </div>
          
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl space-y-8">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-emerald-400 font-bold text-[10px] mb-1 uppercase">Chain Logic</p>
                <p className="text-slate-300 text-xs leading-relaxed">Advanced pathing behaviors.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-cyan-400 font-bold text-[10px] mb-1 uppercase">Visuals</p>
                <p className="text-slate-300 text-xs leading-relaxed">Dynamic particles, smooth FX.</p>
              </div>
            </div>

            <button
              onClick={startGame}
              className="group relative w-full overflow-hidden bg-gradient-to-r from-emerald-500 to-cyan-600 p-px rounded-2xl transition-all hover:scale-105 active:scale-95"
            >
              <div className="relative bg-[#050810]/80 group-hover:bg-transparent transition-colors py-4 px-8 rounded-2xl">
                <span className="text-white font-black text-lg md:text-xl tracking-widest uppercase">Initialize</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <ZumaGame onGameOver={handleGameOver} />
      )}

      {gameState === 'gameover' && (
        <div className="text-center space-y-8 md:space-y-12 px-4 fade-in-ready">
          <div className="space-y-2">
            <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter italic">TERMINATED</h2>
            <p className="text-emerald-400 font-bold tracking-[0.5em] uppercase text-xs">Sector Defended</p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl min-w-[280px]">
            <p className="text-slate-400 font-bold text-[10px] md:text-sm uppercase mb-2">Final Data Score</p>
            <p className="text-6xl md:text-8xl font-black text-white tabular-nums tracking-tighter">
              {finalScore.toLocaleString()}
            </p>
          </div>
          
          <button
            onClick={startGame}
            className="px-10 py-4 md:px-12 md:py-5 bg-white text-black font-black text-lg md:text-xl rounded-2xl transition-all hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            REBOOT
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
