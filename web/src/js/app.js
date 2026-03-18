import { initAudio, strumChord, getNoteName } from './guitar.js';
import { initTilt, isMouseMode } from './tilt.js';

const NUM_STRINGS = 6;
const NUM_FRETS = 5;
const fretboard = document.getElementById('fretboard');
const noteDisplay = document.getElementById('note-display');
const tiltInfo = document.getElementById('tilt-info');
const startBtn = document.getElementById('start');

let activeTouches = [];
let started = false;

function drawFretboard() {
  fretboard.innerHTML = '';
  const w = fretboard.clientWidth;
  const h = fretboard.clientHeight;
  const stringGap = h / (NUM_STRINGS + 1);
  const fretGap = w / NUM_FRETS;

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

  const stringNames = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
  for (let s = 0; s < NUM_STRINGS; s++) {
    const line = document.createElement('div');
    line.className = 'string-line';
    line.dataset.string = s;
    line.style.top = `${(s + 1) * stringGap}px`;
    line.style.height = `${2 + s * 0.8}px`;
    fretboard.appendChild(line);

    const label = document.createElement('div');
    label.className = 'string-label';
    label.style.top = `${(s + 1) * stringGap}px`;
    label.textContent = stringNames[s];
    fretboard.appendChild(label);
  }
}

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

function handleTouches(e) {
  e.preventDefault();
  activeTouches = [];
  for (const touch of e.touches) {
    const sf = posToStringFret(touch.clientX, touch.clientY);
    if (sf) activeTouches.push(sf);
  }
  updateTouchDots();
}

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

startBtn.addEventListener('click', () => {
  if (started) return;
  started = true;
  initAudio();

  // 시작 후 텍스트 숨기기
  document.getElementById('title').classList.add('hidden');
  document.getElementById('info').classList.add('hidden');
  startBtn.classList.add('hidden');

  drawFretboard();
  window.addEventListener('resize', drawFretboard);

  fretboard.addEventListener('touchstart', handleTouches);
  fretboard.addEventListener('touchmove', handleTouches);
  fretboard.addEventListener('touchend', (e) => {
    e.preventDefault();
    activeTouches = [];
    updateTouchDots();
  });

  fretboard.addEventListener('mousedown', handleMouseDown);
  fretboard.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  initTilt((direction, beta) => {
    if (activeTouches.length > 0) {
      strumChord(activeTouches, direction);
      tiltInfo.textContent = `스트럼!`;
    }
  });
});
