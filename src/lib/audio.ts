export let audioCtx: AudioContext | null = null;
let swapAudioBuffer: AudioBuffer | null = null;

export const initAudio = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    if (!swapAudioBuffer && audioCtx) {
      fetch('https://cdn.jsdelivr.net/gh/DEX-1101/czn-unigram@main/asset/send.wav')
        .then(res => res.arrayBuffer())
        .then(buf => audioCtx!.decodeAudioData(buf))
        .then(decoded => { swapAudioBuffer = decoded; })
        .catch(e => console.warn("Failed to load swap sound buffer", e));
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

const swapAudio = new Audio('https://cdn.jsdelivr.net/gh/DEX-1101/czn-unigram@main/asset/send.wav');
swapAudio.crossOrigin = 'anonymous';
swapAudio.volume = 0.5;

export const playSwapSound = () => {
  if (audioCtx && swapAudioBuffer) {
    try {
      const source = audioCtx.createBufferSource();
      source.buffer = swapAudioBuffer;
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0.5;
      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      source.start(0);
    } catch (e) {
      console.warn("Buffer play failed, using fallback", e);
      swapAudio.currentTime = 0;
      swapAudio.play().catch(err => console.warn("Swap sound failed to play", err));
    }
  } else {
    swapAudio.currentTime = 0;
    swapAudio.play().catch(e => console.warn("Swap sound failed to play", e));
  }
};
