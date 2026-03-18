import { initAudio, strumChord, getNoteName } from './guitar.js';
import { initTilt, isMouseMode } from './tilt.js';

const NUM_STRINGS = 6;
const NUM_FRETS = 5; // 0(개방현) ~ 4
const fretboard = document.getElementById('fretboard');
const noteDisplay = document.getElementById('note-display');
const tiltInfo = document.getElementById('tilt-info');
const startBtn = document.getElementById('start');

let activeTouches = []; // [{stringIdx, fret}]
let started = false;

// --- 지판 그리기 ---
function drawFretboard() {
  const w = fretboard.clientWidth;
  const h = fretboard.clientHeight;
  const stringGap = h / (NUM_STRINGS + 1);
  const fretGap = w / NUM_FRETS;

  // 프렛 선
  for (let f = 1; f < NUM_FRETS; f++) {
    const line = document.createElement('div');
    line.className = 'fret-line';
    line.style.left = `${f * fretGap}px`;
    fretboard.appendChild(line);

    const label = document.createElement('div');
    label.className = 'fret-label';
    label.style.left = `${f * fretGap}px`;
    label.textContent = f;
    fretboard.appendChild(label);
  }

  // 줄
  const stringNames = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
  for (let s = 0; s < NUM_STRINGS; s++) {
    const line = document.createElement('div');
    line.className = 'string-line';
    line.dataset.string = s;
    line.style.top = `${(s + 1) * stringGap}px`;
    line.style.height = `${1 + s * 0.5}px`; // 아래줄일수록 두꺼움
    fretboard.appendChild(line);

    const label = document.createElement('div');
    label.className = 'string-label';
    label.style.top = `${(s + 1) * stringGap}px`;
    label.textContent = stringNames[s];
    fretboard.appendChild(label);
  }
}

// --- 터치 → 줄/프렛 매핑 ---
function posToStringFret(x, y) {
  const rect = fretboard.getBoundingClientRect();
  const relX = x - rect.left;
  const relY = y - rect.top;
  const stringGap = rect.height / (NUM_STRINGS + 1);
  const fretGap = rect.width / NUM_FRETS;

  const stringIdx = Math.round(relY / stringGap) - 1;
  const fret = Math.floor(relX / fretGap);

  if (stringIdx < 0 || stringIdx >= NUM_STRINGS) return null;
  if (fret < 0 || fret >= NUM_FRETS) return null;
  return { stringIdx, fret };
}

// --- 터치 표시 ---
function updateTouchDots() {
  fretboard.querySelectorAll('.touch-dot').forEach(d => d.remove());
  fretboard.querySelectorAll('.string-line').forEach(l => l.classList.remove('active'));

  const rect = fretboard.getBoundingClientRect();
  const stringGap = rect.height / (NUM_STRINGS + 1);
  const fretGap = rect.width / NUM_FRETS;

  activeTouches.forEach(t => {
    const dot = document.createElement('div');
    dot.className = 'touch-dot';
    dot.style.left = `${t.fret * fretGap + fretGap / 2}px`;
    dot.style.top = `${(t.stringIdx + 1) * stringGap}px`;
    fretboard.appendChild(dot);

    const line = fretboard.querySelector(`.string-line[data-string="${t.stringIdx}"]`);
    if (line) line.classList.add('active');
  });

  noteDisplay.textContent = activeTouches
    .map(t => getNoteName(t.stringIdx, t.fret))
    .join(' + ') || '';
}

// --- 멀티터치 이벤트 ---
function handleTouches(e) {
  e.preventDefault();
  activeTouches = [];
  for (const touch of e.touches) {
    const sf = posToStringFret(touch.clientX, touch.clientY);
    if (sf) activeTouches.push(sf);
  }
  updateTouchDots();
}

// 마우스 폴백 (데스크톱)
let mouseDown = false;
function handleMouseDown(e) {
  mouseDown = true;
  activeTouches = [];
  const sf = posToStringFret(e.clientX, e.clientY);
  if (sf) activeTouches.push(sf);
  updateTouchDots();
}
function handleMouseMove(e) {
  if (!mouseDown) return;
  const sf = posToStringFret(e.clientX, e.clientY);
  if (sf && !activeTouches.find(t => t.stringIdx === sf.stringIdx && t.fret === sf.fret)) {
    activeTouches.push(sf);
    updateTouchDots();
  }
}
function handleMouseUp() {
  mouseDown = false;
  activeTouches = [];
  updateTouchDots();
}

// --- 시작 ---
startBtn.addEventListener('click', () => {
  if (started) return;
  started = true;
  initAudio();

  drawFretboard();

  // 터치 이벤트
  fretboard.addEventListener('touchstart', handleTouches);
  fretboard.addEventListener('touchmove', handleTouches);
  fretboard.addEventListener('touchend', (e) => {
    e.preventDefault();
    activeTouches = [];
    updateTouchDots();
  });

  // 마우스 폴백
  fretboard.addEventListener('mousedown', handleMouseDown);
  fretboard.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  initTilt((direction, beta) => {
    if (activeTouches.length > 0) {
      strumChord(activeTouches, direction);
      tiltInfo.textContent = `기울기: ${beta}° | 스트럼!`;
    } else {
      tiltInfo.textContent = `기울기: ${beta}°`;
    }
  });

  startBtn.textContent = isMouseMode() ? '줄 잡고 클릭하여 연주' : '줄 잡고 기울여서 연주';
  startBtn.disabled = true;
});
