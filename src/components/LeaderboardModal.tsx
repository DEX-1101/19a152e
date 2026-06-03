import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  Loader2,
  Trophy,
  Target,
  Clock,
  CheckSquare,
  Flame,
  Hexagon,
  Crown,
  Medal,
  Award,
  RefreshCw,
} from "lucide-react";

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  maxStreak?: number;
  customTime?: number;
  numOptions?: number;
  pools?: {
    character?: boolean;
    neutral?: boolean;
    monster?: boolean;
    other?: boolean;
  };
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  playerId,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardConfigured, setLeaderboardConfigured] = useState<
    boolean | null
  >(null);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);

  const fetchLeaderboard = React.useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (data.isConfigured !== undefined) {
        setLeaderboardConfigured(data.isConfigured);
      }
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
      if (typeof data.totalPlayers === "number") {
        setTotalPlayers(data.totalPlayers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, fetchLeaderboard]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-slate-900 border border-amber-500/30 rounded-3xl p-3 sm:p-6 w-[95vw] max-w-lg md:max-w-xl shadow-[0_0_40px_rgba(245,158,11,0.2)] flex flex-col max-h-[85vh] overflow-hidden relative"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6 pb-4 border-b border-white/5 relative">
              <div
                className="flex items-center text-xl sm:text-2xl font-black tracking-tight cursor-pointer flex-wrap gap-x-3 gap-y-2"
                onClick={fetchLeaderboard}
              >
                <div className="flex items-center">
                  <motion.div
                    animate={{
                      color: ["#818cf8", "#c084fc", "#22d3ee", "#818cf8"],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "linear",
                    }}
                  >
                    <Globe className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 shrink-0" />
                  </motion.div>
                  <motion.span
                    className="text-transparent bg-clip-text bg-[linear-gradient(90deg,#818cf8,#c084fc,#22d3ee,#818cf8)] bg-[length:200%_auto]"
                    animate={{
                      backgroundPosition: ["0% center", "200% center"],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "linear",
                    }}
                  >
                    Global Leaderboard
                  </motion.span>
                </div>
                {totalPlayers >= 0 && (
                  <span className="text-[10px] sm:text-xs text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20 lowercase tracking-normal font-bold">
                    {totalPlayers} {totalPlayers === 1 ? "Player" : "Players"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchLeaderboard}
                  disabled={leaderboardLoading}
                  className="text-slate-400 hover:text-indigo-400 disabled:opacity-50 transition-colors p-2"
                  title="Refresh Leaderboard"
                >
                  <RefreshCw
                    className={`w-5 h-5 ${leaderboardLoading ? "animate-spin text-indigo-400" : ""}`}
                  />
                </button>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all p-2"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar flex-grow">
              {leaderboardLoading ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
                  <span className="font-medium animate-pulse">
                    Syncing Leaderboard...
                  </span>
                </div>
              ) : leaderboardConfigured === false ? (
                <div className="bg-rose-500/10 border border-rose-500/30 p-5 rounded-2xl text-left">
                  <h4 className="text-rose-400 font-bold mb-2 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Redis Not Configured
                  </h4>
                  <p className="text-slate-300 text-sm mb-3">
                    To make the global leaderboard work, you need to add your
                    Upstash Redis credentials.
                  </p>
                  <div className="bg-slate-900 rounded-lg p-3 text-xs font-mono text-slate-400 border border-slate-800">
                    UPSTASH_REDIS_REST_URL
                    <br />
                    UPSTASH_REDIS_REST_TOKEN
                  </div>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center bg-slate-800/30 rounded-2xl py-12 border border-slate-700/50">
                  <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <div className="text-slate-400 font-medium">
                    No scores yet.
                  </div>
                  <div className="text-sm text-slate-500">
                    Be the first to leave your mark!
                  </div>
                </div>
              ) : (
                leaderboard.map((entry, index) => (
                  <div
                    key={index}
                    className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col gap-1 sm:gap-2 relative overflow-hidden group transition-all ${index < 3 ? "bg-gradient-to-r border-t border-b" : "bg-slate-800/40 border border-slate-700/40"}`}
                    style={
                      index === 0
                        ? {
                            backgroundImage:
                              "linear-gradient(to right, rgba(251,191,36,0.1), rgba(217,119,6,0.05))",
                            borderColor: "rgba(251,191,36,0.2)",
                          }
                        : index === 1
                          ? {
                              backgroundImage:
                                "linear-gradient(to right, rgba(148,163,184,0.1), rgba(100,116,139,0.05))",
                              borderColor: "rgba(148,163,184,0.2)",
                            }
                          : index === 2
                            ? {
                                backgroundImage:
                                  "linear-gradient(to right, rgba(180,83,9,0.15), rgba(120,53,15,0.05))",
                                borderColor: "rgba(180,83,9,0.2)",
                              }
                            : {}
                    }
                  >
                    <div className="flex flex-row items-center gap-2 sm:gap-4">
                      <div
                        className={`w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-lg shadow-inner shrink-0 ${index === 0 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : index === 1 ? "bg-slate-300/20 text-slate-200 border border-slate-400/30" : index === 2 ? "bg-amber-700/20 text-amber-600 border border-amber-700/30" : "bg-slate-900 text-slate-400 border border-slate-700"}`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          {index === 0 ? (
                            <Crown className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)] shrink-0" />
                          ) : index === 1 ? (
                            <Medal className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-300 drop-shadow-[0_0_5px_rgba(203,213,225,0.6)] shrink-0" />
                          ) : index === 2 ? (
                            <Award className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-600 drop-shadow-[0_0_5px_rgba(180,83,9,0.5)] shrink-0" />
                          ) : null}
                          <div
                            className={`font-bold truncate max-w-[120px] sm:max-w-[200px] ${index < 3 ? "text-white text-sm sm:text-lg" : "text-slate-300 text-xs sm:text-base"}`}
                          >
                            {entry.name}
                          </div>
                          {entry.id === playerId && (
                            <span className="text-[8px] sm:text-[10px] text-indigo-400 bg-indigo-500/10 px-1 sm:px-1.5 py-0 sm:py-0.5 rounded border border-indigo-500/20 font-bold uppercase tracking-wider shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        {/* Add options metadata */}
                        {(entry.maxStreak !== undefined ||
                          entry.customTime !== undefined) && (
                          <div className="flex flex-wrap gap-1 sm:gap-2 mt-1 sm:mt-1.5 text-[8px] sm:text-[10px] font-medium text-slate-400">
                            {entry.customTime !== undefined && (
                              <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900/50 px-1 sm:px-2 py-0.5 rounded-md border border-slate-700/50">
                                <Clock className="w-2 h-2 sm:w-3 sm:h-3" />{" "}
                                {entry.customTime}s
                              </div>
                            )}
                            {entry.numOptions !== undefined && (
                              <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900/50 px-1 sm:px-2 py-0.5 rounded-md border border-slate-700/50">
                                <CheckSquare className="w-2 h-2 sm:w-3 sm:h-3" />{" "}
                                {entry.numOptions} opts
                              </div>
                            )}
                            {entry.maxStreak !== undefined && (
                              <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900/50 px-1 sm:px-2 py-0.5 rounded-md border border-slate-700/50">
                                <Flame className="w-2 h-2 sm:w-3 sm:h-3 text-rose-500" />{" "}
                                {entry.maxStreak} streak
                              </div>
                            )}
                            {entry.pools !== undefined && (
                              <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900/50 px-1 sm:px-2 py-0.5 rounded-md border border-slate-700/50">
                                <Hexagon className="w-2 h-2 sm:w-3 sm:h-3 text-indigo-400" />
                                {entry.pools.character &&
                                entry.pools.neutral &&
                                entry.pools.monster &&
                                entry.pools.other
                                  ? "ALL"
                                  : [
                                      entry.pools.character && "CH",
                                      entry.pools.neutral && "NE",
                                      entry.pools.monster && "MO",
                                      entry.pools.other && "OT",
                                    ]
                                      .filter(Boolean)
                                      .join(",")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div
                        className={`font-black text-right shrink-0 flex items-center justify-center ${index === 0 ? "text-amber-400 text-xl sm:text-3xl" : index < 3 ? "text-white text-lg sm:text-2xl" : "text-slate-400 text-base sm:text-xl"} ${entry.id === playerId ? "bg-orange-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border-2 border-orange-500 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.4)]" : ""}`}
                      >
                        {entry.score.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
