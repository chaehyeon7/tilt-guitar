import { initAudio, strumChord, getNoteName, buildFullChord } from './guitar.js';
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

function updateDisplay() {
  fretboard.querySelectorAll('.touch-dot').forEach(d => d.remove());

  // 모든 줄 활성화 (개방현 포함)
  fretboard.querySelectorAll('.string-line').forEach(l => l.classList.add('active'));

  const rect = fretboard.getBoundingClientRect();
  const stringGap = rect.height / (NUM_STRINGS + 1);
  const fretGap = rect.width / NUM_FRETS;

  // 터치한 위치만 도트 표시
  activeTouches.forEach(t => {
    const dot = document.createElement('div');
    dot.className = 'touch-dot';
    dot.style.left = `${t.fret * fretGap + fretGap / 2}px`;
    dot.style.top = `${(t.stringIdx + 1) * stringGap}px`;
    fretboard.appendChild(dot);
  });

  // 6줄 전체 음 표시
  const chord = buildFullChord(activeTouches);
  noteDisplay.textContent = chord
    .map(t => getNoteName(t.stringIdx, t.fret))
    .join(' + ');
}

function clearDisplay() {
  fretboard.querySelectorAll('.touch-dot').forEach(d => d.remove());
  fretboard.querySelectorAll('.string-line').forEach(l => l.classList.remove('active'));
  noteDisplay.textContent = '';
}

function handleTouches(e) {
  e.preventDefault();
  activeTouches = [];
  for (const touch of e.touches) {
    const sf = posToStringFret(touch.clientX, touch.clientY);
    if (sf) activeTouches.push(sf);
  }
  updateDisplay();
}

let mouseDown = false;
function handleMouseDown(e) {
  mouseDown = true;
  activeTouches = [];
  const sf = posToStringFret(e.clientX, e.clientY);
  if (sf) activeTouches.push(sf);
  updateDisplay();
}
function handleMouseMove(e) {
  if (!mouseDown) return;
  const sf = posToStringFret(e.clientX, e.clientY);
  if (sf && !activeTouches.find(t => t.stringIdx === sf.stringIdx && t.fret === sf.fret)) {
    activeTouches.push(sf);
    updateDisplay();
  }
}
function handleMouseUp() {
  mouseDown = false;
  activeTouches = [];
  clearDisplay();
}

startBtn.addEventListener('click', () => {
  if (started) return;
  started = true;
  initAudio();

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
    clearDisplay();
  });

  fretboard.addEventListener('mousedown', handleMouseDown);
  fretboard.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  initTilt((direction, beta) => {
    if (activeTouches.length > 0) {
      const chord = strumChord(activeTouches, direction);
      tiltInfo.textContent = 'strum!';
    }
  });
});
