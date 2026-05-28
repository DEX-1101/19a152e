export interface CardData {
  originalName: string;
  name: string; // without extension
  imageUrl: string;
}

export interface GameStats {
  score: number;
  correctGuesses: number;
  totalGuesses: number;
  timeTaken: number; // total time taken in seconds
  currentStreak: number;
  maxStreak: number;
}

export interface BestScoreData {
  score: number;
  numOptions: number;
  customTime: number;
  pools: { character?: boolean; neutral?: boolean; monster?: boolean };
  maxStreak: number;
  correctGuesses: number;
  totalGuesses: number;
  timeTaken: number;
}
