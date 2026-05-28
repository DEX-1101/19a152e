import React from 'react';
import { motion } from 'motion/react';
import { RefreshCcw, Trophy, Target, Flame, Sparkles, Home } from 'lucide-react';
import { GameStats, BestScoreData } from '../types';

interface GameOverScreenProps {
  stats: GameStats;
  onRestart: () => void;
  bestScore: BestScoreData | null;
  isNewHighScore: boolean;
  onHome: () => void;
  numOptions: number;
  customTime: number;
  pools: { character?: boolean; neutral?: boolean; monster?: boolean; other?: boolean };
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ stats, onRestart, bestScore, isNewHighScore, onHome, numOptions, customTime, pools }) => {
  const accuracy = stats.totalGuesses > 0 
    ? Math.round((stats.correctGuesses / stats.totalGuesses) * 100) 
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center p-8 bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-slate-700/50 max-w-lg mx-auto w-full"
    >
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
        className="w-24 h-24 bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-500/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
      >
        <Trophy className="w-12 h-12 text-amber-400 drop-shadow-md" />
      </motion.div>
      
      <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 mb-2">Game Over</h2>
      {isNewHighScore ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-amber-500/20 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-full font-bold text-sm mb-4 flex items-center shadow-[0_0_15px_rgba(245,158,11,0.2)]"
        >
          <Sparkles className="w-4 h-4 mr-2" /> NEW BEST SCORE! <Sparkles className="w-4 h-4 ml-2" />
        </motion.div>
      ) : (
        <p className="text-slate-400 mb-4 font-medium">Final performance analysis {bestScore ? `(Best Score: ${bestScore.score.toLocaleString()})` : ''}</p>
      )}

      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        className="flex flex-wrap justify-center gap-3 w-full mb-6"
      >
        <div className="bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs">
          <span className="text-slate-500 font-bold mr-2">TIMER</span>
          <span className="text-slate-300 font-semibold">{customTime}s</span>
        </div>
        <div className="bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs">
          <span className="text-slate-500 font-bold mr-2">OPTIONS</span>
          <span className="text-slate-300 font-semibold">{numOptions}</span>
        </div>
        <div className="bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs">
          <span className="text-slate-500 font-bold mr-2">POOL</span>
          <span className="text-slate-300 font-semibold truncate">
            {[pools.character && 'Char', pools.neutral && 'Neutral', pools.monster && 'Monster', pools.other && 'Other'].filter(Boolean).join('+') || 'None'}
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 w-full mb-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/40 p-5 rounded-2xl flex flex-col items-center justify-center border border-slate-700/50 hover:bg-slate-800/60 transition-colors"
        >
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Total Score</p>
          <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400">{stats.score.toLocaleString()}</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/40 p-5 rounded-2xl flex flex-col items-center justify-center border border-slate-700/50 hover:bg-slate-800/60 transition-colors"
        >
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Accuracy</p>
          <div className="flex items-center text-slate-200">
            <Target className="w-5 h-5 mr-2 text-rose-400" />
            <span className="text-3xl font-black">{accuracy}%</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800/40 p-5 rounded-2xl flex flex-col items-center justify-center border border-slate-700/50 hover:bg-slate-800/60 transition-colors"
        >
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Correct</p>
          <div className="flex items-center text-slate-200 mt-1">
            <span className="text-3xl font-black">{stats.correctGuesses} <span className="text-slate-500 font-medium text-xl">/ {stats.totalGuesses}</span></span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-800/40 p-5 rounded-2xl flex flex-col items-center justify-center border border-slate-700/50 hover:bg-slate-800/60 transition-colors"
        >
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Max Streak</p>
          <div className="flex items-center text-slate-200 mt-1">
             <Flame className="w-5 h-5 mr-2 text-amber-400" />
             <span className="text-3xl font-black">{stats.maxStreak}</span>
          </div>
        </motion.div>
      </div>

      <div className="flex gap-4 w-full">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          onClick={onRestart}
          className="flex-1 flex items-center justify-center px-6 py-4 font-bold text-white transition-all duration-300 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl hover:from-indigo-400 hover:to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCcw className="w-5 h-5 mr-2" />
          Play Again
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          onClick={onHome}
          className="flex items-center justify-center px-6 py-4 font-bold text-slate-300 transition-all duration-300 bg-slate-800 rounded-2xl hover:bg-slate-700 hover:text-white border border-slate-700 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Home className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

