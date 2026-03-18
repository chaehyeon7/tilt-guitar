// Karplus-Strong 기타 합성
const NOTES = {
  'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00,
  'A3': 220.00, 'B3': 246.94, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63
};

const NOTE_NAMES = Object.keys(NOTES);
const NOTE_FREQS = Object.values(NOTES);

let audioCtx = null;

export function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

export function pluck(freq) {
  if (!audioCtx) return;

  const sampleRate = audioCtx.sampleRate;
  const bufferSize = Math.round(sampleRate / freq);
  const buffer = audioCtx.createBuffer(1, sampleRate * 2, sampleRate);
  const data = buffer.getChannelData(0);

  // 초기 노이즈 버스트
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  // Karplus-Strong: 이전 두 샘플 평균 + 감쇠
  for (let i = bufferSize; i < data.length; i++) {
    data[i] = (data[i - bufferSize] + data[i - bufferSize + 1]) * 0.498;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();
}

export function getNoteFromAngle(angle) {
  // -90 ~ 90도 → 0 ~ 14 인덱스
  const clamped = Math.max(-90, Math.min(90, angle));
  const idx = Math.round(((clamped + 90) / 180) * (NOTE_NAMES.length - 1));
  return { name: NOTE_NAMES[idx], freq: NOTE_FREQS[idx] };
}
