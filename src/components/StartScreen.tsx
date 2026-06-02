import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Loader2, RefreshCw, Sparkles, CheckSquare, Square, Trophy, Clock, Target, Flame, History, Eye, Globe, User, Check, X, Pencil, Crown, Medal, Award, Hexagon } from 'lucide-react';
import { BestScoreData, HistoryEntry, CardData } from '../types';

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  maxStreak?: number;
  customTime?: number;
  numOptions?: number;
  pools?: { character?: boolean; neutral?: boolean; monster?: boolean; other?: boolean };
}

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
  history: HistoryEntry[];
  cards: CardData[];
  playerName: string;
  playerId: string;
  setPlayerName: (name: string) => void;
  onViewLeaderboard: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onRefresh, isLoading, totalCards, pools, onTogglePool, numOptions, setNumOptions, customTime, setCustomTime, bestScore, onDeleteBestScore, history, cards, playerName, playerId, setPlayerName, onViewLeaderboard }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [zoomedCard, setZoomedCard] = useState<CardData | null>(null);

  const [isEditingName, setIsEditingName] = useState(!playerName);
  const [tempName, setTempName] = useState(playerName);
  const [top3, setTop3] = useState<LeaderboardEntry[]>([]);
  const [isLoadingTop3, setIsLoadingTop3] = useState(false);

  const fetchTop3 = React.useCallback(async () => {
    setIsLoadingTop3(true);
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.leaderboard) {
        setTop3(data.leaderboard.slice(0, 3));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingTop3(false);
    }
  }, []);

  useEffect(() => {
    fetchTop3();
  }, [fetchTop3]);

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

      {/* Player Profile Section */}
      <motion.div
         initial={{ opacity: 0, scale: 0.9 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ delay: 0.2 }}
         className="mb-4 flex flex-col items-center justify-center p-4 bg-slate-800/40 border border-indigo-500/20 rounded-2xl w-full relative"
      >
        <div className="flex items-center text-indigo-400 mb-2">
           <User className="w-4 h-4 mr-2" />
           <span className="font-bold uppercase tracking-widest text-xs">Player Profile</span>
        </div>
        {isEditingName ? (
          <div className="flex w-full max-w-xs items-center gap-2">
            <input 
              type="text" 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Enter name for Ranking..."
              maxLength={15}
              className="w-full bg-slate-900 border border-indigo-500/30 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tempName.trim()) {
                  const newName = tempName.trim();
                  setPlayerName(newName);
                  setIsEditingName(false);
                  fetch('/api/leaderboard/name', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: playerId, name: newName })
                  }).then(() => fetchTop3()).catch(console.error);
                }
              }}
              autoFocus
            />
            <button 
              onClick={() => {
                if (tempName.trim()) {
                  const newName = tempName.trim();
                  setPlayerName(newName);
                  setIsEditingName(false);
                  fetch('/api/leaderboard/name', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: playerId, name: newName })
                  }).then(() => fetchTop3()).catch(console.error);
                }
              }}
              className="p-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            {playerName && (
              <button 
                onClick={() => {
                  setTempName(playerName);
                  setIsEditingName(false);
                }}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-slate-900/50 px-5 py-2.5 rounded-full border border-slate-700/50 shadow-sm group">
            <span className="text-base font-bold text-slate-200 tracking-wide">{playerName}</span>
            <button 
              onClick={() => {
                setTempName(playerName);
                setIsEditingName(true);
              }} 
              className="text-indigo-400 hover:text-indigo-300 ml-2 transition-colors opacity-80 hover:opacity-100 p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 rounded-full"
              title="Change Name"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </motion.div>

      {bestScore && bestScore.score > 0 && (
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.25, duration: 0.5, type: 'spring' }}
           className="mb-8 flex flex-col items-center justify-center p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl w-full relative group min-h-[220px]"
        >
          <AnimatePresence mode="wait">
              <motion.div
                key="stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center w-full"
              >
                {history.length > 0 && (
                  <button
                    onClick={() => setShowHistory(true)}
                    className="absolute top-3 left-3 text-indigo-400/70 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 p-2 rounded-xl transition-all border border-transparent hover:border-indigo-500/30 focus:opacity-100 outline-none"
                    title="View History"
                  >
                    <History className="w-4 h-4" />
                  </button>
                )}
                
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
          </AnimatePresence>
        </motion.div>
      )}

      {/* Top 3 Leaderboard Preview */}
      <motion.div
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.3, duration: 0.5 }}
         className="w-full mb-8"
      >
        <div className="bg-slate-800/40 border border-indigo-500/20 rounded-2xl p-4 flex flex-col w-full relative">
          <div className="flex items-center justify-center mb-3 border-b border-white/5 pb-2 relative">
            <div className="flex items-center text-indigo-400 font-bold uppercase tracking-widest text-xs">
              <Globe className="w-4 h-4 mr-2" /> Ranking Leaderboard
            </div>
            <button
               onClick={fetchTop3}
               disabled={isLoadingTop3}
               className="absolute right-0 text-slate-400 hover:text-indigo-400 transition-colors disabled:opacity-50"
               title="Refresh Leaderboard"
            >
               <RefreshCw className={`w-4 h-4 ${isLoadingTop3 ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
          
          <div className="space-y-2 mb-3">
            {isLoadingTop3 ? (
              <div className="flex items-center justify-center py-4 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Loading Ranks...</span>
              </div>
            ) : top3.length > 0 ? (
              top3.map((entry, index) => (
                <div key={index} className="flex items-center justify-between bg-slate-900/40 rounded-xl p-2.5 border border-slate-700/50">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 bg-slate-800 border border-slate-700/80">
                      {index === 0 ? <Crown className="w-4 h-4 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]" /> :
                       index === 1 ? <Medal className="w-4 h-4 text-slate-300 drop-shadow-[0_0_5px_rgba(203,213,225,0.6)]" /> :
                       <Award className="w-4 h-4 text-amber-700 drop-shadow-[0_0_5px_rgba(180,83,9,0.5)]" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold truncate ${index === 0 ? 'text-white' : 'text-slate-300'}`}>{entry.name}</span>
                        {entry.id === playerId && <span className="px-1 py-0.5 rounded text-[8px] bg-indigo-500/20 text-indigo-300 uppercase font-black border border-indigo-500/30 shrink-0">You</span>}
                      </div>
                      <div className="flex bg-slate-900/50 p-1.5 rounded w-max mt-1 gap-2 items-center flex-wrap text-[9px] text-slate-500 font-medium">
                        {entry.customTime !== undefined && <span className="flex items-center"><Clock className="w-2.5 h-2.5 mr-0.5" />{entry.customTime}s</span>}
                        {entry.numOptions !== undefined && <span className="flex items-center"><CheckSquare className="w-2.5 h-2.5 mr-0.5" />{entry.numOptions}opt</span>}
                        {entry.maxStreak !== undefined && <span className="flex items-center"><Flame className="w-2.5 h-2.5 mr-0.5 text-rose-500/70" />{entry.maxStreak}</span>}
                        {entry.pools !== undefined && (
                           <span className="flex items-center">
                             <Hexagon className="w-2.5 h-2.5 mr-0.5 text-indigo-400" /> 
                             {(entry.pools.character && entry.pools.neutral && entry.pools.monster && entry.pools.other) ? 'ALL' : [entry.pools.character && 'CH', entry.pools.neutral && 'NE', entry.pools.monster && 'MO', entry.pools.other && 'OT'].filter(Boolean).join(',')}
                           </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`font-black tracking-tight shrink-0 pl-2 ${index === 0 ? 'text-amber-400 text-lg' : 'text-white text-base'}`}>
                    {entry.score.toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-sm text-slate-500">
                No scores yet. Play to rank!
              </div>
            )}
          </div>
          
          <button
            onClick={onViewLeaderboard}
            className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400 font-bold text-xs flex items-center justify-center transition-colors"
          >
            Expand Ranking
          </button>
        </div>
      </motion.div>

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
          onClick={() => {
            if (!playerName.trim()) {
              setIsEditingName(true);
              return;
            }
            onStart();
          }}
          disabled={isLoading || totalCards < 2}
          className={`w-full group relative inline-flex items-center justify-center px-8 py-5 font-bold text-white transition-all duration-300 ${!playerName.trim() ? 'bg-gradient-to-r from-rose-500 to-pink-600 shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.5)]' : 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]'} rounded-2xl focus:outline-none hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden`}
        >
          <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-500 ease-in-out"></div>
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-200" />
              <span className="relative z-10">Loading Cards...</span>
            </>
          ) : !playerName.trim() ? (
            <span className="relative z-10 flex items-center">
              <User className="w-5 h-5 mr-3" />
              Set Player Name to Play
            </span>
          ) : (
            <span className="relative z-10 flex items-center">
              Start Game
              <span className="ml-3 bg-white/20 py-1 px-2.5 text-xs rounded-full font-bold tracking-wider backdrop-blur-sm border border-white/10">
                {totalCards} CARDS
              </span>
            </span>
          )}
        </button>

        <div className="w-full flex gap-3 flex-wrap">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center px-4 py-3.5 text-sm font-semibold text-slate-300 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl transition-all duration-300 disabled:opacity-50 backdrop-blur-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            Update Card Pool
          </button>
          
          <button
            onClick={() => setShowGallery(true)}
            disabled={isLoading || totalCards === 0}
            className="flex-1 flex items-center justify-center px-4 py-3.5 text-sm font-semibold text-slate-300 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl transition-all duration-300 disabled:opacity-50 backdrop-blur-sm"
          >
            <Eye className="w-4 h-4 mr-2 text-indigo-400" />
            View Cards
          </button>
        </div>
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

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 w-full max-w-sm sm:max-w-md shadow-[0_0_40px_rgba(99,102,241,0.2)] flex flex-col max-h-[85vh] overflow-hidden relative"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center text-indigo-400 text-xl font-bold">
                  <History className="w-6 h-6 mr-2" /> Recent History
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="text-slate-400 hover:text-white transition-colors p-2"
                >
                  Close
                </button>
              </div>
              
              <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {history.map((entry, index) => (
                  <div key={index} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-xl border border-slate-700/50 relative z-10">
                      <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">{new Date(entry.timestamp).toLocaleString()}</span>
                      <span className="text-amber-400 text-lg font-black drop-shadow-sm">{entry.score.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] relative z-10 w-full">
                      <div className="text-slate-400 flex justify-between bg-slate-950/40 p-1.5 rounded-lg border border-white/5"><span>Timer:</span> <span className="text-slate-200 font-bold">{entry.customTime}s</span></div>
                      <div className="text-slate-400 flex justify-between bg-slate-950/40 p-1.5 rounded-lg border border-white/5"><span>Streak:</span> <span className="text-slate-200 font-bold">{entry.maxStreak}</span></div>
                      <div className="text-slate-400 flex justify-between bg-slate-950/40 p-1.5 rounded-lg border border-white/5"><span>Options:</span> <span className="text-slate-200 font-bold">{entry.numOptions}</span></div>
                      <div className="text-slate-400 flex justify-between bg-slate-950/40 p-1.5 rounded-lg border border-white/5"><span>Acc:</span> <span className="text-slate-200 font-bold">{(entry.correctGuesses / Math.max(entry.totalGuesses, 1) * 100).toFixed(0)}%</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Gallery Modal */}
      <AnimatePresence>
        {showGallery && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 w-full max-w-4xl shadow-[0_0_40px_rgba(99,102,241,0.2)] flex flex-col max-h-[85vh] overflow-hidden relative"
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center text-indigo-400 text-lg sm:text-xl font-bold">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6 mr-2" /> Selected Card Pool <span className="opacity-70 ml-2 text-sm sm:text-base">({cards.length} Cards)</span>
                </div>
                <button 
                  onClick={() => setShowGallery(false)}
                  className="text-slate-400 hover:text-white transition-colors p-2"
                >
                  Close
                </button>
              </div>
              
              <div className="overflow-y-auto custom-scrollbar flex-grow pr-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {cards.map((c, i) => (
                    <div key={`${c.name}-${i}`} className="flex justify-center">
                      <div 
                        onClick={() => setZoomedCard(c)}
                        className="relative w-full max-w-[200px] aspect-[353/523] bg-slate-900 rounded-[1.5rem] sm:rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden border-2 border-white/10 shrink-0 group cursor-pointer"
                      >
                        <img 
                          src={c.imageUrl} 
                          alt={c.name} 
                          className="w-full h-full object-fill select-none pointer-events-none transition-transform duration-700 ease-out group-hover:scale-110 scale-[1.05]"
                          loading="lazy"
                          crossOrigin="anonymous"
                        />
                        <img
                          src="https://raw.githubusercontent.com/DEX-1101/19a152e/refs/heads/main/others/card_ego_all.png"
                          alt=""
                          className="absolute left-[-1px] top-[-2%] h-[104%] w-auto pointer-events-none z-10 drop-shadow-[2px_0_3px_rgba(0,0,0,0.5)]"
                          crossOrigin="anonymous"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-end justify-center pb-4">
                          <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-2 group-hover:translate-y-0 w-6 h-6 drop-shadow-md" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomedCard && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
             onClick={() => setZoomedCard(null)}
           >
             <motion.div
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative h-[80vh] sm:h-[85vh] aspect-[353/523] rounded-[2rem] sm:rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden border-2 border-white/10 shrink-0"
               onClick={(e) => e.stopPropagation()}
             >
               <img 
                 src={zoomedCard.imageUrl} 
                 alt={zoomedCard.name} 
                 className="w-full h-full object-fill select-none pointer-events-none scale-[1.05]"
                 crossOrigin="anonymous"
               />
               <img
                 src="https://raw.githubusercontent.com/DEX-1101/19a152e/refs/heads/main/others/card_ego_all.png"
                 alt=""
                 className="absolute left-[-1px] top-[-2%] h-[104%] w-auto pointer-events-none z-10 drop-shadow-[2px_0_3px_rgba(0,0,0,0.5)]"
                 crossOrigin="anonymous"
               />
               <div className="absolute top-4 right-4 z-20">
                 <button onClick={() => setZoomedCard(null)} className="p-2 bg-black/50 hover:bg-black/80 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-md">
                   <Eye className="w-5 h-5 hidden" /> {/* Hidden icon just for alignment if needed, or close button */}
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                 </button>
               </div>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
