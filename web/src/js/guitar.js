// Karplus-Strong 기타 합성
// 표준 튜닝 기타: 6줄 x 프렛 0~4
// 줄: E2(82.41), A2(110), D3(146.83), G3(196), B3(246.94), E4(329.63)

const OPEN_STRINGS = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41]; // 1번줄~6번줄
const SEMITONE = Math.pow(2, 1 / 12);

let audioCtx = null;

export function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

export function getFreq(stringIdx, fret) {
  return OPEN_STRINGS[stringIdx] * Math.pow(SEMITONE, fret);
}

export function getNoteName(stringIdx, fret) {
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const base = [64, 59, 55, 50, 45, 40]; // MIDI numbers for open strings
  const midi = base[stringIdx] + fret;
  return names[midi % 12] + Math.floor(midi / 12 - 1);
}

export function pluck(freq, volume = 0.8) {
  if (!audioCtx) return;

  const sampleRate = audioCtx.sampleRate;
  const bufferSize = Math.round(sampleRate / freq);
  const duration = 2;
  const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * volume;
  }

  for (let i = bufferSize; i < data.length; i++) {
    data[i] = (data[i - bufferSize] + data[i - bufferSize + 1]) * 0.498;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();
}

export function strumChord(touches, direction = 1) {
  if (!touches.length) return;
  const sorted = direction > 0
    ? [...touches].sort((a, b) => b.stringIdx - a.stringIdx)
    : [...touches].sort((a, b) => a.stringIdx - b.stringIdx);

  sorted.forEach((t, i) => {
    const freq = getFreq(t.stringIdx, t.fret);
    setTimeout(() => pluck(freq), i * 30);
  });
}
