import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Analytics } from '@vercel/analytics/react';
import { CardData, GameStats, BestScoreData, HistoryEntry } from './types';
import { fetchCards, checkGameVersion } from './lib/api';
import { initAudio, playCorrectSound, playIncorrectSound, playSwapSound } from './lib/audio';
import { shuffleArray } from './lib/utils';
import { StartScreen } from './components/StartScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { LeaderboardModal } from './components/LeaderboardModal';
import { Clock, Star, Image as ImageIcon, Flame, Pause, Play, Home, Lightbulb, Eye, Gamepad2 } from 'lucide-react';

type GameStatus = 'start' | 'playing' | 'paused' | 'end';

const GAME_TIME_SEC = 180;

export default function App() {
  const [pools, setPools] = useState({ character: true, neutral: true, monster: true, other: true });
  const [numOptions, setNumOptions] = useState<number>(4);
  const [customTime, setCustomTime] = useState<number>(180);
  const [bestScore, setBestScore] = useState<BestScoreData | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const [pauseHistory, setPauseHistory] = useState<number[]>([]);
  const [showEasterEgg, setShowEasterEgg] = useState<boolean>(false);
  const [easterEggCountdown, setEasterEggCountdown] = useState<number>(0);
  const [revealEasterEgg, setRevealEasterEgg] = useState<boolean>(false);
  const [allCards, setAllCards] = useState<{ character: CardData[], neutral: CardData[], monster: CardData[], other: CardData[] }>({ character: [], neutral: [], monster: [], other: [] });
  // Dynamic cards array based on selected pools
  const cards = React.useMemo(() => {
    let result: CardData[] = [];
    if (pools.character) result = [...result, ...allCards.character];
    if (pools.neutral) result = [...result, ...allCards.neutral];
    if (pools.monster) result = [...result, ...allCards.monster];
    if (pools.other) result = [...result, ...allCards.other];
    return result;
  }, [pools, allCards]);

  const [isLoading, setIsLoading] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [status, setStatus] = useState<GameStatus>('start');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('czn_player_name') || '');
  const [playerId] = useState(() => {
    let id = localStorage.getItem('czn_player_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('czn_player_id', id);
    }
    return id;
  });
  const [isPreloadingImages, setIsPreloadingImages] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const preloadedUrls = React.useRef<Set<string>>(new Set());
  
  // Game State
  const [stats, setStats] = useState<GameStats>({ score: 0, correctGuesses: 0, totalGuesses: 0, timeTaken: 0, currentStreak: 0, maxStreak: 0 });
  const [gameTimeLeft, setGameTimeLeft] = useState(GAME_TIME_SEC);
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [cardStartTime, setCardStartTime] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Hint State
  const [hintUsed, setHintUsed] = useState<boolean>(false);
  const [totalHintsUsed, setTotalHintsUsed] = useState<number>(0);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  
  const deleteBestScore = useCallback(() => {
    localStorage.removeItem('czn_best_score');
    localStorage.removeItem('czn_history');
    setBestScore(null);
    setHistory([]);
  }, []);

  // Non-repeating deck state
  const [remainingDeck, setRemainingDeck] = useState<CardData[]>([]);
  const [upcomingDeck, setUpcomingDeck] = useState<CardData[]>([]);

  // Pre-shuffle and preload when cards are ready on the start screen
  useEffect(() => {
    if (status === 'start' && cards.length >= 2) {
      const shuf = shuffleArray(cards);
      setUpcomingDeck(shuf);
      
      const alreadyPreloaded = localStorage.getItem('czn_images_cached') === 'true';
      
      if (alreadyPreloaded) {
        setIsPreloadingImages(false);
        return;
      }

      const urlsToLoad = cards.map(c => c.imageUrl).filter(url => !preloadedUrls.current.has(url));
      
      if (urlsToLoad.length === 0) {
        setIsPreloadingImages(false);
        return;
      }
      
      setIsPreloadingImages(true);
      setPreloadProgress(0);
      
      let loaded = 0;
      const totalToLoad = urlsToLoad.length;
      
      const updateProgress = () => {
        loaded++;
        setPreloadProgress(Math.floor((loaded / totalToLoad) * 100));
        if (loaded >= totalToLoad) {
           localStorage.setItem('czn_images_cached', 'true');
           setIsPreloadingImages(false);
        }
      };

      urlsToLoad.forEach(url => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          preloadedUrls.current.add(url);
          updateProgress();
        };
        img.onerror = () => {
          preloadedUrls.current.add(url);
          updateProgress();
        };
        img.src = url;
      });
    } else {
      setIsPreloadingImages(false);
    }
  }, [cards, status]);

  // Feedback state
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [timeAddedAnim, setTimeAddedAnim] = useState<number>(0);

  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const loadCards = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const [charData, neutralData, monsterData, otherData] = await Promise.all([
        fetchCards('cards', forceRefresh),
        fetchCards('CommonCards', forceRefresh),
        fetchCards('MonsterCard', forceRefresh),
        fetchCards('OtherCard', forceRefresh)
      ]);
      setAllCards({ character: charData, neutral: neutralData, monster: monsterData || [], other: otherData || [] });
    } catch (error) {
      console.warn("Card load error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize
  useEffect(() => {
    loadCards();
    checkGameVersion().then(version => {
      if (version) {
        const storedVersion = localStorage.getItem('czn_game_version');
        if (!storedVersion) {
          // First time visitor, already fetching latest cards
          localStorage.setItem('czn_game_version', version);
        } else if (storedVersion !== version) {
          setUpdateAvailable(true);
          setShowUpdatePopup(true);
        }
      }
    });

    const savedScore = localStorage.getItem('czn_best_score');
    if (savedScore) {
      try {
        setBestScore(JSON.parse(savedScore));
      } catch (e) {}
    } else {
      const oldScore = localStorage.getItem('czn_highscore');
      if (oldScore) {
        setBestScore({
          score: parseInt(oldScore, 10),
          numOptions: 4,
          customTime: 180,
          pools: { character: true, neutral: true },
          maxStreak: 0,
          correctGuesses: 0,
          totalGuesses: 0,
          timeTaken: 0
        });
      }
    }
    const savedHistory = localStorage.getItem('czn_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {}
    }
  }, [loadCards]);

  const togglePool = (pool: 'character' | 'neutral' | 'monster' | 'other') => {
    setPools(prev => ({ ...prev, [pool]: !prev[pool] }));
  };



  const hintCost = totalHintsUsed === 0 ? 50 : totalHintsUsed * 100;

  const useHint = () => {
    if (hintUsed || stats.score < hintCost || status === 'paused' || selectedOption !== null || !currentCard) return;

    setStats(prev => ({
      ...prev,
      score: Math.max(0, prev.score - hintCost)
    }));
    setHintUsed(true);
    setTotalHintsUsed(prev => prev + 1);

    const wrongOptions = options.filter(opt => opt !== currentCard.name);
    const numToRemove = Math.ceil(wrongOptions.length / 2);
    const shuffledWrong = shuffleArray([...wrongOptions]);
    const toEliminate = shuffledWrong.slice(0, numToRemove);

    setEliminatedOptions(toEliminate);
  };

  const endGame = useCallback(() => {
    setStatus(prevStatus => {
      if (prevStatus === 'end') return prevStatus;
      
      setStats(currentStats => {
        const currentHighest = bestScore?.score || 0;
        
        const newHistoryEntry: HistoryEntry = {
          score: currentStats.score,
          numOptions,
          customTime,
          pools,
          maxStreak: currentStats.maxStreak,
          correctGuesses: currentStats.correctGuesses,
          totalGuesses: currentStats.totalGuesses,
          timeTaken: currentStats.timeTaken,
          timestamp: Date.now()
        };
        
        setHistory(prevHistory => {
          const newHistory = [newHistoryEntry, ...prevHistory].slice(0, 5);
          localStorage.setItem('czn_history', JSON.stringify(newHistory));
          return newHistory;
        });

        if (currentStats.score > currentHighest) {
          const newBest: BestScoreData = {
            score: currentStats.score,
            numOptions,
            customTime,
            pools,
            maxStreak: currentStats.maxStreak,
            correctGuesses: currentStats.correctGuesses,
            totalGuesses: currentStats.totalGuesses,
            timeTaken: currentStats.timeTaken
          };
          setBestScore(newBest);
          setIsNewHighScore(true);
          localStorage.setItem('czn_best_score', JSON.stringify(newBest));
        } else {
          setIsNewHighScore(false);
        }
        return currentStats;
      });
      return 'end';
    });
  }, [bestScore, numOptions, customTime, pools]);

  const togglePause = () => {
    if (selectedOption !== null || !currentCard) return;

    const now = Date.now();
    const lastToggle = pauseHistory.length > 0 ? pauseHistory[pauseHistory.length - 1] : 0;
    
    if (now - lastToggle < 5000) {
      const newHistory = [...pauseHistory, now];
      if (newHistory.length > 10) {
        setShowEasterEgg(true);
        setEasterEggCountdown(10);
        setPauseHistory([]);
        endGame();
        return;
      } else {
        setPauseHistory(newHistory);
      }
    } else {
      setPauseHistory([now]);
    }

    setStatus(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  const generateRound = useCallback((pool: CardData[], fullList: CardData[]) => {
    if (pool.length === 0) {
      endGame();
      return;
    }
    
    playSwapSound();
    
    // Pick the first card from the shuffled pool
    const correct = pool[0];
    const newPool = pool.slice(1);
    setRemainingDeck(newPool); // update remaining cards
    
    // Preload next few images for speed optimization
    requestAnimationFrame(() => {
      newPool.slice(0, 5).forEach(c => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = c.imageUrl;
      });
    });
    
    // Pick incorrect options from fullList
    const otherCards = fullList.filter(c => c.name !== correct.name);
    const shuffledOthers = shuffleArray(otherCards);
    const optionsCount = Math.min(numOptions - 1, shuffledOthers.length);
    const selectedOthers = shuffledOthers.slice(0, optionsCount).map(c => c.name);
    
    const finalOptions = shuffleArray([correct.name, ...selectedOthers]);
    
    setCurrentCard(correct);
    setOptions(finalOptions);
    setCardStartTime(Date.now());
    setSelectedOption(null);
    setFeedback(null);
    setHintUsed(false);
    setEliminatedOptions([]);
  }, [numOptions, endGame]);

  const refreshCards = useCallback(async () => {
    await loadCards(true);
    setUpdateAvailable(false);
    checkGameVersion().then(version => {
      if (version) localStorage.setItem('czn_game_version', version);
    });
  }, [loadCards]);

  const startGame = () => {
    initAudio();
    if (cards.length < 2) return;
    if (localStorage.getItem('czn_hide_tutorial') !== 'true') {
      setShowTutorial(true);
      return;
    }
    startNewGameInternal();
  };

  const startNewGameInternal = () => {
    if (showTutorial && dontShowAgain) {
      localStorage.setItem('czn_hide_tutorial', 'true');
    }
    setShowTutorial(false);
    setStats({ score: 0, correctGuesses: 0, totalGuesses: 0, timeTaken: 0, currentStreak: 0, maxStreak: 0 });
    setGameTimeLeft(customTime);
    setIsNewHighScore(false);
    setTotalHintsUsed(0);
    setStatus('playing');
    const deckToUse = upcomingDeck.length > 0 ? upcomingDeck : shuffleArray([...cards]);
    setUpcomingDeck([]);
    generateRound(deckToUse, cards);
  };

  // Main game timer
  useEffect(() => {
    if (status !== 'playing') return;
    
    const interval = setInterval(() => {
      setGameTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [status, endGame]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showEasterEgg && easterEggCountdown > 0) {
      interval = setInterval(() => {
        setEasterEggCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    }
  }, [showEasterEgg, easterEggCountdown]);

  const handleGuess = (optionName: string) => {
    if (selectedOption || !currentCard) return; // Prevent multiple guesses
    
    setSelectedOption(optionName);
    const isCorrect = optionName === currentCard.name;
    const timeTakenMs = Date.now() - cardStartTime;
    
    if (isCorrect) playCorrectSound();
    else playIncorrectSound();
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    setStats(prev => {
      let scoreAdd = 0;
      let newStreak = prev.currentStreak;
      let newMaxStreak = prev.maxStreak;

      if (isCorrect) {
        newStreak += 1;
        newMaxStreak = Math.max(newMaxStreak, newStreak);
        
        if (newStreak > 0 && newStreak % 10 === 0) {
          setGameTimeLeft(time => time + 10);
          setTimeAddedAnim(Date.now());
        }
        
        // Base 100 points, drops linearly over 5 seconds down to min 50 points
        const maxScore = 100;
        const minScore = 50;
        const timeToMinScoreMs = 5000; // 5 seconds to decay to minimum
        const speedBonus = Math.max(minScore, Math.floor(maxScore - ((maxScore - minScore) * (timeTakenMs / timeToMinScoreMs))));
        
        const streakMultiplier = 1 + ((newStreak - 1) * 0.15); // +15% score for each consecutive guess
        scoreAdd = Math.floor(speedBonus * streakMultiplier);
      } else {
        newStreak = 0;
      }
      
      return {
        ...prev,
        score: prev.score + scoreAdd,
        correctGuesses: prev.correctGuesses + (isCorrect ? 1 : 0),
        totalGuesses: prev.totalGuesses + 1,
        timeTaken: prev.timeTaken + timeTakenMs / 1000,
        currentStreak: newStreak,
        maxStreak: newMaxStreak
      };
    });

    // Proceed to next round after short delay
    setTimeout(() => {
      setStatus(currentStatus => {
        if (currentStatus === 'playing') {
          // generateRound will use remainingDeck via closure, but to avoid stale state:
          // we use a functional update and call another useEffect or we just rely on latest state in render.
          // Because handleGuess is recreated on each render, `remainingDeck` is up to date here.
          generateRound(remainingDeck, cards);
        }
        return currentStatus;
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen relative bg-slate-950 font-sans text-slate-100 flex flex-col selection:bg-indigo-900/50 selection:text-indigo-200 overflow-x-hidden">
      
      {/* Background decoration for Dark Mode */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-900/20 blur-[100px] mix-blend-screen"></div>
        <div className="absolute top-[40%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-rose-900/10 blur-[80px] mix-blend-screen"></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 w-full flex-grow flex flex-col items-center justify-center p-2 sm:p-4 min-h-0">
        <AnimatePresence mode="wait">
          {isPreloadingImages && (
            <motion.div
              key="preload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto h-full min-h-[60vh] py-12"
            >
              <div className="relative mb-12 w-32 h-32 flex flex-col items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-slate-800/80 animate-pulse"></div>
                <svg className="w-full h-full text-indigo-500 absolute inset-0 animate-spin" style={{ animationDuration: '2s' }} viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="80 200" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div 
                    className="w-16 h-16 bg-[length:200%_auto] drop-shadow-[0_0_15px_rgba(167,139,250,0.6)] bg-[linear-gradient(90deg,#22d3ee,#818cf8,#c084fc,#22d3ee)]"
                    animate={{ backgroundPosition: ['0% center', '200% center'] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    style={{
                      maskImage: 'url(https://dex-1101.github.io/19a152e/others/btn_card.png)',
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskImage: 'url(https://dex-1101.github.io/19a152e/others/btn_card.png)',
                      WebkitMaskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center'
                    }}
                  />
                </div>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-200 mb-4 tracking-wide font-sans">Loading card image. Please wait...</h2>
              <div className="w-full max-w-xs bg-slate-800/50 p-1 rounded-full border border-slate-700/50 mb-3 shadow-inner">
                <div className="h-1.5 rounded-full overflow-hidden w-full bg-slate-800">
                   <div className="h-full bg-[linear-gradient(90deg,#22d3ee,#818cf8)] transition-all duration-300 ease-out" style={{ width: `${preloadProgress}%` }}></div>
                </div>
              </div>
              <span className="text-indigo-400 font-bold text-sm tracking-widest">{preloadProgress}%</span>
            </motion.div>
          )}

          {status === 'start' && !isPreloadingImages && (
            <StartScreen 
              key="start" 
              updateAvailable={updateAvailable}
              onStart={startGame} 
              onRefresh={refreshCards}
              isLoading={isLoading} 
              totalCards={cards.length}
              pools={pools}
              onTogglePool={togglePool}
              numOptions={numOptions}
              setNumOptions={setNumOptions}
              customTime={customTime}
              setCustomTime={setCustomTime}
              bestScore={bestScore}
              onDeleteBestScore={deleteBestScore}
              history={history}
              cards={cards}
              playerName={playerName}
              playerId={playerId}
              setPlayerName={(name: string) => {
                setPlayerName(name);
                localStorage.setItem('czn_player_name', name);
              }}
              onViewLeaderboard={() => setShowLeaderboard(true)}
            />
          )}

          {(status === 'playing' || status === 'paused') && currentCard && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-2xl h-[calc(100dvh-3rem)] sm:h-[calc(100dvh-5rem)] flex flex-col items-center justify-between"
            >
              {/* HUD */}
              <div className="w-full shrink-0 relative bg-slate-900/60 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] shadow-2xl border border-white/5 max-w-xl">
                <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-[2rem]">
                  <div 
                    className="absolute left-0 top-0 bottom-0 z-0 transition-all duration-1000 ease-linear opacity-20"
                    style={{ 
                      width: `${Math.max(0, (gameTimeLeft / customTime) * 100)}%`,
                      backgroundColor: gameTimeLeft <= customTime * 0.2 ? '#ef4444' : '#6366f1'
                    }}
                  />
                </div>
                <div className="relative z-10 flex justify-between items-center w-full p-2 sm:p-5 gap-2 sm:gap-4">
                  <div className="flex shrink-0">
                  <div className={`relative flex items-center justify-center font-bold px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border min-w-[70px] sm:min-w-[90px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-colors ${gameTimeLeft <= customTime * 0.2 ? 'text-rose-400 bg-rose-500/20 border-rose-500/40 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20'}`}>
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <motion.span 
                      key={gameTimeLeft <= customTime * 0.2 ? gameTimeLeft : 'timer'}
                      initial={{ scale: gameTimeLeft <= customTime * 0.2 ? 1.25 : 1 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                      className="text-xl sm:text-2xl min-w-[1.5rem] sm:min-w-[2rem] text-right leading-none inline-block origin-right"
                    >
                      {gameTimeLeft}
                    </motion.span>
                    <span className={`text-xs ml-0.5 ${gameTimeLeft <= customTime * 0.2 ? 'text-rose-500' : 'text-indigo-400'}`}>s</span>
                    <AnimatePresence>
                      {timeAddedAnim > 0 && (
                        <motion.div
                          key={timeAddedAnim}
                          initial={{ opacity: 0, y: 10, scale: 0.5 }}
                          animate={{ opacity: 1, y: -35, scale: 1.2 }}
                          exit={{ opacity: 0, y: -45, scale: 1 }}
                          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                          onAnimationComplete={() => setTimeAddedAnim(0)}
                          className="absolute -top-4 left-1/2 -translate-x-1/2 text-emerald-400 font-black text-lg sm:text-xl whitespace-nowrap drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] z-50 pointer-events-none"
                        >
                          +10s!
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex flex-col items-center flex-1 min-w-0 mx-1">
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-1 flex items-center">
                    Score
                  </span>
                  <div className="flex flex-col items-center justify-center min-h-[36px] sm:min-h-[44px]">
                    <motion.div
                      key={stats.score}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <span className="font-black text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500 leading-none drop-shadow-sm inline-block">
                        {stats.score.toLocaleString()}
                      </span>
                    </motion.div>
                    <AnimatePresence mode="popLayout">
                      {stats.currentStreak > 1 && (
                        <span 
                          className="inline-flex text-[10px] sm:text-xs font-bold text-amber-400 mt-1 items-center tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 whitespace-nowrap overflow-hidden"
                        >
                          <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 animate-pulse" />
                          <div className="relative inline-flex items-center justify-center">
                            <AnimatePresence mode="popLayout" initial={false}>
                              <motion.span
                                key={stats.currentStreak}
                                initial={{ y: 15, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -15, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="inline-block"
                              >
                                {stats.currentStreak}
                              </motion.span>
                            </AnimatePresence>
                          </div>
                          x <span className="hidden sm:inline ml-1">STREAK</span>
                        </span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex items-center justify-center shrink-0 text-emerald-400 font-bold bg-emerald-500/10 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-emerald-500/20 min-w-[70px] sm:min-w-[90px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="text-xl sm:text-2xl leading-none inline-block">
                    {stats.correctGuesses}
                  </span>
                </div>
                </div>
              </div>

              {/* Card Display Area */}
              <div className="relative w-full flex-grow flex items-center justify-center my-2 sm:my-4 min-h-[150px] overflow-hidden">
                <motion.div 
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  key={currentCard.name}
                  className={`relative max-w-full max-h-full aspect-[353/523] bg-slate-900 rounded-[1.5rem] sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group border-2 border-white/10 shrink-0 ${status === 'paused' ? 'blur-md grayscale' : ''}`}
                >
                  <img 
                    src={currentCard.imageUrl} 
                    alt="Guess this card" 
                    className="w-full h-full object-fill select-none pointer-events-none scale-[1.05]"
                    crossOrigin="anonymous"
                    fetchPriority="high"
                  />
                  <img
                    src="https://dex-1101.github.io/19a152e/others/card_ego_all.png"
                    alt=""
                    className="absolute left-[-1px] top-[-2%] h-[104%] w-auto pointer-events-none z-10 drop-shadow-[2px_0_3px_rgba(0,0,0,0.5)]"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                  
                  {/* Feedback Overlay */}
                  <AnimatePresence>
                    {feedback && (
                      <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        className={`absolute inset-0 flex items-center justify-center bg-slate-950/60 transition-colors duration-300 ${feedback === 'correct' ? 'bg-emerald-950/40' : 'bg-rose-950/40'}`}
                      >
                        <motion.div 
                          initial={{ scale: 0.5, opacity: 0, y: 20 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className={`px-4 sm:px-8 py-2 sm:py-4 rounded-xl sm:rounded-2xl text-lg sm:text-2xl font-black shadow-[0_0_40px_rgba(0,0,0,0.3)] flex items-center border ${
                            feedback === 'correct' ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-rose-500/90 text-white border-rose-400'
                          }`}
                        >
                          {feedback === 'correct' ? 'CORRECT!' : 'INCORRECT'}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Options Grid */}
              <div className={`grid shrink-0 w-full ${options.length === 6 ? 'grid-cols-2 sm:grid-cols-3 max-w-2xl gap-1.5 sm:gap-4' : 'grid-cols-2 max-w-xl gap-2 sm:gap-4'}`}>
                {options.map((opt, i) => {
                  const isSelected = selectedOption === opt;
                  const isCorrectAnswer = opt === currentCard.name;
                  const isEliminated = eliminatedOptions.includes(opt);
                  
                  let btnClass = "bg-slate-800/60 text-slate-300 border-white/10 hover:border-indigo-400/50 hover:bg-slate-700/80 hover:text-white shadow-lg hover:shadow-indigo-500/20";
                  
                  if (selectedOption) {
                    if (isCorrectAnswer) {
                      btnClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.2)] z-10 relative scale-[1.02] bg-emerald-900/40";
                    } else if (isSelected) {
                      btnClass = "bg-rose-500/10 border-rose-500/30 text-rose-300 opacity-90 bg-rose-900/30";
                    } else {
                      btnClass = "bg-slate-900/50 border-slate-800/50 text-slate-600 opacity-40 scale-[0.98]";
                    }
                  } else if (isEliminated) {
                    btnClass = "opacity-0 pointer-events-none"; // Hidden logic for eliminated options
                  }

                  return (
                    <motion.button
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: isEliminated ? 0 : 1, y: 0, scale: selectedOption && isCorrectAnswer ? 1.02 : selectedOption && !isSelected ? 0.98 : 1 }}
                      transition={{ 
                        opacity: { delay: isEliminated ? 0 : i * 0.08, duration: 0.3 }, 
                        y: { delay: isEliminated ? 0 : i * 0.08, duration: 0.3 },
                        scale: { duration: 0.3 }
                      }}
                      key={opt}
                      onClick={() => handleGuess(opt)}
                      disabled={selectedOption !== null || status === 'paused' || isEliminated}
                      className={`relative min-h-[3rem] sm:min-h-[4.5rem] px-2 sm:px-5 py-2 sm:py-4 text-center sm:text-left font-bold text-[10.5px] sm:text-[14px] leading-tight sm:leading-snug rounded-xl sm:rounded-2xl border transition-all duration-300 flex items-center justify-center sm:justify-start group overflow-hidden backdrop-blur-md ${btnClass} ${status === 'paused' ? 'blur-sm pointer-events-none opacity-50 text-transparent' : ''}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                      <span className="relative z-10 leading-tight block">{opt}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Added Game Controls Below Options */}
              <div className="flex shrink-0 gap-2 sm:gap-4 mt-2 sm:mt-5 w-full max-w-xl justify-center">
                <button 
                  onClick={() => {
                    if (status === 'playing') setStatus('paused');
                    setShowQuitConfirm(true);
                  }}
                  disabled={selectedOption !== null}
                  className={`flex flex-col items-center justify-center transition-colors w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border border-transparent ${selectedOption !== null ? 'text-slate-600 opacity-50 cursor-not-allowed' : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800/50 hover:border-white/5'}`}
                  title="Quit Game"
                >
                  <Home className="w-4 h-4 sm:w-6 sm:h-6 mb-0.5 sm:mb-1" />
                  <span className="text-[8px] sm:text-[10px] font-bold tracking-wider">HOME</span>
                </button>
                <button 
                  onClick={togglePause}
                  disabled={selectedOption !== null}
                  className={`flex flex-col items-center justify-center transition-colors w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border border-transparent mx-1 sm:mx-2 ${selectedOption !== null ? 'text-slate-600 opacity-50 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800/50 hover:border-white/5'}`}
                  title="Pause Game"
                >
                  {status === 'paused' ? <Play className="w-4 h-4 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 ml-1" /> : <Pause className="w-4 h-4 sm:w-6 sm:h-6 mb-0.5 sm:mb-1" />}
                  <span className="text-[8px] sm:text-[10px] font-bold tracking-wider">{status === 'paused' ? 'RESUME' : 'PAUSE'}</span>
                </button>
                <button 
                  onClick={useHint}
                  disabled={hintUsed || stats.score < hintCost || status === 'paused' || selectedOption !== null}
                  className={`flex flex-col items-center justify-center transition-all w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border group relative ${
                    hintUsed || stats.score < hintCost || selectedOption !== null
                      ? 'text-slate-600 bg-slate-900/30 border-white/5 cursor-not-allowed'
                      : 'text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 bg-amber-500/5 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.05)] hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  }`}
                  title={`Use Hint (-${hintCost} points)`}
                >
                  <Lightbulb className={`w-4 h-4 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 ${!hintUsed && stats.score >= hintCost && selectedOption === null && status !== 'paused' ? 'animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''}`} />
                  <span className="text-[8px] sm:text-[10px] font-bold tracking-wider relative z-10 w-full text-center">
                    {hintUsed ? 'USED' : `-${hintCost}`}
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {status === 'end' && (
            <GameOverScreen 
              key="end" 
              stats={stats} 
              onRestart={startGame} 
              bestScore={bestScore}
              isNewHighScore={isNewHighScore}
              onHome={() => setStatus('start')}
              numOptions={numOptions}
              customTime={customTime}
              pools={pools}
              playerName={playerName}
              playerId={playerId}
              onViewLeaderboard={() => setShowLeaderboard(true)}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Update Available Modal */}
      <AnimatePresence>
        {showUpdatePopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Update</h3>
              <p className="text-slate-400 mb-6 text-sm">
                New card has been added. Please update your card pool so see it!
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowUpdatePopup(false)}
                  className="flex-1 py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quit Confirmation Modal */}
      <AnimatePresence>
        {showQuitConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-4">
                <Home className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Quit Game?</h3>
              <p className="text-slate-400 mb-6 text-sm">
                Are you sure you want to go back to the start menu? Your current progress will be lost.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowQuitConfirm(false)}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowQuitConfirm(false);
                    setStatus('start');
                  }}
                  className="flex-1 py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-rose-500/20"
                >
                  Quit Game
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex flex-col items-center w-full overflow-y-auto custom-scrollbar">
                <div className="flex flex-col items-center w-full p-6">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4 shrink-0">
                <Lightbulb className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 text-center">How to Play</h3>
              <div className="text-slate-400 mb-6 text-sm space-y-4 text-left w-full">
                <p className="text-center">
                  Guess the card name before the times run out.
                </p>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <h4 className="font-bold text-slate-200 mb-2 flex items-center justify-start">
                    <Star className="w-4 h-4 mr-2 text-emerald-400" /> Points System
                  </h4>
                  <ul className="list-disc list-outside pl-4 space-y-1 text-slate-300">
                    <li>Faster correct guesses give more points (up to 100).</li>
                    <li>Streak multiplier increase the point gain.</li>
                    <li>Incorrect guesses break your streak.</li>
                    <li>Every 10x Streak add extra 10 second to the timer.</li>
                  </ul>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <h4 className="font-bold text-slate-200 mb-2 flex items-center justify-start">
                    <Gamepad2 className="w-4 h-4 mr-2 text-indigo-400" /> Controls
                  </h4>
                  <ul className="space-y-3 text-slate-300">
                    <li className="flex items-start">
                      <div className="bg-amber-500/10 p-1.5 rounded-lg mr-3 shrink-0"><Lightbulb className="w-4 h-4 text-amber-400" /></div>
                      <span><strong>Use Hint:</strong> Remove half of the wrong option at exchange of the point reduction.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-indigo-500/10 p-1.5 rounded-lg mr-3 shrink-0"><Pause className="w-4 h-4 text-indigo-400" /></div>
                      <span><strong>Pause:</strong> Pause the game.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-rose-500/10 p-1.5 rounded-lg mr-3 shrink-0"><Home className="w-4 h-4 text-rose-400" /></div>
                      <span><strong>Home:</strong> Back to main menu.</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4 w-full mt-2">
                <label className="flex items-center gap-2 text-slate-400 text-sm cursor-pointer select-none hover:text-slate-300 transition-colors self-start ml-1">
                  <input 
                    type="checkbox" 
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-indigo-500/50 cursor-pointer"
                  />
                  <span>Don't show this again</span>
                </label>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowTutorial(false)}
                    className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={startNewGameInternal}
                    className="flex-1 py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    Start Game
                  </button>
                </div>
              </div>
              </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Easter Egg Modal */}
      <AnimatePresence>
        {showEasterEgg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 w-full max-w-sm shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-col items-center max-h-[90vh] overflow-y-auto relative overflow-hidden custom-scrollbar"
            >
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-900/0 to-slate-900/0"></div>
              
              <h3 className="text-xl font-bold text-white mb-2 text-center relative z-10">Whoops... you found the easter egg 🥚</h3>
              <p className="text-slate-400 mb-6 text-sm text-center relative z-10">also here your reward :</p>
              
              <div className="relative w-full aspect-[3/4] mb-6 rounded-xl overflow-hidden group border border-slate-700/50 shadow-lg bg-slate-800">
                <img 
                  src="https://dex-1101.github.io/19a152e/others/g451g5sg.webp" 
                  alt="Easter Egg Reward" 
                  className={`w-full h-full object-cover transition-all duration-700 ${revealEasterEgg ? 'blur-0 scale-100' : 'blur-xl scale-110 grayscale'}`}
                  crossOrigin="anonymous"
                />
                
                {!revealEasterEgg && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30">
                    <button 
                      onClick={() => setRevealEasterEgg(true)}
                      className="bg-slate-900/80 hover:bg-amber-500/20 text-white hover:text-amber-300 border border-white/10 hover:border-amber-500/50 backdrop-blur-md px-6 py-3 rounded-xl font-bold flex items-center transition-all shadow-xl hover:shadow-amber-500/20"
                    >
                      <Eye className="w-5 h-5 mr-2" /> REVEAL
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => {
                  setShowEasterEgg(false);
                  setRevealEasterEgg(false);
                }}
                disabled={easterEggCountdown > 0}
                className={`w-full py-3 px-4 rounded-xl font-bold transition-colors relative z-10 ${easterEggCountdown > 0 ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
              >
                {easterEggCountdown > 0 ? `Wait ${easterEggCountdown}s` : 'Close'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {(status === 'start' || status === 'end') && (
        <footer className="relative z-10 w-full text-center py-4 text-slate-500 text-sm">
          Made by <a href="https://github.com/DEX-1101" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            {history.length > 0 ? "x1101" : "Someone who refuses to read the card, then makes a Reddit post: 'wHy gAmE bUg?'"}
          </a>
        </footer>
      )}

      {/* Global Leaderboard Modal Render */}
      <LeaderboardModal 
         isOpen={showLeaderboard}
         onClose={() => setShowLeaderboard(false)}
         playerId={playerId}
      />

      {/* Background decoration for Dark Mode */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-rose-900/10 blur-[100px]"></div>
      </div>
      <Analytics />
    </div>
  );
}
