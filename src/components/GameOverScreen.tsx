import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, Trophy, Target, Flame, Home, Send, Loader2, Globe, Check, X, Sparkles } from 'lucide-react';
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
  playerName: string;
  playerId: string;
  onViewLeaderboard: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ stats, onRestart, bestScore, isNewHighScore, onHome, numOptions, customTime, pools, playerName, playerId, onViewLeaderboard }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [rankAchieved, setRankAchieved] = useState<number | null>(null);

  const submitScoreAutomatically = React.useCallback(async () => {
    if (!playerId || stats.score === 0 || isSubmitting || submitSuccess) return;
    if (!isNewHighScore) return;
    
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          id: playerId,
          name: playerName.trim() || 'Anonymous Player', 
          score: stats.score,
          maxStreak: stats.maxStreak,
          customTime,
          numOptions,
          pools
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setSubmitSuccess(true);
      if (data.rank > 0 && data.rank <= 50) {
        setRankAchieved(data.rank);
      }
    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [playerId, playerName, stats, customTime, numOptions, pools, isSubmitting, submitSuccess, isNewHighScore]);

  React.useEffect(() => {
    submitScoreAutomatically();
  }, [submitScoreAutomatically]);

  const accuracy = stats.totalGuesses > 0 
    ? Math.round((stats.correctGuesses / stats.totalGuesses) * 100) 
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-slate-700/50 max-w-lg mx-auto w-full"
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
        <div className="flex flex-col items-center mb-4">
          <p className="text-slate-400 font-medium">Final performance analysis</p>
          {bestScore && (
            <p className="text-sm text-slate-500 font-bold mt-1">
              Best Score: <span className="text-amber-400">{bestScore.score.toLocaleString()}</span>
            </p>
          )}
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        className="flex flex-wrap justify-center gap-1 sm:gap-3 w-full mb-6"
      >
        <div className="bg-slate-800/40 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-700/50 text-[10px] sm:text-xs">
          <span className="text-slate-500 font-bold mr-1 sm:mr-2">TIMER</span>
          <span className="text-slate-300 font-semibold">{customTime}s</span>
        </div>
        <div className="bg-slate-800/40 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-700/50 text-[10px] sm:text-xs">
          <span className="text-slate-500 font-bold mr-1 sm:mr-2">ANSWERS</span>
          <span className="text-slate-300 font-semibold">{numOptions}</span>
        </div>
        <div className="bg-slate-800/40 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-700/50 text-[10px] sm:text-xs">
          <span className="text-slate-500 font-bold mr-1 sm:mr-2">CARD POOLS</span>
          <span className="text-slate-300 font-semibold truncate max-w-[60px] sm:max-w-none inline-block align-bottom">
            {(pools.character && pools.neutral && pools.monster && pools.other) ? 'ALL' : [pools.character && 'CHAR', pools.neutral && 'NEU', pools.monster && 'MON', pools.other && 'OTH'].filter(Boolean).join(', ') || 'NONE'}
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full mb-6 sm:mb-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/40 p-3 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border border-slate-700/50 hover:bg-slate-800/60 transition-colors"
        >
          <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-2 text-center">Total Score</p>
          <p className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400">{stats.score.toLocaleString()}</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/40 p-3 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border border-slate-700/50 hover:bg-slate-800/60 transition-colors"
        >
          <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-2 text-center">Accuracy</p>
          <div className="flex items-center text-slate-200">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-rose-400" />
            <span className="text-2xl sm:text-3xl font-black">{accuracy}%</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800/40 p-3 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border border-slate-700/50 hover:bg-slate-800/60 transition-colors"
        >
          <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 text-center">Correct</p>
          <div className="flex items-center text-slate-200 mt-1">
            <span className="text-2xl sm:text-3xl font-black">{stats.correctGuesses} <span className="text-slate-500 font-medium text-sm sm:text-xl">/ {stats.totalGuesses}</span></span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-800/40 p-3 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border border-slate-700/50 hover:bg-slate-800/60 transition-colors"
        >
          <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 text-center">Max Streak</p>
          <div className="flex items-center text-slate-200 mt-1">
             <Flame className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-amber-400" />
             <span className="text-2xl sm:text-3xl font-black">{stats.maxStreak}</span>
          </div>
        </motion.div>
      </div>

      {isNewHighScore && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="w-full mb-6 relative group"
        >
          <button
            onClick={onViewLeaderboard}
            className={`w-full relative overflow-hidden bg-slate-800 border ${submitSuccess ? 'border-amber-500/50 hover:bg-slate-700/80 hover:border-amber-500' : submitError ? 'border-rose-500/50 hover:bg-slate-700/80 hover:border-rose-500' : 'border-slate-700 hover:bg-slate-700 hover:border-slate-500'} p-4 rounded-2xl flex items-center justify-between transition-all shadow-md group-hover:shadow-lg`}
          >
             <div className="flex flex-col items-start gap-1">
               <div className="flex items-center text-white font-bold tracking-wide">
                 <Globe className="w-5 h-5 mr-3 text-amber-400" /> Global Ranking
               </div>
               {rankAchieved && (
                 <div className="text-[11px] text-amber-400/90 font-bold ml-8">
                   You placed Rank #{rankAchieved}!
                 </div>
               )}
             </div>
             
             <div className="flex items-center shrink-0">
               {isSubmitting ? (
                 <div className="flex items-center text-indigo-400 text-sm font-bold">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing...
                 </div>
               ) : submitSuccess ? (
                 <div className="flex items-center text-emerald-400 text-sm font-bold">
                    <Check className="w-5 h-5 mr-1" /> Saved
                 </div>
               ) : submitError ? (
                 <div className="flex items-center text-rose-400 text-sm font-bold" title={submitError}>
                    <X className="w-5 h-5 mr-1" /> Failed 
                 </div>
               ) : null}
             </div>
             
             {isSubmitting && (
               <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900 overflow-hidden rounded-b-2xl">
                 <motion.div 
                   className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" 
                   initial={{ x: '-100%' }}
                   animate={{ x: '300%' }}
                   transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                   style={{ width: '30%' }}
                 />
               </div>
             )}
          </button>
        </motion.div>
      )}

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

