export let audioCtx: AudioContext | null = null;

export const initAudio = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (e) {
    console.warn("Web Audio API not supported", e);
  }
};

export const playCorrectSound = () => {
  if (!audioCtx) return;
  
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(800, t + 0.05);
  
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
  
  osc.start(t);
  osc.stop(t + 0.1);
};

export const playIncorrectSound = () => {
  if (!audioCtx) return;
  
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  // Use a lower pitch for 'thud'
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
  
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.2, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
  
  osc.start(t);
  osc.stop(t + 0.15);
};

const swapAudio = new Audio('https://github.com/DEX-1101/czn-unigram/raw/refs/heads/main/asset/send.wav');
swapAudio.volume = 0.5;

export const playSwapSound = () => {
  swapAudio.currentTime = 0;
  swapAudio.play().catch(e => console.warn("Swap sound failed to play", e));
};
