import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Loader2, RefreshCw, Sparkles, CheckSquare, Square, Trophy, Clock, Target, Flame, Trash2 } from 'lucide-react';
import { BestScoreData } from '../types';

interface StartScreenProps {
  onStart: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  totalCards: number;
  pools: { character: boolean; neutral: boolean; monster?: boolean; other?: boolean };
  onTogglePool: (pool: 'character' | 'neutral' | 'monster' | 'other') => void;
  numOptions: number;
  setNumOptions: (v: number) => void;
  customTime: number;
  setCustomTime: (v: number) => void;
  bestScore: BestScoreData | null;
  onDeleteBestScore: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onRefresh, isLoading, totalCards, pools, onTogglePool, numOptions, setNumOptions, customTime, setCustomTime, bestScore, onDeleteBestScore }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto h-full min-h-[80vh] py-12 relative"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 mb-6"
      >
        <motion.div 
          className="w-12 sm:w-16 h-12 sm:h-16 bg-[length:200%_auto] drop-shadow-[0_0_15px_rgba(167,139,250,0.5)] shrink-0 bg-[linear-gradient(90deg,#22d3ee,#818cf8,#c084fc,#22d3ee)]"
          animate={{ backgroundPosition: ['0% center', '200% center'] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          style={{
            maskImage: 'url(https://raw.githubusercontent.com/DEX-1101/19a152e/refs/heads/main/others/btn_card.png)',
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskImage: 'url(https://raw.githubusercontent.com/DEX-1101/19a152e/refs/heads/main/others/btn_card.png)',
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
          }}
        />
        <motion.h1 
          className="text-4xl md:text-5xl font-black text-center sm:text-left text-transparent bg-clip-text bg-[linear-gradient(90deg,#22d3ee,#818cf8,#c084fc,#22d3ee)] bg-[length:200%_auto] tracking-tighter drop-shadow-md"
          animate={{ backgroundPosition: ['0% center', '200% center'] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
        >
          CZN : Card Guesser
        </motion.h1>
      </motion.div>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-slate-400 mb-6 text-sm sm:text-base leading-relaxed max-w-md font-medium"
      >
        A fan-made Chaos Zero Nightmare card guessing game. All asset used are belong to Smilegate and Super Creative.
      </motion.p>

      {bestScore && bestScore.score > 0 && (
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.25, duration: 0.5, type: 'spring' }}
           className="mb-8 flex flex-col items-center justify-center p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl w-full relative group min-h-[220px]"
        >
          <AnimatePresence mode="wait">
            {showConfirmDelete ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center w-full h-full py-2"
              >
                <div className="text-amber-500 font-bold mb-4 text-lg">Delete Best Score?</div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowConfirmDelete(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onDeleteBestScore();
                      setShowConfirmDelete(false);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-rose-500/80 text-white hover:bg-rose-500 transition-colors font-semibold shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center w-full"
              >
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="absolute top-3 right-3 text-amber-500/50 hover:text-rose-400 bg-amber-500/10 hover:bg-rose-500/20 p-2 rounded-xl transition-all border border-transparent hover:border-rose-500/30 focus:opacity-100 outline-none"
                  title="Delete Best Score"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="flex items-center text-amber-500 mb-1">
                   <Trophy className="w-5 h-5 mr-2" />
                   <span className="font-bold uppercase tracking-widest text-sm">Best Score</span>
                </div>
                <span className="text-3xl font-black text-amber-400 drop-shadow-md mb-3">{bestScore.score.toLocaleString()}</span>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-sm text-[10px] sm:text-[13px]">
                   <div className="flex items-center justify-between bg-amber-950/40 px-2 sm:px-3 py-1.5 rounded-lg border border-amber-500/10">
                     <span className="text-amber-500/70">Timer</span>
                     <span className="font-bold text-amber-300">{bestScore.customTime}s</span>
                   </div>
                   <div className="flex items-center justify-between bg-amber-950/40 px-2 sm:px-3 py-1.5 rounded-lg border border-amber-500/10">
                     <span className="text-amber-500/70">Answers</span>
                     <span className="font-bold text-amber-300">{bestScore.numOptions}</span>
                   </div>
                   <div className="flex items-center justify-between bg-amber-950/40 px-2 sm:px-3 py-1.5 rounded-lg border border-amber-500/10">
                     <span className="text-amber-500/70">Accuracy</span>
                     <span className="font-bold text-amber-300">{(bestScore.correctGuesses / Math.max(bestScore.totalGuesses, 1) * 100).toFixed(0)}%</span>
                   </div>
                   <div className="flex items-center justify-between bg-amber-950/40 px-2 sm:px-3 py-1.5 rounded-lg border border-amber-500/10">
                     <span className="text-amber-500/70">Streak</span>
                     <span className="font-bold text-amber-300">{bestScore.maxStreak}</span>
                   </div>
                   <div className="col-span-2 flex items-center justify-between bg-amber-950/40 px-2 sm:px-3 py-1.5 rounded-lg border border-amber-500/10">
                     <span className="text-amber-500/70 text-[9px] sm:text-xs uppercase tracking-wider">Card Pools</span>
                     <span className="font-bold text-amber-300 truncate ml-2 text-[9px] sm:text-xs">
                       {(bestScore.pools.character && bestScore.pools.neutral && bestScore.pools.monster && bestScore.pools.other) ? 'ALL' : [bestScore.pools.character && 'CHAR', bestScore.pools.neutral && 'NEU', bestScore.pools.monster && 'MON', bestScore.pools.other && 'OTH'].filter(Boolean).join(', ')}
                     </span>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex flex-col items-center gap-3 mb-6 w-full justify-center"
      >
        <span className="text-slate-400 font-semibold text-sm">Select Card Pool:</span>
        <div className="flex flex-wrap gap-3 w-full justify-center">
          <button 
            onClick={() => onTogglePool('character')}
            className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border transition-all ${pools.character ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:border-slate-600'}`}
          >
            {pools.character ? <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" /> : <Square className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />}
            <span className="font-semibold text-xs sm:text-sm">Character</span>
          </button>

          <button 
            onClick={() => onTogglePool('neutral')}
            className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border transition-all ${pools.neutral ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:border-slate-600'}`}
          >
            {pools.neutral ? <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" /> : <Square className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />}
            <span className="font-semibold text-xs sm:text-sm">Neutral</span>
          </button>

          <button 
            onClick={() => onTogglePool('monster')}
            className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border transition-all ${pools.monster ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:border-slate-600'}`}
          >
            {pools.monster ? <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" /> : <Square className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />}
            <span className="font-semibold text-xs sm:text-sm">Monster</span>
          </button>

          <button 
            onClick={() => onTogglePool('other')}
            className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border transition-all ${pools.other ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:border-slate-600'}`}
          >
            {pools.other ? <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" /> : <Square className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />}
            <span className="font-semibold text-xs sm:text-sm">Other</span>
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 gap-y-6 mb-8 w-full"
      >
        <div className="flex flex-col items-center gap-3 w-full justify-center">
          <span className="text-slate-400 font-semibold text-sm">Number of answers:</span>
          <div className="flex bg-slate-800/60 p-1.5 rounded-xl border border-slate-700/50 w-full max-w-[200px] justify-center">
            {[4, 6].map((num) => (
              <button
                key={num}
                onClick={() => setNumOptions(num)}
                className={`flex-1 py-1.5 font-bold text-sm rounded-lg transition-all ${numOptions === num ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 w-full justify-center">
          <div className="flex items-center text-slate-400 font-semibold text-sm gap-2">
             <Clock className="w-4 h-4" /> Game Timer:
          </div>
          <div className="flex justify-center bg-slate-800/60 p-1.5 rounded-xl border border-slate-700/50 w-full max-w-[280px]">
            {[ {l: '30s', v: 30}, {l: '1m', v: 60}, {l: '3m', v: 180}, {l: '5m', v: 300} ].map(({l, v}) => (
              <button
                key={v}
                onClick={() => setCustomTime(v)}
                className={`flex-1 py-1.5 font-bold text-xs xsm:text-sm rounded-lg transition-all ${customTime === v ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex flex-col items-center gap-4 w-full"
      >
        <button
          onClick={onStart}
          disabled={isLoading || totalCards < 2}
          className="w-full group relative inline-flex items-center justify-center px-8 py-5 font-bold text-white transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] focus:outline-none hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-500 ease-in-out"></div>
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-200" />
              <span className="relative z-10">Loading Cards...</span>
            </>
          ) : (
            <span className="relative z-10 flex items-center">
              Start Game
              <span className="ml-3 bg-white/20 py-1 px-2.5 text-xs rounded-full font-bold tracking-wider backdrop-blur-sm border border-white/10">
                {totalCards} CARDS
              </span>
            </span>
          )}
        </button>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-3.5 text-sm font-semibold text-slate-300 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl transition-all duration-300 disabled:opacity-50 backdrop-blur-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
          Update Card Pool
        </button>
      </motion.div>

      {!isLoading && totalCards < 2 && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 font-medium text-sm"
        >
          Not enough cards to play. Need at least one card pool.
        </motion.p>
      )}
    </motion.div>
  );
};
