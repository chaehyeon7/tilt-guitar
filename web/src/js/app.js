import { initAudio, pluck, getNoteFromAngle } from './guitar.js';
import { initTilt, isMouseMode } from './tilt.js';

const noteEl = document.getElementById('note');
const angleEl = document.getElementById('angle');
const startBtn = document.getElementById('start');

let lastNote = '';
let started = false;

startBtn.addEventListener('click', () => {
  if (started) return;
  started = true;
  initAudio();
  startBtn.textContent = isMouseMode() ? '마우스로 조작 중' : '기울여서 연주하세요';
  startBtn.disabled = true;

  initTilt((angle) => {
    const { name, freq } = getNoteFromAngle(angle);
    angleEl.textContent = `각도: ${Math.round(angle)}°`;

    if (name !== lastNote) {
      lastNote = name;
      noteEl.textContent = name;
      pluck(freq);
    }
  });
});
